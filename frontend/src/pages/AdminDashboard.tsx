/**
 * AdminDashboard
 *
 * Protected admin area. Displays pending contributions from Firestore.
 * Only reachable after passing AdminGuard (auth + admins/{uid} check).
 *
 * Approve: opens a dialog to enter latitude/longitude, then atomically
 *   creates a place document and marks the contribution as approved.
 * Reject: shows a confirmation dialog, then marks the contribution as rejected.
 */

import { useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import {
  Shield, LogOut, AlertCircle, Inbox,
  CheckCircle2, XCircle, Phone, Globe,
  MapPin, User, Mail, FileText, Loader2,
  Check, X,
} from 'lucide-react'
import { auth } from '@/lib/firebase'
import { Button }    from '@/components/ui/button'
import { Badge }     from '@/components/ui/badge'
import { Skeleton }  from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Input }     from '@/components/ui/input'
import { Label }     from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast }  from '@/hooks/use-toast'
import { toast } from '@/hooks/use-toast'
import { useAdminAuth }            from '@/hooks/useAdminAuth'
import { usePlace } from '@/hooks/usePlaces'
import { usePendingPlaceReports, useReviewedPlaceReports, useReviewPlaceReport } from '@/hooks/usePlaceReports'
import {
  usePendingContributions,
  useApproveContribution,
  useRejectContribution,
  usePlacesForDuplicateCheck,
} from '@/hooks/useContributions'
import { categoryLabel, getRelativeDate } from '@/lib/utils'
import {
  findDuplicateCandidates,
  type DuplicateCandidate,
} from '@/lib/duplicateDetection'
import type { Contribution, Place } from '@/types'
import type { VerificationRequest } from '@/types'
import type { PlaceReport, PlaceReportChanges, PlaceReportField, PlaceReportValue } from '@/types'
import { usePendingVerificationRequests, useReviewedVerificationRequests, useReviewVerificationRequest } from '@/hooks/useContributions'

// ─── helpers ────────────────────────────────────────────────────────────────

const ACCESSIBILITY_LABELS: Record<keyof Contribution['accessibility'], string> = {
  wheelchairEntrance: 'Wheelchair Entrance',
  ramp:               'Ramp',
  elevator:           'Elevator',
  accessibleToilet:   'Accessible Toilet',
  accessibleParking:  'Accessible Parking',
  tactilePaving:      'Tactile Paving',
  audioAssistance:    'Audio Assistance',
}

/**
 * Translate a Firestore error code or our own sentinel string into a
 * user-facing message.
 */
function describeError(error: unknown): string {
  const msg  = (error as Error)?.message ?? ''
  const code = (error as { code?: string })?.code ?? ''

  if (msg === 'report-not-found') return 'This report no longer exists.'
  if (msg === 'report-already-reviewed') return 'This report has already been reviewed.'
  if (msg === 'report-place-not-found') return 'The associated place no longer exists.'
  if (msg === 'report-place-changed') return 'The place changed while you were reviewing this report. Reload the dashboard and review the current values.'
  if (msg.startsWith('report-')) return 'The report changes or rejection reason are invalid. Review the entered values and try again.'
  if (msg === 'contribution-not-found')        return 'This contribution no longer exists.'
  if (msg === 'contribution-already-reviewed') return 'This contribution was already approved or rejected.'
  if (msg.startsWith('invalid-coordinates'))   return msg.replace('invalid-coordinates: ', '')
  if (code === 'permission-denied')            return 'Permission denied. Make sure you are signed in as an admin.'
  if (code === 'failed-precondition')          return 'A required Firestore index is missing. Check the browser console.'
  return 'An unexpected error occurred. Check the browser console for details.'
}

// ─── Duplicate warning panel ──────────────────────────────────────────────────

interface DuplicateWarningProps {
  candidates: DuplicateCandidate[]
}

