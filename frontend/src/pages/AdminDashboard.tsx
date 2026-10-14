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

import { useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast }  from '@/hooks/use-toast'
import { useAdminAuth }            from '@/hooks/useAdminAuth'
import {
  usePendingContributions,
  useApproveContribution,
  useRejectContribution,
} from '@/hooks/useContributions'
import { categoryLabel, getRelativeDate } from '@/lib/utils'
import type { Contribution } from '@/types'

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

  if (msg === 'contribution-not-found')      return 'This contribution no longer exists.'
  if (msg === 'contribution-already-reviewed') return 'This contribution was already approved or rejected.'
  if (code === 'permission-denied')          return 'Permission denied. Make sure you are signed in as an admin.'
  if (code === 'failed-precondition')        return 'A required Firestore index is missing. Check the browser console.'
  return 'An unexpected error occurred. Check the browser console for details.'
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

    if (latStr.trim() === '' || isNaN(lat)) {
      errors.lat = 'Enter a valid number.'
    } else if (lat < -90 || lat > 90) {
      errors.lat = 'Latitude must be between -90 and 90.'
    }

    if (lngStr.trim() === '' || isNaN(lng)) {
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

  // Which contribution is currently being acted on
  const [approveTarget, setApproveTarget] = useState<Contribution | null>(null)
  const [rejectTarget,  setRejectTarget]  = useState<Contribution | null>(null)

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