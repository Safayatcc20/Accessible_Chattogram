/**
 * AdminDashboard
 *
 * Protected admin area. Displays pending contributions from Firestore.
 * Only reachable after passing AdminGuard (auth + admins/{uid} check).
 * Approve / reject actions will be added in the next phase.
 */

import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import {
  Shield, LogOut, AlertCircle, Inbox,
  CheckCircle2, XCircle, Phone, Globe,
  MapPin, User, Mail, FileText, Loader2,
} from 'lucide-react'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { usePendingContributions } from '@/hooks/useContributions'
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

// ─── sub-components ──────────────────────────────────────────────────────────

function ContributionCard({ c }: { c: Contribution }) {
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
              <div key={key} className="flex items-center gap-2 text-sm">
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

        {/* Approve / Reject — placeholder, next phase */}
        <div className="flex gap-2 pt-1">
          <Button size="sm" disabled className="gap-1.5 opacity-50 cursor-not-allowed">
            Approve
          </Button>
          <Button size="sm" variant="outline" disabled className="gap-1.5 opacity-50 cursor-not-allowed">
            Reject
          </Button>
          <span className="text-xs text-muted-foreground self-center ml-1">
            Actions coming soon
          </span>
        </div>
      </div>
    </article>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const authState    = useAdminAuth()
  const navigate     = useNavigate()
  const { data: contributions, isLoading, isError } = usePendingContributions()

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
          onClick={handleSignOut}
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
            <p className="text-xs text-muted-foreground">
              This may be a permissions issue or a network error. Try refreshing the page.
            </p>
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
              <ContributionCard c={c} />
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
    </main>
  )
}