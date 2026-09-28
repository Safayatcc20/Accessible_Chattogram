// import { type ClassValue, clsx } from 'clsx'
// import { twMerge } from 'tailwind-merge'
// import type { PlaceCategory, VerificationStatus } from '@/types'

// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs))
// }

// export function formatDate(dateString: string | null): string {
//   if (!dateString) return 'Never'
//   const date = new Date(dateString)
//   return date.toLocaleDateString('en-GB', {
//     day: 'numeric',
//     month: 'long',
//     year: 'numeric',
//   })
// }

// export function getRelativeDate(dateString: string | null): string {
//   if (!dateString) return 'Not yet verified'
//   const date = new Date(dateString)
//   const now = new Date()
//   const diffMs = now.getTime() - date.getTime()
//   const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

//   if (diffDays === 0) return 'Today'
//   if (diffDays === 1) return 'Yesterday'
//   if (diffDays < 7) return `${diffDays} days ago`
//   if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
//   if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
//   return `${Math.floor(diffDays / 365)} years ago`
// }

// export function categoryLabel(category: PlaceCategory): string {
//   const labels: Record<PlaceCategory, string> = {
//     hospital: 'Hospital / Clinic',
//     university: 'University',
//     school: 'School',
//     restaurant: 'Restaurant / Café',
//     shopping: 'Shopping Mall',
//     government: 'Government Office',
//     transport: 'Transport Hub',
//     other: 'Other',
//   }
//   return labels[category] ?? category
// }

// export function verificationLabel(status: VerificationStatus): string {
//   const labels: Record<VerificationStatus, string> = {
//     verified: 'Verified',
//     'community-reported': 'Community Reported',
//     unverified: 'Not Verified',
//   }
//   return labels[status]
// }

// export function accessibilityScore(accessibility: {
//   wheelchairEntrance: boolean | null
//   ramp: boolean | null
//   elevator: boolean | null
//   accessibleToilet: boolean | null
//   accessibleParking: boolean | null
//   tactilePaving: boolean | null
//   audioAssistance: boolean | null
// }): number {
//   const features = Object.values(accessibility).slice(0, 7)
//   const known = features.filter(v => v !== null)
//   const available = known.filter(v => v === true)
//   if (known.length === 0) return 0
//   return Math.round((available.length / known.length) * 100)
// }
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { PlaceCategory, VerificationStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function getRelativeDate(dateString: string | null): string {
  if (!dateString) return 'Not yet verified'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export function categoryLabel(category: PlaceCategory): string {
  const labels: Record<PlaceCategory, string> = {
    hospital: 'Hospital / Clinic',
    university: 'University',
    school: 'School',
    restaurant: 'Restaurant / Café',
    shopping: 'Shopping Mall',
    government: 'Government Office',
    transport: 'Transport Hub',
    other: 'Other',
  }
  return labels[category] ?? category
}

export function verificationLabel(status: VerificationStatus): string {
  const labels: Record<VerificationStatus, string> = {
    verified: 'Verified',
    'community-reported': 'Community Reported',
    unverified: 'Not Verified',
  }
  return labels[status]
}

// Fix 14: accessibilityScore removed — was defined but never used anywhere in the UI.
// Restore when a score indicator is added to PlaceCard or PlaceDetails.