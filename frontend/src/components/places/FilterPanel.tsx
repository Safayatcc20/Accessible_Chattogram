import { type RefObject } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import type { FilterState, PlaceCategory, AccessibilityFeature, VerificationStatus } from '@/types'

interface FilterPanelProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  onClose?: () => void
  resultCount?: number
  // Fix 6: support dialog accessibility from Explore
  titleId?: string
  closeRef?: RefObject<HTMLButtonElement>
}

const CATEGORIES: { value: PlaceCategory; label: string }[] = [
  { value: 'hospital', label: 'Hospital / Clinic' },
  { value: 'university', label: 'University' },
  { value: 'school', label: 'School' },
  { value: 'restaurant', label: 'Restaurant / Café' },
  { value: 'shopping', label: 'Shopping Mall' },
  { value: 'government', label: 'Government Office' },
  { value: 'transport', label: 'Transport Hub' },
  { value: 'other', label: 'Other' },
]

const ACCESSIBILITY_FEATURES: { value: AccessibilityFeature; label: string }[] = [
  { value: 'wheelchairEntrance', label: 'Wheelchair Entrance' },
  { value: 'ramp', label: 'Ramp' },
  { value: 'elevator', label: 'Elevator' },
  { value: 'accessibleToilet', label: 'Accessible Toilet' },
  { value: 'accessibleParking', label: 'Accessible Parking' },
  { value: 'tactilePaving', label: 'Tactile Paving' },
  { value: 'audioAssistance', label: 'Audio Assistance' },
]

const VERIFICATION: { value: VerificationStatus; label: string }[] = [
  { value: 'verified', label: 'Verified' },
  { value: 'community-reported', label: 'Community Reported' },
  { value: 'unverified', label: 'Not Verified' },
]

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
}

export function FilterPanel({
  filters,
  onChange,
  onClose,
  resultCount,
  titleId,
  closeRef,
}: FilterPanelProps) {
  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.accessibilityFeatures.length > 0 ||
    filters.verificationStatus.length > 0 ||
    filters.openNow ||
    filters.hasContact ||
    filters.recentlyVerified

  const clearAll = () => {
    onChange({
      categories: [],
      accessibilityFeatures: [],
      verificationStatus: [],
      openNow: false,
      hasContact: false,
      recentlyVerified: false,
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          {/* Fix 6: use titleId so the dialog's aria-labelledby resolves */}
          <h2 id={titleId} className="font-semibold text-sm text-foreground">Filters</h2>
          {resultCount !== undefined && (
            <p className="text-xs text-muted-foreground mt-0.5">{resultCount} places found</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
              Clear all
            </Button>
          )}
          {onClose && (
            <Button
              ref={closeRef}
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7"
              aria-label="Close filters"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Place Type */}
        <fieldset>
          <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Place Type</legend>
          <div className="space-y-2.5">
            {CATEGORIES.map(cat => (
              <div key={cat.value} className="flex items-center gap-2.5">
                <Checkbox
                  id={`cat-${cat.value}`}
                  checked={filters.categories.includes(cat.value)}
                  onCheckedChange={() =>
                    onChange({ ...filters, categories: toggleItem(filters.categories, cat.value) })
                  }
                />
                <Label htmlFor={`cat-${cat.value}`} className="text-sm font-normal cursor-pointer">
                  {cat.label}
                </Label>
              </div>
            ))}
          </div>
        </fieldset>

        <Separator />

        {/* Accessibility Features */}
        <fieldset>
          <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Accessibility Features</legend>
          <div className="space-y-2.5">
            {ACCESSIBILITY_FEATURES.map(feat => (
              <div key={feat.value} className="flex items-center gap-2.5">
                <Checkbox
                  id={`feat-${feat.value}`}
                  checked={filters.accessibilityFeatures.includes(feat.value)}
                  onCheckedChange={() =>
                    onChange({ ...filters, accessibilityFeatures: toggleItem(filters.accessibilityFeatures, feat.value) })
                  }
                />
                <Label htmlFor={`feat-${feat.value}`} className="text-sm font-normal cursor-pointer">
                  {feat.label}
                </Label>
              </div>
            ))}
          </div>
        </fieldset>

        <Separator />

        {/* Verification */}
        <fieldset>
          <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Verification Status</legend>
          <div className="space-y-2.5">
            {VERIFICATION.map(ver => (
              <div key={ver.value} className="flex items-center gap-2.5">
                <Checkbox
                  id={`ver-${ver.value}`}
                  checked={filters.verificationStatus.includes(ver.value)}
                  onCheckedChange={() =>
                    onChange({ ...filters, verificationStatus: toggleItem(filters.verificationStatus, ver.value) })
                  }
                />
                <Label htmlFor={`ver-${ver.value}`} className="text-sm font-normal cursor-pointer">
                  {ver.label}
                </Label>
              </div>
            ))}
          </div>
        </fieldset>

        <Separator />

        {/* Additional */}
        <fieldset>
          <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Additional</legend>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="open-now" className="text-sm font-normal cursor-pointer">Open Now</Label>
              <Switch
                id="open-now"
                checked={filters.openNow}
                onCheckedChange={v => onChange({ ...filters, openNow: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="has-contact" className="text-sm font-normal cursor-pointer">Has Contact Info</Label>
              <Switch
                id="has-contact"
                checked={filters.hasContact}
                onCheckedChange={v => onChange({ ...filters, hasContact: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="recently-verified" className="text-sm font-normal cursor-pointer">Recently Verified</Label>
              <Switch
                id="recently-verified"
                checked={filters.recentlyVerified}
                onCheckedChange={v => onChange({ ...filters, recentlyVerified: v })}
              />
            </div>
          </div>
        </fieldset>
      </div>
    </div>
  )
}