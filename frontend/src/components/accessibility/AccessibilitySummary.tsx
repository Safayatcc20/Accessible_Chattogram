import { Accessibility, ArrowUpToLine, ArrowUpDown, PersonStanding, Car, Navigation, Volume2 } from 'lucide-react'
import { AccessibilityStatus } from './AccessibilityStatus'
import type { Place } from '@/types'
import { cn } from '@/lib/utils'

interface AccessibilitySummaryProps {
  accessibility: Place['accessibility']
  compact?: boolean
  className?: string
}

const FEATURES = [
  { key: 'wheelchairEntrance', label: 'Wheelchair Entrance', Icon: Accessibility },
  { key: 'ramp', label: 'Ramp', Icon: ArrowUpToLine },
  { key: 'elevator', label: 'Elevator', Icon: ArrowUpDown },
  { key: 'accessibleToilet', label: 'Accessible Toilet', Icon: PersonStanding },
  { key: 'accessibleParking', label: 'Accessible Parking', Icon: Car },
  { key: 'tactilePaving', label: 'Tactile Paving', Icon: Navigation },
  { key: 'audioAssistance', label: 'Audio Assistance', Icon: Volume2 },
] as const

export function AccessibilitySummary({ accessibility, compact = false, className }: AccessibilitySummaryProps) {
  const features = FEATURES.slice(0, compact ? 4 : FEATURES.length)

  return (
    <div className={cn('grid gap-2', compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2', className)}>
      {features.map(({ key, label }) => (
        <AccessibilityStatus
          key={key}
          value={accessibility[key] as boolean | null}
          label={label}
          size={compact ? 'sm' : 'md'}
        />
      ))}
    </div>
  )
}
