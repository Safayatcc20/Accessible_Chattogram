import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Phone, Globe, Clock, ShieldCheck, Users, AlertCircle,
  Accessibility, ArrowUpDown, PersonStanding, Car, Navigation,
  Info as InfoIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { AccessibilityStatus } from '@/components/accessibility/AccessibilityStatus'
import { VerificationBadge } from '@/components/verification/VerificationBadge'
import { usePlace } from '@/hooks/usePlaces'
import { categoryLabel, formatDate, getRelativeDate } from '@/lib/utils'

export default function PlaceDetails() {
  const { id } = useParams<{ id: string }>()
  const { data: place, isLoading, isError } = usePlace(id ?? '')

  if (isLoading) {
    return (
      <main id="main-content" className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-5 w-24 mb-6" />
        <Skeleton className="h-8 w-72 mb-2" />
        <Skeleton className="h-5 w-40 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      </main>
    )
  }

  if (isError || !place) {
    return (
      <main id="main-content" className="container mx-auto px-4 py-16 text-center max-w-md">
        <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-foreground mb-2">Place not found</h1>
        <p className="text-sm text-muted-foreground mb-6">This place may have been removed or the link is incorrect.</p>
        <Button asChild variant="outline">
          <Link to="/explore">Back to Explore</Link>
        </Button>
      </main>
    )
  }

  const a = place.accessibility

  return (
    <main id="main-content" className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Back */}
      <Link
        to="/explore"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
        Back to Explore
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start gap-3 mb-2">
          <h1 className="text-2xl font-bold text-foreground">{place.name}</h1>
          <VerificationBadge status={place.verification.status} showIcon />
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            {place.address}
          </span>
          <Badge variant="outline" className="font-normal">{categoryLabel(place.category)}</Badge>
          {place.isOpenNow !== undefined && (
            <span className={place.isOpenNow ? 'text-accent font-medium' : 'text-muted-foreground'}>
              {place.isOpenNow ? '● Open now' : '○ Closed'}
            </span>
          )}
        </div>

        {place.description && (
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-xl">{place.description}</p>
        )}

        {/* Contact */}
        <div className="flex flex-wrap gap-3 mt-4">
          {place.phone && (
            <a href={`tel:${place.phone}`} className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              {place.phone}
            </a>
          )}
          {place.website && (
            <a href={place.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              Website
            </a>
          )}
          {place.openingHours && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {place.openingHours}
            </span>
          )}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Accessibility Overview */}
      <section aria-labelledby="overview-heading" className="mb-6">
        <h2 id="overview-heading" className="text-lg font-semibold text-foreground mb-4">Accessibility Overview</h2>
        <div className="border border-border rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AccessibilityStatus value={a.wheelchairEntrance} label="Wheelchair Entrance" />
            <AccessibilityStatus value={a.ramp} label="Ramp Available" />
            <AccessibilityStatus value={a.elevator} label="Elevator" />
            <AccessibilityStatus value={a.accessibleToilet} label="Accessible Toilet" />
            <AccessibilityStatus value={a.accessibleParking} label="Accessible Parking" />
            <AccessibilityStatus value={a.tactilePaving} label="Tactile Paving" />
            <AccessibilityStatus value={a.audioAssistance} label="Audio Assistance" />
            {a.accessiblePathways !== undefined && (
              <AccessibilityStatus value={a.accessiblePathways ?? null} label="Accessible Pathways" />
            )}
          </div>
        </div>
        <InfoNote />
      </section>

      <Separator className="mb-6" />

      {/* Detailed sections */}
      <div className="space-y-6">
        {/* Entrance */}
        <DetailSection
          id="entrance"
          title="Entrance"
          Icon={Accessibility}
        >
          <DetailRow label="Step-free entrance" value={a.wheelchairEntrance} />
          <DetailRow label="Ramp" value={a.ramp} />
          {a.doorWidth && <DetailText label="Door width" value={a.doorWidth} />}
          {a.entranceSurface && <DetailText label="Entrance surface" value={a.entranceSurface} />}
        </DetailSection>

        {/* Inside */}
        <DetailSection id="inside" title="Inside" Icon={ArrowUpDown}>
          <DetailRow label="Elevator" value={a.elevator} />
          {a.elevatorNotes && <DetailText label="Elevator notes" value={a.elevatorNotes} />}
          <DetailRow label="Accessible pathways" value={a.accessiblePathways ?? null} />
        </DetailSection>

        {/* Restroom */}
        <DetailSection id="restroom" title="Restroom" Icon={PersonStanding}>
          <DetailRow label="Accessible toilet" value={a.accessibleToilet} />
          {a.restroomNotes && <DetailText label="Notes" value={a.restroomNotes} />}
        </DetailSection>

        {/* Parking */}
        <DetailSection id="parking" title="Parking" Icon={Car}>
          <DetailRow label="Accessible parking" value={a.accessibleParking} />
          {a.parkingDistance && <DetailText label="Distance from entrance" value={a.parkingDistance} />}
        </DetailSection>

        {/* Navigation */}
        <DetailSection id="navigation" title="Navigation & Wayfinding" Icon={Navigation}>
          <DetailRow label="Tactile paving" value={a.tactilePaving} />
          <DetailRow label="Audio assistance" value={a.audioAssistance} />
        </DetailSection>
      </div>

      <Separator className="my-6" />

      {/* Verification info */}
      <section aria-labelledby="verification-heading" className="mb-8">
        <h2 id="verification-heading" className="text-lg font-semibold text-foreground mb-4">Verification Information</h2>
        <div className="border border-border rounded-lg divide-y divide-border">
          <InfoItem
            label="Data Source"
            value={place.verification.source}
          />
          <InfoItem
            label="Last Verified"
            value={place.verification.lastVerified
              ? `${formatDate(place.verification.lastVerified)} (${getRelativeDate(place.verification.lastVerified)})`
              : 'Not yet verified'
            }
          />
          <InfoItem
            label="Community Confirmations"
            value={`${place.verification.verificationCount} confirmations`}
          />
          <InfoItem
            label="Community Reports"
            value={`${place.verification.communityReports} reports submitted`}
          />
          <InfoItem
            label="Verification Status"
            customValue={<VerificationBadge status={place.verification.status} showIcon />}
          />
        </div>

        <div className="mt-4 p-3 border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 rounded-lg flex items-start gap-2">
          <InfoIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            Accessibility information may change over time. If you're planning to visit, we recommend verifying critical details directly with the venue before your visit.
          </p>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="flex-1">
          <Link to="/contribute">
            <ShieldCheck className="w-4 h-4 mr-2" aria-hidden="true" />
            Verify This Place
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link to="/contribute">
            <Users className="w-4 h-4 mr-2" aria-hidden="true" />
            Report an Update
          </Link>
        </Button>
      </div>
    </main>
  )
}

function InfoNote() {
  return (
    <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
      <InfoIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
      Items marked as "information unavailable" mean we don't have data — not that the feature is absent.
    </p>
  )
}

function DetailSection({
  id, title, Icon, children
}: {
  id: string
  title: string
  Icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={`section-${id}`}>
      <h3 id={`section-${id}`} className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
        <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
        {title}
      </h3>
      <div className="border border-border rounded-lg p-4 space-y-3">
        {children}
      </div>
    </section>
  )
}

function DetailRow({ label, value }: { label: string; value: boolean | null }) {
  return <AccessibilityStatus value={value} label={label} />
}

function DetailText({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

function InfoItem({
  label,
  value,
  customValue,
}: {
  label: string
  value?: string
  customValue?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 px-4 py-3">
      <span className="text-xs font-medium text-muted-foreground sm:w-44 shrink-0">{label}</span>
      {customValue ?? <span className="text-sm text-foreground">{value}</span>}
    </div>
  )
}
