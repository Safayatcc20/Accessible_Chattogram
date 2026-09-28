// export interface Place {
//   id: string
//   name: string
//   category: PlaceCategory
//   address: string
//   area: string
//   latitude: number
//   longitude: number
//   phone?: string
//   website?: string
//   openingHours?: string

//   accessibility: {
//     wheelchairEntrance: boolean | null
//     ramp: boolean | null
//     elevator: boolean | null
//     accessibleToilet: boolean | null
//     accessibleParking: boolean | null
//     tactilePaving: boolean | null
//     audioAssistance: boolean | null
//     doorWidth?: string | null
//     entranceSurface?: string | null
//     elevatorNotes?: string | null
//     restroomNotes?: string | null
//     parkingDistance?: string | null
//     accessiblePathways?: boolean | null
//   }

//   verification: {
//     status: VerificationStatus
//     lastVerified: string | null
//     verificationCount: number
//     communityReports: number
//     source: string
//   }

//   isOpenNow?: boolean
//   description?: string
// }

// export type PlaceCategory =
//   | 'hospital'
//   | 'university'
//   | 'school'
//   | 'restaurant'
//   | 'shopping'
//   | 'government'
//   | 'transport'
//   | 'other'

// export type VerificationStatus = 'verified' | 'community-reported' | 'unverified'

// export interface FilterState {
//   categories: PlaceCategory[]
//   accessibilityFeatures: AccessibilityFeature[]
//   verificationStatus: VerificationStatus[]
//   openNow: boolean
//   hasContact: boolean
//   recentlyVerified: boolean
// }

// export type AccessibilityFeature =
//   | 'wheelchairEntrance'
//   | 'ramp'
//   | 'elevator'
//   | 'accessibleToilet'
//   | 'accessibleParking'
//   | 'tactilePaving'
//   | 'audioAssistance'

// export interface SearchResult {
//   places: Place[]
//   query: string
//   total: number
// }

// export interface Stats {
//   totalPlaces: number
//   totalReports: number
//   verifiedPlaces: number
//   areasCount: number
// }
export interface Place {
  id: string
  name: string
  category: PlaceCategory
  address: string
  area: string
  latitude: number
  longitude: number
  phone?: string
  website?: string
  openingHours?: string

  accessibility: {
    wheelchairEntrance: boolean | null
    ramp: boolean | null
    elevator: boolean | null
    accessibleToilet: boolean | null
    accessibleParking: boolean | null
    tactilePaving: boolean | null
    audioAssistance: boolean | null
    doorWidth?: string | null
    entranceSurface?: string | null
    elevatorNotes?: string | null
    restroomNotes?: string | null
    parkingDistance?: string | null
    accessiblePathways?: boolean | null
  }

  verification: {
    status: VerificationStatus
    lastVerified: string | null
    verificationCount: number
    communityReports: number
    source: string
  }

  isOpenNow?: boolean
  description?: string
}

export type PlaceCategory =
  | 'hospital'
  | 'university'
  | 'school'
  | 'restaurant'
  | 'shopping'
  | 'government'
  | 'transport'
  | 'other'

export type VerificationStatus = 'verified' | 'community-reported' | 'unverified'

export interface FilterState {
  categories: PlaceCategory[]
  accessibilityFeatures: AccessibilityFeature[]
  verificationStatus: VerificationStatus[]
  openNow: boolean
  hasContact: boolean
  recentlyVerified: boolean
}

export type AccessibilityFeature =
  | 'wheelchairEntrance'
  | 'ramp'
  | 'elevator'
  | 'accessibleToilet'
  | 'accessibleParking'
  | 'tactilePaving'
  | 'audioAssistance'


export interface Stats {
  totalPlaces: number
  totalReports: number
  verifiedPlaces: number
  areasCount: number
}