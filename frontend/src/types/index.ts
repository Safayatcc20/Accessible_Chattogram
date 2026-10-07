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

export interface SearchResult {
  places: Place[]
  query: string
  total: number
}

export interface Stats {
  totalPlaces: number
  totalReports: number
  verifiedPlaces: number
  areasCount: number
}

// Contribution types — Phase 11A
// ContributionStatus is the only value the client is permitted to set on create.
export type ContributionStatus = 'pending' | 'approved' | 'rejected'

// Full Contribution document shape as returned by fetchPendingContributions().
// Mirrors the Firestore contributions/{id} document, with createdAt
// converted from Timestamp to ISO string for consistency with the rest of the app.
export interface Contribution {
  id: string

  placeName: string
  category:  PlaceCategory
  address:   string
  area:      string
  phone:     string | null
  website:   string | null
  notes:     string | null

  accessibility: {
    wheelchairEntrance: boolean
    ramp:               boolean
    elevator:           boolean
    accessibleToilet:   boolean
    accessibleParking:  boolean
    tactilePaving:      boolean
    audioAssistance:    boolean
  }

  reporter: {
    name:  string | null
    email: string | null
  }

  status:     ContributionStatus
  createdAt:  string        // ISO string converted from Firestore Timestamp
  reviewedAt: string | null
}