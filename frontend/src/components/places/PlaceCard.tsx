import { Link } from 'react-router-dom'
import { MapPin, Clock, Phone, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VerificationBadge } from '@/components/verification/VerificationBadge'
import { AccessibilitySummary } from '@/components/accessibility/AccessibilitySummary'
import { categoryLabel, getRelativeDate } from '@/lib/utils'
import type { Place } from '@/types'
import { cn } from '@/lib/utils'

interface PlaceCardProps {
  place: Place
  compact?: boolean
  className?: string
}

export function PlaceCard({ place, compact = false, className }: PlaceCardProps) {
  return (
    <article
      className={cn(
        'border border-border rounded-lg bg-card overflow-hidden hover:border-primary/30 transition-colors',
        className
      )}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <Link
              to={`/places/${place.id}`}
              className="font-semibold text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              {place.name}
            </Link>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              <span className="text-xs text-muted-foreground">{categoryLabel(place.category)}</span>
              {place.isOpenNow !== undefined && (
                <span className={cn('text-xs font-medium', place.isOpenNow ? 'text-accent' : 'text-muted-foreground')}>
                  {place.isOpenNow ? '● Open now' : '○ Closed'}
                </span>
              )}
            </div>
          </div>
          <VerificationBadge status={place.verification.status} showIcon />
        </div>

        {/* Address */}
        <div className="flex items-start gap-1.5 mb-3">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">{place.address}</span>
        </div>

        {/* Accessibility summary */}
        {!compact && (
          <div className="mt-3 pt-3 border-t border-border">
            <AccessibilitySummary accessibility={place.accessibility} compact />
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              Verified {getRelativeDate(place.verification.lastVerified)}
            </span>
            {place.phone && (
              <span className="flex items-center gap-1 hidden sm:flex">
                <Phone className="w-3 h-3" aria-hidden="true" />
                Has contact
              </span>
            )}
          </div>
          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
            <Link to={`/places/${place.id}`}>
              Details
              <ChevronRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
