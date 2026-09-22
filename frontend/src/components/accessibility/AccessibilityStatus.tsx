import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccessibilityStatusProps {
  value: boolean | null
  label: string
  className?: string
  size?: 'sm' | 'md'
}

export function AccessibilityStatus({ value, label, className, size = 'md' }: AccessibilityStatusProps) {
  const isLarge = size === 'md'

  if (value === true) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <CheckCircle2
          className={cn(isLarge ? 'w-5 h-5' : 'w-4 h-4', 'text-accent shrink-0')}
          aria-hidden="true"
        />
        <span className={cn(isLarge ? 'text-sm' : 'text-xs', 'text-foreground')}>
          <span className="sr-only">Available: </span>
          {label}
        </span>
      </div>
    )
  }

  if (value === false) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <XCircle
          className={cn(isLarge ? 'w-5 h-5' : 'w-4 h-4', 'text-destructive/70 shrink-0')}
          aria-hidden="true"
        />
        <span className={cn(isLarge ? 'text-sm' : 'text-xs', 'text-muted-foreground line-through')}>
          <span className="sr-only">Not available: </span>
          {label}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <HelpCircle
        className={cn(isLarge ? 'w-5 h-5' : 'w-4 h-4', 'text-muted-foreground/60 shrink-0')}
        aria-hidden="true"
      />
      <span className={cn(isLarge ? 'text-sm' : 'text-xs', 'text-muted-foreground')}>
        <span className="sr-only">Unknown: </span>
        {label} — information unavailable
      </span>
    </div>
  )
}
