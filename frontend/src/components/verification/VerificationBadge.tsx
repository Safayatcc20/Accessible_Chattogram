// import { ShieldCheck, Users, AlertCircle } from 'lucide-react'
// import { Badge } from '@/components/ui/badge'
// import type { VerificationStatus } from '@/types'
// import { verificationLabel } from '@/lib/utils'

// interface VerificationBadgeProps {
//   status: VerificationStatus
//   showIcon?: boolean
//   size?: 'sm' | 'md'
// }

// export function VerificationBadge({ status, showIcon = true }: VerificationBadgeProps) {
//   if (status === 'verified') {
//     return (
//       <Badge variant="verified" className="gap-1">
//         {showIcon && <ShieldCheck className="w-3 h-3" aria-hidden="true" />}
//         {verificationLabel(status)}
//       </Badge>
//     )
//   }

//   if (status === 'community-reported') {
//     return (
//       <Badge variant="community" className="gap-1">
//         {showIcon && <Users className="w-3 h-3" aria-hidden="true" />}
//         {verificationLabel(status)}
//       </Badge>
//     )
//   }

//   return (
//     <Badge variant="unverified" className="gap-1">
//       {showIcon && <AlertCircle className="w-3 h-3" aria-hidden="true" />}
//       {verificationLabel(status)}
//     </Badge>
//   )
// }
import { ShieldCheck, Users, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { VerificationStatus } from '@/types'
import { verificationLabel } from '@/lib/utils'

interface VerificationBadgeProps {
  status: VerificationStatus
  showIcon?: boolean
  size?: 'sm' | 'md'
}

export function VerificationBadge({ status, showIcon = true }: VerificationBadgeProps) {
  // Both 'admin-verified' (Phase 16.2) and legacy 'verified' use the same badge
  if (status === 'admin-verified' || status === 'verified') {
    return (
      <Badge variant="verified" className="gap-1">
        {showIcon && <ShieldCheck className="w-3 h-3" aria-hidden="true" />}
        {verificationLabel(status)}
      </Badge>
    )
  }

  // 'community-reported' — submitted by public user, not yet admin-reviewed
  if (status === 'community-reported') {
    return (
      <Badge variant="community" className="gap-1">
        {showIcon && <Users className="w-3 h-3" aria-hidden="true" />}
        {verificationLabel(status)}
      </Badge>
    )
  }

  // Legacy 'unverified' and any unknown value
  return (
    <Badge variant="unverified" className="gap-1">
      {showIcon && <AlertCircle className="w-3 h-3" aria-hidden="true" />}
      {verificationLabel(status)}
    </Badge>
  )
}