function DuplicateWarning({ candidates }: DuplicateWarningProps) {
  if (candidates.length === 0) return null

  return (
    <div className="rounded-md border border-yellow-400/50 bg-yellow-50 dark:bg-yellow-950/30 px-3 py-2.5 space-y-2">
      <div className="flex items-start gap-2">
        <AlertCircle
          className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">
          {candidates.length === 1
            ? 'A similar place may already exist'
            : `${candidates.length} similar places may already exist`}
        </p>
      </div>
      <ul className="space-y-1.5 pl-6">
        {candidates.map(({ place, nameMatch, proximityMatch, distanceMetres }) => (
          <li key={place.id} className="text-xs text-yellow-900 dark:text-yellow-200">
            <span className="font-medium">{place.name}</span>
            {' — '}
            <span className="text-yellow-700 dark:text-yellow-400">
              {place.area}{place.address ? `, ${place.address}` : ''}
            </span>
            <span className="ml-1.5 inline-flex flex-wrap gap-1">
              {nameMatch && (
                <span className="inline-block rounded bg-yellow-200 dark:bg-yellow-800 px-1 py-0.5 text-[10px] font-medium text-yellow-900 dark:text-yellow-100">
                  same name
                </span>
              )}
              {proximityMatch && distanceMetres !== null && (
                <span className="inline-block rounded bg-yellow-200 dark:bg-yellow-800 px-1 py-0.5 text-[10px] font-medium text-yellow-900 dark:text-yellow-100">
                  {distanceMetres < 1
                    ? '<1 m away'
                    : `${Math.round(distanceMetres)} m away`}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="pl-6 text-xs text-yellow-700 dark:text-yellow-400">
        You can still approve if this is genuinely a different place.
      </p>
    </div>
  )
}

// ─── Approve dialog ───────────────────────────────────────────────────────────

interface ApproveDialogProps {
  contribution: Contribution | null
  onClose: () => void
}

function ApproveDialog({ contribution, onClose }: ApproveDialogProps) {
  const { toast }  = useToast()
  const approveMut = useApproveContribution()

  const [latStr, setLatStr] = useState('')
  const [lngStr, setLngStr] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ lat?: string; lng?: string }>({})

  const isOpen    = contribution !== null
  const isPending = approveMut.isPending

  // ── Duplicate detection ───────────────────────────────────────────────────
  const { data: allPlaces } = usePlacesForDuplicateCheck()

  const parsedLat = parseFloat(latStr.trim())
  const parsedLng = parseFloat(lngStr.trim())
  const coordsValid =
    latStr.trim() !== '' &&
    lngStr.trim() !== '' &&
    Number.isFinite(parsedLat) &&
    Number.isFinite(parsedLng) &&
    parsedLat >= -90  && parsedLat <= 90 &&
    parsedLng >= -180 && parsedLng <= 180

  const duplicateCandidates: DuplicateCandidate[] =
    contribution && allPlaces && coordsValid
      ? findDuplicateCandidates(
          contribution.placeName,
          parsedLat,
          parsedLng,
          allPlaces,
        )
      : []

  // Reset local state when the dialog is closed/reopened
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setLatStr('')
      setLngStr('')
      setFieldErrors({})
      approveMut.reset()
      onClose()
    }
  }

  const validate = (): { lat: number; lng: number } | null => {
    const errors: { lat?: string; lng?: string } = {}

    const lat = parseFloat(latStr.trim())
    const lng = parseFloat(lngStr.trim())

    if (latStr.trim() === '' || !Number.isFinite(lat)) {
      errors.lat = 'Enter a valid number.'
    } else if (lat < -90 || lat > 90) {
      errors.lat = 'Latitude must be between -90 and 90.'
    }

    if (lngStr.trim() === '' || !Number.isFinite(lng)) {
      errors.lng = 'Enter a valid number.'
    } else if (lng < -180 || lng > 180) {
      errors.lng = 'Longitude must be between -180 and 180.'
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return null
    return { lat, lng }
  }

  const handleApprove = async () => {
    if (!contribution) return
    const coords = validate()
    if (!coords) return

    try {
      await approveMut.mutateAsync({
        contributionId: contribution.id,
        latitude:       coords.lat,
        longitude:      coords.lng,
      })
      toast({
        title:       'Contribution approved',
        description: `"${contribution.placeName}" has been added to the map.`,
      })
      handleOpenChange(false)
    } catch (err) {
      // Error is shown inside the dialog via approveMut.error
      console.error('[AdminDashboard] approve failed:', err)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approve contribution</DialogTitle>
          <DialogDescription>
            Enter the coordinates for{' '}
            <span className="font-medium text-foreground">
              {contribution?.placeName}
            </span>
            . These are required to place it on the map.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Latitude */}
          <div className="space-y-1.5">
            <Label htmlFor="approve-lat">
              Latitude <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="approve-lat"
              type="number"
              step="any"
              placeholder="e.g. 22.3569"
              value={latStr}
              onChange={e => {
                setLatStr(e.target.value)
                setFieldErrors(prev => ({ ...prev, lat: undefined }))
              }}
              disabled={isPending}
              aria-invalid={Boolean(fieldErrors.lat)}
              aria-describedby={fieldErrors.lat ? 'approve-lat-error' : undefined}
            />
            {fieldErrors.lat && (
              <p id="approve-lat-error" className="text-xs text-destructive" role="alert">
                {fieldErrors.lat}
              </p>
            )}
          </div>

          {/* Longitude */}
          <div className="space-y-1.5">
            <Label htmlFor="approve-lng">
              Longitude <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="approve-lng"
              type="number"
              step="any"
              placeholder="e.g. 91.8123"
              value={lngStr}
              onChange={e => {
                setLngStr(e.target.value)
                setFieldErrors(prev => ({ ...prev, lng: undefined }))
              }}
              disabled={isPending}
              aria-invalid={Boolean(fieldErrors.lng)}
              aria-describedby={fieldErrors.lng ? 'approve-lng-error' : undefined}
            />
            {fieldErrors.lng && (
              <p id="approve-lng-error" className="text-xs text-destructive" role="alert">
                {fieldErrors.lng}
              </p>
            )}
          </div>

          {/* Duplicate-place warning */}
          <DuplicateWarning candidates={duplicateCandidates} />

          {/* Firestore error */}
          {approveMut.isError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-destructive" role="alert">
                {describeError(approveMut.error)}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleApprove()}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                Approving…
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                Approve
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Reject dialog ────────────────────────────────────────────────────────────

interface RejectDialogProps {
  contribution: Contribution | null
  onClose: () => void
}

function RejectDialog({ contribution, onClose }: RejectDialogProps) {
  const { toast } = useToast()
  const rejectMut = useRejectContribution()

  const isOpen    = contribution !== null
  const isPending = rejectMut.isPending

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      rejectMut.reset()
      onClose()
    }
  }

  const handleReject = async () => {
    if (!contribution) return
    try {
      await rejectMut.mutateAsync({ contributionId: contribution.id })
      toast({
        title:       'Contribution rejected',
        description: `"${contribution.placeName}" has been marked as rejected.`,
      })
      handleOpenChange(false)
    } catch (err) {
      console.error('[AdminDashboard] reject failed:', err)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject contribution?</DialogTitle>
          <DialogDescription>
            This will mark{' '}
            <span className="font-medium text-foreground">
              {contribution?.placeName}
            </span>{' '}
            as rejected. No place will be added to the map. This action cannot be undone from the app.
          </DialogDescription>
        </DialogHeader>

        {/* Firestore error */}
        {rejectMut.isError && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 mt-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-destructive" role="alert">
              {describeError(rejectMut.error)}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 mt-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleReject()}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                Rejecting…
              </>
            ) : (
              <>
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                Reject
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── ContributionCard ─────────────────────────────────────────────────────────

interface ContributionCardProps {
  c: Contribution
  onApprove: (c: Contribution) => void
  onReject:  (c: Contribution) => void
}

function ContributionCard({ c, onApprove, onReject }: ContributionCardProps) {
  const accessibilityEntries = Object.entries(c.accessibility) as [
    keyof Contribution['accessibility'],
    boolean,
  ][]

  return (
    <article
      aria-labelledby={`contrib-${c.id}-heading`}
      className="border border-border rounded-lg bg-card overflow-hidden"
    >
      {/* Card header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3
              id={`contrib-${c.id}-heading`}
              className="font-semibold text-foreground"
            >
              {c.placeName}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs font-normal">
                {categoryLabel(c.category)}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" aria-hidden="true" />
                {c.area}
              </span>
            </div>
          </div>
          <Badge variant="warning" className="shrink-0 text-xs">
            Pending review
          </Badge>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 space-y-4">
        {/* Location */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Address
          </p>
          <p className="text-sm text-foreground">{c.address}</p>
        </div>

        {/* Contact */}
        {(c.phone || c.website) && (
          <div className="flex flex-wrap gap-4">
            {c.phone && (
              <span className="text-sm text-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                {c.phone}
              </span>
            )}
            {c.website && (
              <a
                href={c.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                {c.website}
              </a>
            )}
          </div>
        )}

        <Separator />

        {/* Accessibility features */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Accessibility reported
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {accessibilityEntries.map(([key, value]) => (
              <div key={key as string} className="flex items-center gap-2 text-sm">
                {value ? (
                  <CheckCircle2
                    className="w-4 h-4 text-accent shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircle
                    className="w-4 h-4 text-muted-foreground/40 shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
                  {ACCESSIBILITY_LABELS[key]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {c.notes && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                Notes
              </p>
              <p className="text-sm text-foreground leading-relaxed">{c.notes}</p>
            </div>
          </>
        )}

        <Separator />

        {/* Reporter + timestamp */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {c.reporter.name && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" aria-hidden="true" />
                {c.reporter.name}
              </span>
            )}
            {c.reporter.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" aria-hidden="true" />
                {c.reporter.email}
              </span>
            )}
            {!c.reporter.name && !c.reporter.email && (
              <span className="italic">Anonymous submission</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            Submitted {getRelativeDate(c.createdAt.slice(0, 10))}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => onApprove(c)}
          >
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            onClick={() => onReject(c)}
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            Reject
          </Button>
        </div>
      </div>
    </article>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const authState = useAdminAuth()
  const navigate  = useNavigate()
  const { data: contributions, isLoading, isError, error } = usePendingContributions()
  const verificationQuery = usePendingVerificationRequests()
  const verificationHistoryQuery = useReviewedVerificationRequests()
  const verificationReview = useReviewVerificationRequest()
  const placeReportsQuery = usePendingPlaceReports()
  const placeReportsHistoryQuery = useReviewedPlaceReports()
  const placeReportReview = useReviewPlaceReport()

  // Which contribution is currently being acted on
  const [approveTarget, setApproveTarget] = useState<Contribution | null>(null)
  const [rejectTarget,  setRejectTarget]  = useState<Contribution | null>(null)
  const [verificationBusyId, setVerificationBusyId] = useState<string | null>(null)
  const [placeReportBusyId, setPlaceReportBusyId] = useState<string | null>(null)

  const handlePlaceReportReview = async (input: {
    report: PlaceReport
    decision: 'approved' | 'rejected'
    reason?: string
    expectedCurrentValues?: PlaceReportChanges
    approvedChanges?: PlaceReportChanges
  }) => {
    setPlaceReportBusyId(input.report.id)
    try {
      await placeReportReview.mutateAsync({
        reportId: input.report.id,
        placeId: input.report.placeId,
        decision: input.decision,
        reason: input.reason,
        expectedCurrentValues: input.expectedCurrentValues,
        approvedChanges: input.approvedChanges,
      })
      toast({
        title: input.decision === 'approved' ? 'Report approved' : 'Report rejected',
        description: input.decision === 'approved'
          ? `Selected updates for "${input.report.placeName}" were applied.`
          : `The report for "${input.report.placeName}" was rejected and the reason was recorded.`,
      })
    } catch (reviewError) {
      toast({ title: 'Report review failed', description: describeError(reviewError), variant: 'destructive' })
      throw reviewError
    } finally {
      setPlaceReportBusyId(null)
    }
  }

  const handleVerificationReview = async (request: VerificationRequest, decision: 'approved' | 'rejected') => {
    setVerificationBusyId(request.id)
    try {
      await verificationReview.mutateAsync({ request, decision })
      toast({
        title: decision === 'approved' ? 'Verification approved' : 'Verification rejected',
        description: decision === 'approved'
          ? `Community confirmation for "${request.placeName}" is now recorded.`
          : `The verification request for "${request.placeName}" was marked as rejected.`,
      })
    } catch (reviewError) {
      const message = (reviewError as Error)?.message ?? ''
      const description = message.includes('already-reviewed')
        ? 'This request has already been reviewed.'
        : message.includes('place-not-found')
          ? 'The associated place no longer exists, so this request could not be reviewed.'
          : 'Review failed. Check your connection and try again.'
      toast({ title: 'Verification review failed', description, variant: 'destructive' })
    } finally {
      setVerificationBusyId(null)
    }
  }

  const handleSignOut = async () => {
    await signOut(auth)
    navigate('/admin/login', { replace: true })
  }

  const adminEmail =
    authState.status === 'admin' ? authState.user.email : null

  return (
    <main id="main-content" className="container mx-auto px-4 py-10 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
            aria-hidden="true"
          >
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
            {adminEmail && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Signed in as {adminEmail}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleSignOut()}
          className="gap-1.5 shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          Sign out
        </Button>
      </div>

      <section aria-labelledby="place-update-reports-heading" className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="place-update-reports-heading" className="text-sm font-semibold text-foreground">Place Update Reports</h2>
          {!placeReportsQuery.isLoading && !placeReportsQuery.isError && <span className="text-xs text-muted-foreground">{placeReportsQuery.data?.length ?? 0} awaiting review</span>}
        </div>
        {placeReportsQuery.isLoading && <div className="space-y-3"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>}
        {placeReportsQuery.isError && <p role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">Could not load place update reports. Confirm admin access and the reports Firestore index.</p>}
        {!placeReportsQuery.isLoading && !placeReportsQuery.isError && placeReportsQuery.data?.length === 0 && <p className="rounded-lg border border-border p-5 text-sm text-muted-foreground">No pending place update reports.</p>}
        <div className="space-y-3">
          {placeReportsQuery.data?.map(report => (
            <PlaceReportCard
              key={report.id}
              report={report}
              busy={placeReportBusyId === report.id}
              onReview={input => handlePlaceReportReview({ report, ...input })}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="place-update-reports-history-heading" className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="place-update-reports-history-heading" className="text-sm font-semibold text-foreground">Recent Place Update Report History</h2>
          {!placeReportsHistoryQuery.isLoading && !placeReportsHistoryQuery.isError && <span className="text-xs text-muted-foreground">Latest {placeReportsHistoryQuery.data?.length ?? 0}</span>}
        </div>
        {placeReportsHistoryQuery.isLoading && <Skeleton className="h-20 w-full" />}
        {placeReportsHistoryQuery.isError && <p role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">Could not load reviewed report history. Check the reports index and admin permissions.</p>}
        {!placeReportsHistoryQuery.isLoading && !placeReportsHistoryQuery.isError && placeReportsHistoryQuery.data?.length === 0 && <p className="rounded-lg border border-border p-5 text-sm text-muted-foreground">No reviewed place update reports yet.</p>}
        <div className="space-y-2">
          {placeReportsHistoryQuery.data?.map(report => (
            <article key={report.id} className="rounded-lg border border-border bg-card px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h3 className="text-sm font-medium text-foreground">{report.placeName}</h3><p className="text-xs text-muted-foreground">{report.category === 'accessibility' ? 'Accessibility' : 'Place details'} · {report.fields.join(', ')}</p></div>
                <div className="flex flex-wrap items-center gap-2"><Badge variant={report.status === 'approved' ? 'verified' : 'destructive'}>{report.status}</Badge><span className="text-xs text-muted-foreground">{report.reviewedAt ? `Reviewed ${getRelativeDate(report.reviewedAt.slice(0, 10))}` : 'Review date unavailable'} by {report.reviewedBy ?? 'unknown admin'}</span></div>
              </div>
              {report.rejectionReason && <p className="mt-2 text-xs text-muted-foreground"><span className="font-medium">Rejection reason: </span>{report.rejectionReason}</p>}
              {report.appliedChanges && <p className="mt-2 break-words text-xs text-muted-foreground"><span className="font-medium">Applied changes: </span>{Object.entries(report.appliedChanges).map(([field, value]) => `${field}: ${value ?? 'Not recorded'}`).join(' · ')}</p>}
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="verification-requests-heading" className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="verification-requests-heading" className="text-sm font-semibold text-foreground">Community Verification Requests</h2>
          {!verificationQuery.isLoading && !verificationQuery.isError && <span className="text-xs text-muted-foreground">{verificationQuery.data?.length ?? 0} awaiting review</span>}
        </div>
        {verificationQuery.isLoading && <div className="space-y-3"><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></div>}
        {verificationQuery.isError && <p role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">Could not load verification requests. Confirm the verificationRequests rules are deployed and any required Firestore index is available.</p>}
        {!verificationQuery.isLoading && !verificationQuery.isError && verificationQuery.data?.length === 0 && <p className="rounded-lg border border-border p-5 text-sm text-muted-foreground">No pending verification requests.</p>}
        <div className="space-y-3">
          {verificationQuery.data?.map(request => (
            <VerificationRequestCard key={request.id} request={request} busy={verificationBusyId === request.id} onReview={decision => void handleVerificationReview(request, decision)} />
          ))}
        </div>
      </section>

      <section aria-labelledby="verification-history-heading" className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="verification-history-heading" className="text-sm font-semibold text-foreground">Recent Verification History</h2>
          {!verificationHistoryQuery.isLoading && !verificationHistoryQuery.isError && <span className="text-xs text-muted-foreground">Latest {verificationHistoryQuery.data?.length ?? 0}</span>}
        </div>
        {verificationHistoryQuery.isLoading && <Skeleton className="h-20 w-full" />}
        {verificationHistoryQuery.isError && <p role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">Could not load reviewed verification history. Check the Firestore index and admin permissions.</p>}
        {!verificationHistoryQuery.isLoading && !verificationHistoryQuery.isError && verificationHistoryQuery.data?.length === 0 && <p className="rounded-lg border border-border p-5 text-sm text-muted-foreground">No reviewed verification requests yet.</p>}
        <div className="space-y-2">
          {verificationHistoryQuery.data?.map(request => (
            <article key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
              <div>
                <h3 className="text-sm font-medium text-foreground">{request.placeName}</h3>
                <p className="text-xs text-muted-foreground">Place ID: {request.placeId}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={request.status === 'approved' ? 'verified' : 'destructive'}>{request.status === 'approved' ? 'Approved' : 'Rejected'}</Badge>
                <span className="text-xs text-muted-foreground">{request.reviewedAt ? `Reviewed ${getRelativeDate(request.reviewedAt)}` : 'Review date unavailable'}</span>
                <span className="text-xs text-muted-foreground">by {request.reviewedBy ?? 'unknown admin'}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Section heading */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">
          Pending Contributions
        </h2>
        {!isLoading && !isError && contributions && (
          <span
            className="text-xs text-muted-foreground"
            aria-live="polite"
            aria-atomic="true"
          >
            {contributions.length === 0
              ? 'No pending submissions'
              : `${contributions.length} awaiting review`}
          </span>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4" aria-label="Loading contributions…">
          {[1, 2, 3].map(i => (
            <div key={i} className="border border-border rounded-lg p-4 space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-px w-full" />
              <div className="grid grid-cols-2 gap-2">
                {[1,2,3,4].map(j => <Skeleton key={j} className="h-4 w-full" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-6 flex items-start gap-3">
          <AlertCircle
            className="w-5 h-5 text-destructive shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Failed to load contributions
            </p>
            <p className="text-xs text-muted-foreground mb-1">
              {(error as { code?: string })?.code === 'failed-precondition'
                ? 'A Firestore composite index is required. See the project README or check the browser console for the index creation link.'
                : (error as { code?: string })?.code === 'permission-denied'
                ? 'Permission denied. Make sure you are signed in as an admin.'
                : 'A network or configuration error occurred. Check the browser console for details.'}
            </p>
            {(error as { code?: string })?.code && (
              <p className="text-xs font-mono text-muted-foreground/70">
                Error code: {(error as { code?: string }).code}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && contributions?.length === 0 && (
        <div className="border border-border rounded-lg p-10 text-center">
          <Inbox
            className="w-8 h-8 text-muted-foreground mx-auto mb-3"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-foreground mb-1">
            No pending contributions
          </p>
          <p className="text-xs text-muted-foreground">
            New place submissions will appear here for review.
          </p>
        </div>
      )}

      {/* Contribution list */}
      {!isLoading && !isError && contributions && contributions.length > 0 && (
        <div className="space-y-4" role="list" aria-label="Pending contributions">
          {contributions.map(c => (
            <div key={c.id} role="listitem">
              <ContributionCard
                c={c}
                onApprove={setApproveTarget}
                onReject={setRejectTarget}
              />
            </div>
          ))}
        </div>
      )}

      {/* Spinner for background refetch */}
      {!isLoading && !isError && (
        <div className="flex justify-center mt-6">
          <Loader2 className="w-4 h-4 text-muted-foreground/30 animate-spin" aria-hidden="true" />
        </div>
      )}

      {/* Dialogs — rendered once at page level, not per-card */}
      <ApproveDialog
        contribution={approveTarget}
        onClose={() => setApproveTarget(null)}
      />
      <RejectDialog
        contribution={rejectTarget}
        onClose={() => setRejectTarget(null)}
      />
    </main>
  )
}

const PLACE_REPORT_FIELD_LABELS: Record<PlaceReportField, string> = {
  name: 'Place name',
  address: 'Address',
  area: 'Area',
  phone: 'Phone',
  website: 'Website',
  openingHours: 'Opening hours',
  wheelchairEntrance: 'Wheelchair accessible entrance',
  ramp: 'Ramp',
  elevator: 'Elevator',
  accessibleToilet: 'Accessible toilet',
  accessibleParking: 'Accessible parking',
  tactilePaving: 'Tactile paving',
  audioAssistance: 'Audio assistance',
}

function currentPlaceReportValue(place: Place, field: PlaceReportField): PlaceReportValue {
  if (field in place.accessibility) return place.accessibility[field as keyof Place['accessibility']] ?? null
  return (place[field as 'name' | 'address' | 'area' | 'phone' | 'website' | 'openingHours'] ?? null) as string | null
}

function displayPlaceReportValue(value: PlaceReportValue): string {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  if (value === null || value === '') return 'Not recorded'
  return String(value)
}

function PlaceReportCard({ report, busy, onReview }: {
  report: PlaceReport
  busy: boolean
  onReview: (input: {
    decision: 'approved' | 'rejected'
    reason?: string
    expectedCurrentValues?: PlaceReportChanges
    approvedChanges?: PlaceReportChanges
  }) => Promise<void>
}) {
  const placeQuery = usePlace(report.placeId)
  const [approvedChanges, setApprovedChanges] = useState<PlaceReportChanges>({})
  const [rejectionReason, setRejectionReason] = useState('')
  const [dialogDecision, setDialogDecision] = useState<'approved' | 'rejected' | null>(null)
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    setApprovedChanges({})
    setValidationError('')
  }, [report.id, placeQuery.data?.id])

  const place = placeQuery.data
  const expectedCurrentValues: PlaceReportChanges | undefined = place
    ? Object.fromEntries(report.fields.map(field => [field, currentPlaceReportValue(place, field)])) as PlaceReportChanges
    : undefined

  const getValidatedChanges = (): PlaceReportChanges | null => {
    if (!place) return null
    const changes: PlaceReportChanges = {}
    for (const field of report.fields) {
      const value = approvedChanges[field]
      const isAccessibility = field in place.accessibility
      if (isAccessibility) {
        if (typeof value !== 'boolean' && value !== null) return null
        changes[field] = value
      } else {
        if (typeof value !== 'string' && value !== null) return null
        const trimmed = typeof value === 'string' ? value.trim() : ''
        const nullable = field === 'phone' || field === 'website' || field === 'openingHours'
        if (!trimmed && !nullable) return null
        changes[field] = trimmed || (nullable ? null : trimmed)
      }
    }
    return changes
  }

  const openApproval = () => {
    const changes = getValidatedChanges()
    if (!changes) {
      setValidationError('Enter a replacement value or explicitly choose a value for every reported field before approving.')
      return
    }
    setValidationError('')
    setDialogDecision('approved')
  }

  const confirmReview = async () => {
    try {
      if (dialogDecision === 'rejected') {
        const reason = rejectionReason.trim()
        if (!reason) {
          setValidationError('A rejection reason is required.')
          return
        }
        await onReview({ decision: 'rejected', reason })
      } else if (dialogDecision === 'approved') {
        const changes = getValidatedChanges()
        if (!changes || !expectedCurrentValues) return
        await onReview({ decision: 'approved', expectedCurrentValues, approvedChanges: changes })
      }
      setDialogDecision(null)
      setRejectionReason('')
      setValidationError('')
    } catch {
      // The dashboard handler already shows the Firebase or transaction error.
      // Keep the confirmation open so the admin can retry after correcting it.
    }
  }

  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{report.placeName}</h3>
          <p className="text-xs text-muted-foreground">Place ID: {report.placeId} · {report.category === 'accessibility' ? 'Accessibility' : 'Place details'} · Submitted {getRelativeDate(report.createdAt.slice(0, 10))}</p>
        </div>
        <Badge variant="warning">{report.status}</Badge>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">Reported fields: {report.fields.map(field => PLACE_REPORT_FIELD_LABELS[field]).join(', ')}</p>
      <p className="mb-3 whitespace-pre-wrap text-sm">{report.description}</p>
      <p className="mb-3 text-xs text-muted-foreground">{report.reporterUid ? `Reporter UID: ${report.reporterUid}` : 'Submitted without a signed-in UID'}</p>

      {placeQuery.isLoading && <Skeleton className="mb-3 h-20 w-full" />}
      {placeQuery.isError && <p role="alert" className="mb-3 text-sm text-destructive">Could not load current place values for this report.</p>}
      {!placeQuery.isLoading && !placeQuery.isError && !place && <p role="alert" className="mb-3 text-sm text-destructive">The associated place no longer exists. This report can be rejected with a reason.</p>}
      {place && (
        <div className="mb-4 space-y-3 rounded-md border border-border p-3">
          <p className="text-xs font-semibold">Current values and admin-approved replacements</p>
          {report.fields.map(field => {
            const currentValue = currentPlaceReportValue(place, field)
            const value = approvedChanges[field]
            const isAccessibility = field in place.accessibility
            const nullableText = field === 'phone' || field === 'website' || field === 'openingHours'
            return (
              <div key={field} className="grid gap-2 border-t border-border pt-3 sm:grid-cols-2">
                <p className="text-sm"><span className="font-medium">{PLACE_REPORT_FIELD_LABELS[field]} now: </span>{displayPlaceReportValue(currentValue)}</p>
                <div>
                  <Label htmlFor={`report-change-${report.id}-${field}`} className="text-xs">Replacement value</Label>
                  {isAccessibility ? (
                    <select
                      id={`report-change-${report.id}-${field}`}
                      value={value === undefined ? '' : value === null ? 'unknown' : String(value)}
                      onChange={event => setApprovedChanges(current => ({
                        ...current,
                        [field]: event.target.value === '' ? undefined : event.target.value === 'unknown' ? null : event.target.value === 'true',
                      }))}
                      disabled={busy || !place}
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Choose a replacement</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                      <option value="unknown">Not known / clear value</option>
                    </select>
                  ) : (
                    <>
                      <Input
                        id={`report-change-${report.id}-${field}`}
                        value={typeof value === 'string' ? value : ''}
                        onChange={event => setApprovedChanges(current => ({ ...current, [field]: event.target.value }))}
                        disabled={busy}
                        className="mt-1"
                        placeholder={nullableText ? 'Enter a value or choose Clear' : 'Enter the corrected value'}
                      />
                      {nullableText && <Button type="button" size="sm" variant="ghost" className="mt-1 h-7 px-2 text-xs" disabled={busy} onClick={() => setApprovedChanges(current => ({ ...current, [field]: null }))}>Clear this field</Button>}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {validationError && <p role="alert" className="mb-3 text-sm text-destructive">{validationError}</p>}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={busy || !place || placeQuery.isLoading || placeQuery.isError} onClick={openApproval}>{busy ? 'Saving…' : 'Approve and apply changes'}</Button>
        <Button size="sm" variant="outline" disabled={busy} className="text-destructive" onClick={() => { setValidationError(''); setDialogDecision('rejected') }}>Reject</Button>
      </div>

      <Dialog open={dialogDecision !== null} onOpenChange={open => { if (!open && !busy) setDialogDecision(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogDecision === 'approved' ? 'Apply approved report changes?' : 'Reject this report?'}</DialogTitle>
            <DialogDescription>
              {dialogDecision === 'approved'
                ? `This updates only the fields selected in the report for ${report.placeName}. The report and place update are committed together.`
                : `The report for ${report.placeName} will remain in admin history. Provide a reason for the rejection.`}
            </DialogDescription>
          </DialogHeader>
          {dialogDecision === 'approved' && <ul className="space-y-1 text-sm">{report.fields.map(field => <li key={field}><span className="font-medium">{PLACE_REPORT_FIELD_LABELS[field]}: </span>{displayPlaceReportValue(getValidatedChanges()?.[field] ?? null)}</li>)}</ul>}
          {dialogDecision === 'rejected' && <div><Label htmlFor={`report-rejection-reason-${report.id}`}>Rejection reason</Label><Textarea id={`report-rejection-reason-${report.id}`} value={rejectionReason} onChange={event => setRejectionReason(event.target.value)} maxLength={1000} className="mt-2" placeholder="Explain why the report is being rejected." /><p className="mt-1 text-right text-xs text-muted-foreground">{rejectionReason.length}/1000</p></div>}
          {validationError && <p role="alert" className="text-sm text-destructive">{validationError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setDialogDecision(null)}>Cancel</Button>
            <Button type="button" variant={dialogDecision === 'rejected' ? 'destructive' : 'default'} disabled={busy || (dialogDecision === 'rejected' && !rejectionReason.trim())} onClick={() => void confirmReview()}>{busy ? 'Saving…' : dialogDecision === 'approved' ? 'Confirm and apply' : 'Confirm rejection'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  )
}

function VerificationRequestCard({ request, busy, onReview }: { request: VerificationRequest; busy: boolean; onReview: (decision: 'approved' | 'rejected') => void }) {
  const entries = Object.entries(request.accessibility) as [keyof VerificationRequest['accessibility'], boolean][]
  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div><h3 className="font-semibold">{request.placeName}</h3><p className="text-xs text-muted-foreground">Place ID: {request.placeId} · Submitted {getRelativeDate(request.createdAt.slice(0, 10))}</p></div>
        <Badge variant="warning">Pending review</Badge>
      </div>
      <div className="mb-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
        {entries.map(([key, value]) => <p key={key} className="text-sm text-muted-foreground">{ACCESSIBILITY_LABELS[key]}: <span className="font-medium text-foreground">{value ? 'Confirmed available' : 'Not confirmed'}</span></p>)}
      </div>
      {request.notes && <p className="mb-3 whitespace-pre-wrap text-sm"><span className="font-medium">Notes: </span>{request.notes}</p>}
      <p className="mb-3 text-xs text-muted-foreground">{request.submitterUid ? `Submitted by signed-in user ${request.submitterUid}` : 'Submitted anonymously'}</p>
      <div className="flex gap-2">
        <Button size="sm" disabled={busy} onClick={() => onReview('approved')}>{busy ? 'Saving…' : 'Approve verification'}</Button>
        <Button size="sm" variant="outline" disabled={busy} className="text-destructive" onClick={() => onReview('rejected')}>Reject</Button>
      </div>
    </article>
  )
}





// /**
//  * AdminDashboard
//  *
//  * Protected admin area. Displays pending contributions from Firestore.
//  * Only reachable after passing AdminGuard (auth + admins/{uid} check).
//  *
//  * Approve: opens a dialog to enter latitude/longitude, then atomically
//  *   creates a place document and marks the contribution as approved.
//  * Reject: shows a confirmation dialog, then marks the contribution as rejected.
//  */

// import { useState } from 'react'
// import { signOut } from 'firebase/auth'
// import { useNavigate } from 'react-router-dom'
// import {
//   Shield, LogOut, AlertCircle, Inbox,
//   CheckCircle2, XCircle, Phone, Globe,
//   MapPin, User, Mail, FileText, Loader2,
//   Check, X,
// } from 'lucide-react'
// import { auth } from '@/lib/firebase'
// import { Button }    from '@/components/ui/button'
// import { Badge }     from '@/components/ui/badge'
// import { Skeleton }  from '@/components/ui/skeleton'
// import { Separator } from '@/components/ui/separator'
// import { Input }     from '@/components/ui/input'
// import { Label }     from '@/components/ui/label'
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from '@/components/ui/dialog'
// import { useToast }  from '@/hooks/use-toast'
// import { useAdminAuth }            from '@/hooks/useAdminAuth'
// import {
//   usePendingContributions,
//   useApproveContribution,
//   useRejectContribution,
// } from '@/hooks/useContributions'
// import { categoryLabel, getRelativeDate } from '@/lib/utils'
// import type { Contribution } from '@/types'

// // ─── helpers ────────────────────────────────────────────────────────────────

// const ACCESSIBILITY_LABELS: Record<keyof Contribution['accessibility'], string> = {
//   wheelchairEntrance: 'Wheelchair Entrance',
//   ramp:               'Ramp',
//   elevator:           'Elevator',
//   accessibleToilet:   'Accessible Toilet',
//   accessibleParking:  'Accessible Parking',
//   tactilePaving:      'Tactile Paving',
//   audioAssistance:    'Audio Assistance',
// }

// /**
//  * Translate a Firestore error code or our own sentinel string into a
//  * user-facing message.
//  */
// function describeError(error: unknown): string {
//   const msg  = (error as Error)?.message ?? ''
//   const code = (error as { code?: string })?.code ?? ''

//   if (msg === 'contribution-not-found')      return 'This contribution no longer exists.'
//   if (msg === 'contribution-already-reviewed') return 'This contribution was already approved or rejected.'
//   if (msg.startsWith('invalid-coordinates'))   return msg.replace('invalid-coordinates: ', '')
//   if (code === 'permission-denied')          return 'Permission denied. Make sure you are signed in as an admin.'
//   if (code === 'failed-precondition')        return 'A required Firestore index is missing. Check the browser console.'
//   return 'An unexpected error occurred. Check the browser console for details.'
// }

// // ─── Approve dialog ───────────────────────────────────────────────────────────

// interface ApproveDialogProps {
//   contribution: Contribution | null
//   onClose: () => void
// }

// function ApproveDialog({ contribution, onClose }: ApproveDialogProps) {
//   const { toast }  = useToast()
//   const approveMut = useApproveContribution()

//   const [latStr, setLatStr] = useState('')
//   const [lngStr, setLngStr] = useState('')
//   const [fieldErrors, setFieldErrors] = useState<{ lat?: string; lng?: string }>({})

//   const isOpen    = contribution !== null
//   const isPending = approveMut.isPending

//   // Reset local state when the dialog is closed/reopened
//   const handleOpenChange = (open: boolean) => {
//     if (!open) {
//       setLatStr('')
//       setLngStr('')
//       setFieldErrors({})
//       approveMut.reset()
//       onClose()
//     }
//   }

//   const validate = (): { lat: number; lng: number } | null => {
//     const errors: { lat?: string; lng?: string } = {}

//     const lat = parseFloat(latStr.trim())
//     const lng = parseFloat(lngStr.trim())

//     if (latStr.trim() === '' || !Number.isFinite(lat)) {
//       errors.lat = 'Enter a valid number.'
//     } else if (lat < -90 || lat > 90) {
//       errors.lat = 'Latitude must be between -90 and 90.'
//     }

//     if (lngStr.trim() === '' || !Number.isFinite(lng)) {
//       errors.lng = 'Enter a valid number.'
//     } else if (lng < -180 || lng > 180) {
//       errors.lng = 'Longitude must be between -180 and 180.'
//     }

//     setFieldErrors(errors)
//     if (Object.keys(errors).length > 0) return null
//     return { lat, lng }
//   }

//   const handleApprove = async () => {
//     if (!contribution) return
//     const coords = validate()
//     if (!coords) return

//     try {
//       await approveMut.mutateAsync({
//         contributionId: contribution.id,
//         latitude:       coords.lat,
//         longitude:      coords.lng,
//       })
//       toast({
//         title:       'Contribution approved',
//         description: `"${contribution.placeName}" has been added to the map.`,
//       })
//       handleOpenChange(false)
//     } catch (err) {
//       // Error is shown inside the dialog via approveMut.error
//       console.error('[AdminDashboard] approve failed:', err)
//     }
//   }

//   return (
//     <Dialog open={isOpen} onOpenChange={handleOpenChange}>
//       <DialogContent className="sm:max-w-md">
//         <DialogHeader>
//           <DialogTitle>Approve contribution</DialogTitle>
//           <DialogDescription>
//             Enter the coordinates for{' '}
//             <span className="font-medium text-foreground">
//               {contribution?.placeName}
//             </span>
//             . These are required to place it on the map.
//           </DialogDescription>
//         </DialogHeader>

//         <div className="space-y-4 py-2">
//           {/* Latitude */}
//           <div className="space-y-1.5">
//             <Label htmlFor="approve-lat">
//               Latitude <span aria-hidden="true" className="text-destructive">*</span>
//             </Label>
//             <Input
//               id="approve-lat"
//               type="number"
//               step="any"
//               placeholder="e.g. 22.3569"
//               value={latStr}
//               onChange={e => {
//                 setLatStr(e.target.value)
//                 setFieldErrors(prev => ({ ...prev, lat: undefined }))
//               }}
//               disabled={isPending}
//               aria-invalid={Boolean(fieldErrors.lat)}
//               aria-describedby={fieldErrors.lat ? 'approve-lat-error' : undefined}
//             />
//             {fieldErrors.lat && (
//               <p id="approve-lat-error" className="text-xs text-destructive" role="alert">
//                 {fieldErrors.lat}
//               </p>
//             )}
//           </div>

//           {/* Longitude */}
//           <div className="space-y-1.5">
//             <Label htmlFor="approve-lng">
//               Longitude <span aria-hidden="true" className="text-destructive">*</span>
//             </Label>
//             <Input
//               id="approve-lng"
//               type="number"
//               step="any"
//               placeholder="e.g. 91.8123"
//               value={lngStr}
//               onChange={e => {
//                 setLngStr(e.target.value)
//                 setFieldErrors(prev => ({ ...prev, lng: undefined }))
//               }}
//               disabled={isPending}
//               aria-invalid={Boolean(fieldErrors.lng)}
//               aria-describedby={fieldErrors.lng ? 'approve-lng-error' : undefined}
//             />
//             {fieldErrors.lng && (
//               <p id="approve-lng-error" className="text-xs text-destructive" role="alert">
//                 {fieldErrors.lng}
//               </p>
//             )}
//           </div>

//           {/* Firestore error */}
//           {approveMut.isError && (
//             <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
//               <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
//               <p className="text-xs text-destructive" role="alert">
//                 {describeError(approveMut.error)}
//               </p>
//             </div>
//           )}
//         </div>

//         <DialogFooter className="gap-2">
//           <Button
//             variant="outline"
//             onClick={() => handleOpenChange(false)}
//             disabled={isPending}
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={() => void handleApprove()}
//             disabled={isPending}
//             className="gap-1.5"
//           >
//             {isPending ? (
//               <>
//                 <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
//                 Approving…
//               </>
//             ) : (
//               <>
//                 <Check className="w-3.5 h-3.5" aria-hidden="true" />
//                 Approve
//               </>
//             )}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }

// // ─── Reject dialog ────────────────────────────────────────────────────────────

// interface RejectDialogProps {
//   contribution: Contribution | null
//   onClose: () => void
// }

// function RejectDialog({ contribution, onClose }: RejectDialogProps) {
//   const { toast } = useToast()
//   const rejectMut = useRejectContribution()

//   const isOpen    = contribution !== null
//   const isPending = rejectMut.isPending

//   const handleOpenChange = (open: boolean) => {
//     if (!open) {
//       rejectMut.reset()
//       onClose()
//     }
//   }

//   const handleReject = async () => {
//     if (!contribution) return
//     try {
//       await rejectMut.mutateAsync({ contributionId: contribution.id })
//       toast({
//         title:       'Contribution rejected',
//         description: `"${contribution.placeName}" has been marked as rejected.`,
//       })
//       handleOpenChange(false)
//     } catch (err) {
//       console.error('[AdminDashboard] reject failed:', err)
//     }
//   }

//   return (
//     <Dialog open={isOpen} onOpenChange={handleOpenChange}>
//       <DialogContent className="sm:max-w-md">
//         <DialogHeader>
//           <DialogTitle>Reject contribution?</DialogTitle>
//           <DialogDescription>
//             This will mark{' '}
//             <span className="font-medium text-foreground">
//               {contribution?.placeName}
//             </span>{' '}
//             as rejected. No place will be added to the map. This action cannot be undone from the app.
//           </DialogDescription>
//         </DialogHeader>

//         {/* Firestore error */}
//         {rejectMut.isError && (
//           <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 mt-2">
//             <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
//             <p className="text-xs text-destructive" role="alert">
//               {describeError(rejectMut.error)}
//             </p>
//           </div>
//         )}

//         <DialogFooter className="gap-2 mt-2">
//           <Button
//             variant="outline"
//             onClick={() => handleOpenChange(false)}
//             disabled={isPending}
//           >
//             Cancel
//           </Button>
//           <Button
//             variant="destructive"
//             onClick={() => void handleReject()}
//             disabled={isPending}
//             className="gap-1.5"
//           >
//             {isPending ? (
//               <>
//                 <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
//                 Rejecting…
//               </>
//             ) : (
//               <>
//                 <X className="w-3.5 h-3.5" aria-hidden="true" />
//                 Reject
//               </>
//             )}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }

// // ─── ContributionCard ─────────────────────────────────────────────────────────

// interface ContributionCardProps {
//   c: Contribution
//   onApprove: (c: Contribution) => void
//   onReject:  (c: Contribution) => void
// }

// function ContributionCard({ c, onApprove, onReject }: ContributionCardProps) {
//   const accessibilityEntries = Object.entries(c.accessibility) as [
//     keyof Contribution['accessibility'],
//     boolean,
//   ][]

//   return (
//     <article
//       aria-labelledby={`contrib-${c.id}-heading`}
//       className="border border-border rounded-lg bg-card overflow-hidden"
//     >
//       {/* Card header */}
//       <div className="px-4 pt-4 pb-3 border-b border-border">
//         <div className="flex items-start justify-between gap-3 flex-wrap">
//           <div>
//             <h3
//               id={`contrib-${c.id}-heading`}
//               className="font-semibold text-foreground"
//             >
//               {c.placeName}
//             </h3>
//             <div className="flex flex-wrap items-center gap-2 mt-1">
//               <Badge variant="outline" className="text-xs font-normal">
//                 {categoryLabel(c.category)}
//               </Badge>
//               <span className="text-xs text-muted-foreground flex items-center gap-1">
//                 <MapPin className="w-3 h-3" aria-hidden="true" />
//                 {c.area}
//               </span>
//             </div>
//           </div>
//           <Badge variant="warning" className="shrink-0 text-xs">
//             Pending review
//           </Badge>
//         </div>
//       </div>

//       {/* Card body */}
//       <div className="p-4 space-y-4">
//         {/* Location */}
//         <div>
//           <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
//             Address
//           </p>
//           <p className="text-sm text-foreground">{c.address}</p>
//         </div>

//         {/* Contact */}
//         {(c.phone || c.website) && (
//           <div className="flex flex-wrap gap-4">
//             {c.phone && (
//               <span className="text-sm text-foreground flex items-center gap-1.5">
//                 <Phone className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
//                 {c.phone}
//               </span>
//             )}
//             {c.website && (
//               <a
//                 href={c.website}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="text-sm text-primary hover:underline flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
//               >
//                 <Globe className="w-3.5 h-3.5" aria-hidden="true" />
//                 {c.website}
//               </a>
//             )}
//           </div>
//         )}

//         <Separator />

//         {/* Accessibility features */}
//         <div>
//           <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
//             Accessibility reported
//           </p>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
//             {accessibilityEntries.map(([key, value]) => (
//               <div key={key as string} className="flex items-center gap-2 text-sm">
//                 {value ? (
//                   <CheckCircle2
//                     className="w-4 h-4 text-accent shrink-0"
//                     aria-hidden="true"
//                   />
//                 ) : (
//                   <XCircle
//                     className="w-4 h-4 text-muted-foreground/40 shrink-0"
//                     aria-hidden="true"
//                   />
//                 )}
//                 <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
//                   {ACCESSIBILITY_LABELS[key]}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Notes */}
//         {c.notes && (
//           <>
//             <Separator />
//             <div>
//               <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1.5">
//                 <FileText className="w-3.5 h-3.5" aria-hidden="true" />
//                 Notes
//               </p>
//               <p className="text-sm text-foreground leading-relaxed">{c.notes}</p>
//             </div>
//           </>
//         )}

//         <Separator />

//         {/* Reporter + timestamp */}
//         <div className="flex flex-wrap items-center justify-between gap-3">
//           <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
//             {c.reporter.name && (
//               <span className="flex items-center gap-1">
//                 <User className="w-3 h-3" aria-hidden="true" />
//                 {c.reporter.name}
//               </span>
//             )}
//             {c.reporter.email && (
//               <span className="flex items-center gap-1">
//                 <Mail className="w-3 h-3" aria-hidden="true" />
//                 {c.reporter.email}
//               </span>
//             )}
//             {!c.reporter.name && !c.reporter.email && (
//               <span className="italic">Anonymous submission</span>
//             )}
//           </div>
//           <span className="text-xs text-muted-foreground">
//             Submitted {getRelativeDate(c.createdAt.slice(0, 10))}
//           </span>
//         </div>

//         {/* Action buttons */}
//         <div className="flex gap-2 pt-1">
//           <Button
//             size="sm"
//             className="gap-1.5"
//             onClick={() => onApprove(c)}
//           >
//             <Check className="w-3.5 h-3.5" aria-hidden="true" />
//             Approve
//           </Button>
//           <Button
//             size="sm"
//             variant="outline"
//             className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
//             onClick={() => onReject(c)}
//           >
//             <X className="w-3.5 h-3.5" aria-hidden="true" />
//             Reject
//           </Button>
//         </div>
//       </div>
//     </article>
//   )
// }

// // ─── main page ───────────────────────────────────────────────────────────────

// export default function AdminDashboard() {
//   const authState = useAdminAuth()
//   const navigate  = useNavigate()
//   const { data: contributions, isLoading, isError, error } = usePendingContributions()

//   // Which contribution is currently being acted on
//   const [approveTarget, setApproveTarget] = useState<Contribution | null>(null)
//   const [rejectTarget,  setRejectTarget]  = useState<Contribution | null>(null)

//   const handleSignOut = async () => {
//     await signOut(auth)
//     navigate('/admin/login', { replace: true })
//   }

//   const adminEmail =
//     authState.status === 'admin' ? authState.user.email : null

//   return (
//     <main id="main-content" className="container mx-auto px-4 py-10 max-w-3xl">
//       {/* Header */}
//       <div className="flex items-start justify-between gap-4 mb-8">
//         <div className="flex items-center gap-3">
//           <div
//             className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
//             aria-hidden="true"
//           >
//             <Shield className="w-5 h-5 text-primary" />
//           </div>
//           <div>
//             <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
//             {adminEmail && (
//               <p className="text-xs text-muted-foreground mt-0.5">
//                 Signed in as {adminEmail}
//               </p>
//             )}
//           </div>
//         </div>
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => void handleSignOut()}
//           className="gap-1.5 shrink-0"
//         >
//           <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
//           Sign out
//         </Button>
//       </div>

//       {/* Section heading */}
//       <div className="flex items-center justify-between mb-4">
//         <h2 className="text-sm font-semibold text-foreground">
//           Pending Contributions
//         </h2>
//         {!isLoading && !isError && contributions && (
//           <span
//             className="text-xs text-muted-foreground"
//             aria-live="polite"
//             aria-atomic="true"
//           >
//             {contributions.length === 0
//               ? 'No pending submissions'
//               : `${contributions.length} awaiting review`}
//           </span>
//         )}
//       </div>

//       {/* Loading state */}
//       {isLoading && (
//         <div className="space-y-4" aria-label="Loading contributions…">
//           {[1, 2, 3].map(i => (
//             <div key={i} className="border border-border rounded-lg p-4 space-y-3">
//               <Skeleton className="h-5 w-48" />
//               <Skeleton className="h-4 w-32" />
//               <Skeleton className="h-px w-full" />
//               <div className="grid grid-cols-2 gap-2">
//                 {[1,2,3,4].map(j => <Skeleton key={j} className="h-4 w-full" />)}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Error state */}
//       {isError && (
//         <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-6 flex items-start gap-3">
//           <AlertCircle
//             className="w-5 h-5 text-destructive shrink-0 mt-0.5"
//             aria-hidden="true"
//           />
//           <div>
//             <p className="text-sm font-medium text-foreground mb-1">
//               Failed to load contributions
//             </p>
//             <p className="text-xs text-muted-foreground mb-1">
//               {(error as { code?: string })?.code === 'failed-precondition'
//                 ? 'A Firestore composite index is required. See the project README or check the browser console for the index creation link.'
//                 : (error as { code?: string })?.code === 'permission-denied'
//                 ? 'Permission denied. Make sure you are signed in as an admin.'
//                 : 'A network or configuration error occurred. Check the browser console for details.'}
//             </p>
//             {(error as { code?: string })?.code && (
//               <p className="text-xs font-mono text-muted-foreground/70">
//                 Error code: {(error as { code?: string }).code}
//               </p>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Empty state */}
//       {!isLoading && !isError && contributions?.length === 0 && (
//         <div className="border border-border rounded-lg p-10 text-center">
//           <Inbox
//             className="w-8 h-8 text-muted-foreground mx-auto mb-3"
//             aria-hidden="true"
//           />
//           <p className="text-sm font-medium text-foreground mb-1">
//             No pending contributions
//           </p>
//           <p className="text-xs text-muted-foreground">
//             New place submissions will appear here for review.
//           </p>
//         </div>
//       )}

//       {/* Contribution list */}
//       {!isLoading && !isError && contributions && contributions.length > 0 && (
//         <div className="space-y-4" role="list" aria-label="Pending contributions">
//           {contributions.map(c => (
//             <div key={c.id} role="listitem">
//               <ContributionCard
//                 c={c}
//                 onApprove={setApproveTarget}
//                 onReject={setRejectTarget}
//               />
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Spinner for background refetch */}
//       {!isLoading && !isError && (
//         <div className="flex justify-center mt-6">
//           <Loader2 className="w-4 h-4 text-muted-foreground/30 animate-spin" aria-hidden="true" />
//         </div>
//       )}

//       {/* Dialogs — rendered once at page level, not per-card */}
//       <ApproveDialog
//         contribution={approveTarget}
//         onClose={() => setApproveTarget(null)}
//       />
//       <RejectDialog
//         contribution={rejectTarget}
//         onClose={() => setRejectTarget(null)}
//       />
//     </main>
//   )
// }

