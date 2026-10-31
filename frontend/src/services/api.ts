// // /**
// //  * API service layer.
// //  * Currently uses mock data. Replace mock implementations with real fetch() calls
// //  * to the FastAPI backend when it's available. The function signatures stay the same.
// //  */

// // import type { Place, FilterState, SearchResult, Stats, PlaceCategory } from '@/types'
// // import { MOCK_PLACES, MOCK_STATS } from '@/data/mockPlaces'

// // const SIMULATED_DELAY = 400 // ms

// // function delay(ms: number) {
// //   return new Promise(resolve => setTimeout(resolve, ms))
// // }

// // // GET /api/places
// // export async function fetchPlaces(filters?: Partial<FilterState>): Promise<Place[]> {
// //   await delay(SIMULATED_DELAY)
// //   let places = [...MOCK_PLACES]

// //   if (filters) {
// //     if (filters.categories && filters.categories.length > 0) {
// //       places = places.filter(p => filters.categories!.includes(p.category as PlaceCategory))
// //     }
// //     if (filters.verificationStatus && filters.verificationStatus.length > 0) {
// //       places = places.filter(p => filters.verificationStatus!.includes(p.verification.status))
// //     }
// //     if (filters.accessibilityFeatures && filters.accessibilityFeatures.length > 0) {
// //       places = places.filter(p =>
// //         filters.accessibilityFeatures!.every(
// //           feat => p.accessibility[feat as keyof typeof p.accessibility] === true
// //         )
// //       )
// //     }
// //     if (filters.openNow) {
// //       places = places.filter(p => p.isOpenNow)
// //     }
// //     if (filters.hasContact) {
// //       places = places.filter(p => p.phone || p.website)
// //     }
// //     if (filters.recentlyVerified) {
// //       const thirtyDaysAgo = new Date()
// //       thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
// //       places = places.filter(p => {
// //         if (!p.verification.lastVerified) return false
// //         return new Date(p.verification.lastVerified) >= thirtyDaysAgo
// //       })
// //     }
// //   }

// //   return places
// // }

// // // GET /api/places/:id
// // export async function fetchPlace(id: string): Promise<Place | null> {
// //   await delay(SIMULATED_DELAY)
// //   return MOCK_PLACES.find(p => p.id === id) ?? null
// // }

// // // GET /api/places/search
// // export async function searchPlaces(query: string): Promise<SearchResult> {
// //   await delay(SIMULATED_DELAY)
// //   const q = query.toLowerCase().trim()
// //   if (!q) return { places: [], query, total: 0 }

// //   const places = MOCK_PLACES.filter(p => {
// //     return (
// //       p.name.toLowerCase().includes(q) ||
// //       p.area.toLowerCase().includes(q) ||
// //       p.address.toLowerCase().includes(q) ||
// //       p.category.toLowerCase().includes(q) ||
// //       (p.description?.toLowerCase().includes(q) ?? false)
// //     )
// //   })

// //   return { places, query, total: places.length }
// // }

// // // GET /api/stats
// // export async function fetchStats(): Promise<Stats> {
// //   await delay(300)
// //   return MOCK_STATS
// // }

// // // POST /api/places/:id/verify
// // export async function verifyPlace(placeId: string): Promise<{ success: boolean }> {
// //   await delay(600)
// //   console.log('[MOCK] Verify place:', placeId)
// //   return { success: true }
// // }

// // // POST /api/reports
// // export async function submitReport(data: Record<string, unknown>): Promise<{ success: boolean; id: string }> {
// //   await delay(800)
// //   console.log('[MOCK] Submit report:', data)
// //   return { success: true, id: `report-${Date.now()}` }
// // }

// // // POST /api/places
// // export async function submitPlace(data: Record<string, unknown>): Promise<{ success: boolean; id: string }> {
// //   await delay(800)
// //   console.log('[MOCK] Submit place:', data)
// //   return { success: true, id: `place-${Date.now()}` }
// // }
// /**
//  * API service layer.
//  * Currently uses mock data. Replace mock implementations with real fetch() calls
//  * to the FastAPI backend when it's available. The function signatures stay the same.
//  */

// /**
//  * API service layer — Phase 9: connected to Firestore.
//  *
//  * PUBLIC INTERFACE IS UNCHANGED. All existing hooks, pages, and components
//  * continue to work without modification.
//  *
//  * Data flow:
//  *   Firestore `places` collection  →  fromFirestore()  →  Place
//  *
//  * What is live (Firestore):
//  *   fetchPlaces()  — reads `places` collection, filters client-side
//  *   fetchPlace()   — reads single `places/{id}` document
//  *
//  * What is still mocked (no Firestore data yet):
//  *   fetchStats()   — returns MOCK_STATS (no aggregation collection yet)
//  *   verifyPlace()  — mock stub
//  *   submitPlace()  — mock stub
//  *   submitReport() — mock stub
//  *   searchPlaces() — client-side mock (no search index yet)
//  */
// /**
//  * API service layer — Phase 9: connected to Firestore.
//  *
//  * PUBLIC INTERFACE IS UNCHANGED. All existing hooks, pages, and components
//  * continue to work without modification.
//  *
//  * Data flow:
//  *   Firestore `places` collection  →  fromFirestore()  →  Place
//  *
//  * What is live (Firestore):
//  *   fetchPlaces()  — reads `places` collection, filters client-side
//  *   fetchPlace()   — reads single `places/{id}` document
//  *
//  * What is still mocked (no Firestore data yet):
//  *   fetchStats()   — calculated from places collection (totalPlaces, verifiedPlaces, areasCount, totalReports)
//  *   verifyPlace()  — mock stub
//  *   submitPlace()  — mock stub
//  *   submitReport() — mock stub
//  *   searchPlaces() — client-side mock (no search index yet)
//  */

// import {
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   Timestamp,
// } from 'firebase/firestore'
// import { db } from '@/lib/firebase'
// // MOCK_STATS import removed in Phase 10 — stats now calculated from Firestore
// import type {
//   Place,
//   PlaceCategory,
//   VerificationStatus,
//   FilterState,
//   SearchResult,
//   Stats,
// } from '@/types'

// // ─── Firestore document shape ────────────────────────────────────────────────
// // Mirrors exactly what SeedFirestore.tsx wrote.
// // Kept private — never exported, never reaches the UI.

// interface FirestoreAccessibility {
//   wheelchairEntrance: boolean | null
//   ramp:               boolean | null
//   elevator:           boolean | null
//   accessibleToilet:   boolean | null
//   accessibleParking:  boolean | null
//   tactilePaving:      boolean | null
//   audioAssistance:    boolean | null
//   accessiblePathways: boolean | null
//   doorWidth:          string  | null
//   entranceSurface:    string  | null
//   elevatorNotes:      string  | null
//   restroomNotes:      string  | null
//   parkingDistance:    string  | null
// }

// interface FirestoreVerification {
//   status:            string
//   lastVerified:      Timestamp | null
//   verificationCount: number
//   communityReports:  number
//   source:            string
// }

// interface FirestorePlace {
//   name:         string
//   category:     string
//   address:      string
//   area:         string
//   description:  string | null
//   phone:        string | null
//   website:      string | null
//   openingHours: string | null
//   latitude:     number
//   longitude:    number
//   isOpenNow:    boolean | null
//   accessibility: FirestoreAccessibility
//   verification:  FirestoreVerification
//   createdAt:    Timestamp
//   updatedAt:    Timestamp
// }

// // ─── Converter ───────────────────────────────────────────────────────────────

// /**
//  * Convert a Firestore Timestamp | null to 'YYYY-MM-DD' | null.
//  * The rest of the app (utils.ts, PlaceDetails, PlaceCard) expect this format.
//  */
// function timestampToDateString(ts: Timestamp | null): string | null {
//   if (!ts) return null
//   const d = ts.toDate()
//   // Use UTC values to avoid timezone-shifted dates
//   const yyyy = d.getUTCFullYear()
//   const mm   = String(d.getUTCMonth() + 1).padStart(2, '0')
//   const dd   = String(d.getUTCDate()).padStart(2, '0')
//   return `${yyyy}-${mm}-${dd}`
// }

// /**
//  * Map a raw Firestore document + its ID to the app-facing Place type.
//  * All Firestore-specific types are consumed here and never leak out.
//  */
// function fromFirestore(id: string, data: FirestorePlace): Place {
//   const a = data.accessibility

//   return {
//     id,                                          // doc.id → Place.id
//     name:         data.name,
//     category:     data.category     as PlaceCategory,
//     address:      data.address,
//     area:         data.area,
//     description:  data.description  ?? undefined,
//     phone:        data.phone        ?? undefined,
//     website:      data.website      ?? undefined,
//     openingHours: data.openingHours ?? undefined,
//     latitude:     data.latitude,
//     longitude:    data.longitude,
//     isOpenNow:    data.isOpenNow    ?? undefined,

//     accessibility: {
//       wheelchairEntrance: a.wheelchairEntrance,
//       ramp:               a.ramp,
//       elevator:           a.elevator,
//       accessibleToilet:   a.accessibleToilet,
//       accessibleParking:  a.accessibleParking,
//       tactilePaving:      a.tactilePaving,
//       audioAssistance:    a.audioAssistance,
//       // optional sub-fields: null stored in Firestore → undefined in Place type
//       accessiblePathways: a.accessiblePathways ?? undefined,
//       doorWidth:          a.doorWidth          ?? undefined,
//       entranceSurface:    a.entranceSurface    ?? undefined,
//       elevatorNotes:      a.elevatorNotes      ?? undefined,
//       restroomNotes:      a.restroomNotes      ?? undefined,
//       parkingDistance:    a.parkingDistance    ?? undefined,
//     },

//     verification: {
//       status:            data.verification.status as VerificationStatus,
//       // KEY CONVERSION: Firestore Timestamp | null → 'YYYY-MM-DD' | null
//       lastVerified:      timestampToDateString(data.verification.lastVerified),
//       verificationCount: data.verification.verificationCount,
//       communityReports:  data.verification.communityReports,
//       source:            data.verification.source,
//     },
//   }
// }

// // ─── Client-side filters (same logic as before, unchanged) ──────────────────

// function applyFilters(places: Place[], filters: Partial<FilterState>): Place[] {
//   let result = places

//   if (filters.categories && filters.categories.length > 0) {
//     result = result.filter(p =>
//       filters.categories!.includes(p.category as PlaceCategory)
//     )
//   }
//   if (filters.verificationStatus && filters.verificationStatus.length > 0) {
//     result = result.filter(p =>
//       filters.verificationStatus!.includes(p.verification.status)
//     )
//   }
//   if (filters.accessibilityFeatures && filters.accessibilityFeatures.length > 0) {
//     result = result.filter(p =>
//       filters.accessibilityFeatures!.every(
//         feat => p.accessibility[feat as keyof typeof p.accessibility] === true
//       )
//     )
//   }
//   if (filters.openNow) {
//     result = result.filter(p => p.isOpenNow)
//   }
//   if (filters.hasContact) {
//     result = result.filter(p => p.phone || p.website)
//   }
//   if (filters.recentlyVerified) {
//     const thirtyDaysAgo = new Date()
//     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
//     result = result.filter(p => {
//       if (!p.verification.lastVerified) return false
//       return new Date(p.verification.lastVerified) >= thirtyDaysAgo
//     })
//   }

//   return result
// }

// // ─── Public API — same signatures as before ──────────────────────────────────

// // GET /api/places
// export async function fetchPlaces(filters?: Partial<FilterState>): Promise<Place[]> {
//   const snap  = await getDocs(collection(db, 'places'))
//   const places = snap.docs.map(d => fromFirestore(d.id, d.data() as FirestorePlace))
//   return filters ? applyFilters(places, filters) : places
// }

// // GET /api/places/:id
// export async function fetchPlace(id: string): Promise<Place | null> {
//   const snap = await getDoc(doc(db, 'places', id))
//   if (!snap.exists()) return null
//   return fromFirestore(snap.id, snap.data() as FirestorePlace)
// }

// // GET /api/places/search — client-side over Firestore data
// export async function searchPlaces(query: string): Promise<SearchResult> {
//   const q = query.toLowerCase().trim()
//   if (!q) return { places: [], query, total: 0 }

//   const snap   = await getDocs(collection(db, 'places'))
//   const places = snap.docs
//     .map(d => fromFirestore(d.id, d.data() as FirestorePlace))
//     .filter(p =>
//       p.name.toLowerCase().includes(q)        ||
//       p.area.toLowerCase().includes(q)        ||
//       p.address.toLowerCase().includes(q)     ||
//       p.category.toLowerCase().includes(q)    ||
//       (p.description?.toLowerCase().includes(q) ?? false)
//     )

//   return { places, query, total: places.length }
// }

// // GET /api/stats — Phase 10: calculated from Firestore places collection
// export async function fetchStats(): Promise<Stats> {
//   const snap = await getDocs(collection(db, 'places'))

//   let verifiedPlaces = 0
//   let totalReports   = 0
//   const areas        = new Set<string>()

//   for (const d of snap.docs) {
//     const data = d.data() as FirestorePlace
//     if (data.verification.status === 'verified') verifiedPlaces++
//     totalReports += data.verification.communityReports ?? 0
//     if (data.area) areas.add(data.area)
//   }

//   return {
//     totalPlaces:    snap.size,
//     verifiedPlaces,
//     totalReports,
//     areasCount:     areas.size,
//   }
// }

// // POST /api/places/:id/verify — mock stub
// export async function verifyPlace(placeId: string): Promise<{ success: boolean }> {
//   console.log('[MOCK] Verify place:', placeId)
//   return { success: true }
// }

// // POST /api/reports — mock stub
// export async function submitReport(
//   data: Record<string, unknown>
// ): Promise<{ success: boolean; id: string }> {
//   console.log('[MOCK] Submit report:', data)
//   return { success: true, id: `report-${Date.now()}` }
// }

// // POST /api/places — mock stub
// export async function submitPlace(
//   data: Record<string, unknown>
// ): Promise<{ success: boolean; id: string }> {
//   console.log('[MOCK] Submit place:', data)
//   return { success: true, id: `place-${Date.now()}` }
// }


/**
 * API service layer — Phase 9: connected to Firestore.
 *
 * PUBLIC INTERFACE IS UNCHANGED. All existing hooks, pages, and components
 * continue to work without modification.
 *
 * Data flow:
 *   Firestore `places` collection  →  fromFirestore()  →  Place
 *
 * What is live (Firestore):
 *   fetchPlaces()  — reads `places` collection, filters client-side
 *   fetchPlace()   — reads single `places/{id}` document
 *
 * What is still mocked (no Firestore data yet):
 *   fetchStats()   — calculated from places collection (totalPlaces, verifiedPlaces, areasCount, totalReports)
 *   verifyPlace()  — mock stub
 *   submitPlace()  — writes to `contributions` collection (Phase 11A)
 *   submitReport() — creates a private pending place update report
 *   searchPlaces() — client-side mock (no search index yet)
 */

/**
 * API service layer — Phase 9: connected to Firestore.
 *
 * PUBLIC INTERFACE IS UNCHANGED. All existing hooks, pages, and components
 * continue to work without modification.
 *
 * Data flow:
 *   Firestore `places` collection  →  fromFirestore()  →  Place
 *
 * What is live (Firestore):
 *   fetchPlaces()  — reads `places` collection, filters client-side
 *   fetchPlace()   — reads single `places/{id}` document
 *
 * What is still mocked (no Firestore data yet):
 *   fetchStats()   — calculated from places collection (totalPlaces, verifiedPlaces, areasCount, totalReports)
 *   verifyPlace()  — mock stub
 *   submitPlace()  — writes to `contributions` collection (Phase 11A)
 *   submitReport() — mock stub
 *   searchPlaces() — client-side mock (no search index yet)
 */

/**
 * API service layer — Phase 9: connected to Firestore.
 *
 * PUBLIC INTERFACE IS UNCHANGED. All existing hooks, pages, and components
 * continue to work without modification.
 *
 * Data flow:
 *   Firestore `places` collection  →  fromFirestore()  →  Place
 *
 * What is live (Firestore):
 *   fetchPlaces()  — reads `places` collection, filters client-side
 *   fetchPlace()   — reads single `places/{id}` document
 *
 * What is still mocked (no Firestore data yet):
 *   fetchStats()   — calculated from places collection (totalPlaces, verifiedPlaces, areasCount, totalReports)
 *   verifyPlace()  — mock stub
 *   submitPlace()  — writes to `contributions` collection (Phase 11A)
 *   submitReport() — mock stub
 *   searchPlaces() — client-side mock (no search index yet)
 */

/**
 * API service layer — Phase 9: connected to Firestore.
 *
 * PUBLIC INTERFACE IS UNCHANGED. All existing hooks, pages, and components
 * continue to work without modification.
 *
 * Data flow:
 *   Firestore `places` collection  →  fromFirestore()  →  Place
 *
 * What is live (Firestore):
 *   fetchPlaces()  — reads `places` collection, filters client-side
 *   fetchPlace()   — reads single `places/{id}` document
 *
 * What is still mocked (no Firestore data yet):
 *   fetchStats()   — calculated from places collection (totalPlaces, verifiedPlaces, areasCount, totalReports)
 *   verifyPlace()  — mock stub
 *   submitPlace()  — writes to `contributions` collection (Phase 11A)
 *   submitReport() — mock stub
 *   searchPlaces() — client-side mock (no search index yet)
 */

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  Timestamp,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore'
import { db,auth } from '@/lib/firebase'
// MOCK_STATS import removed in Phase 10 — stats now calculated from Firestore
import type {
  Place,
  PlaceCategory,
  VerificationStatus,
  FilterState,
  SearchResult,
  Stats,
  ContributionStatus,
  Contribution,
  VerificationRequest,
  VerificationRequestStatus,
  PlaceReportCategory,
  PlaceReportField,
  PlaceReportInput,
  PlaceReport,
  PlaceReportChanges,
  PlaceReportValue,
} from '@/types'

// ─── Firestore document shape ────────────────────────────────────────────────
// Mirrors exactly what SeedFirestore.tsx wrote.
// Kept private — never exported, never reaches the UI.

interface FirestoreAccessibility {
  wheelchairEntrance: boolean | null
  ramp:               boolean | null
  elevator:           boolean | null
  accessibleToilet:   boolean | null
  accessibleParking:  boolean | null
  tactilePaving:      boolean | null
  audioAssistance:    boolean | null
  accessiblePathways: boolean | null
  doorWidth:          string  | null
  entranceSurface:    string  | null
  elevatorNotes:      string  | null
  restroomNotes:      string  | null
  parkingDistance:    string  | null
}

interface FirestoreVerification {
  status:            string
  lastVerified:      Timestamp | null
  verificationCount: number
  communityReports:  number
  source:            string
  verifiedAt?: unknown
  verifiedBy?: string | null
  communityVerifiedAt?: Timestamp | null
  communityVerifiedBy?: string | null
  communityVerificationCount?: number
}

interface FirestorePlace {
  name:         string
  category:     string
  address:      string
  area:         string
  description:  string | null
  phone:        string | null
  website:      string | null
  openingHours: string | null
  latitude:     number
  longitude:    number
  isOpenNow:    boolean | null
  accessibility: FirestoreAccessibility
  verification:  FirestoreVerification
  createdAt:    Timestamp
  updatedAt:    Timestamp
}

// ─── Converter ───────────────────────────────────────────────────────────────

/**
 * Convert a Firestore Timestamp | null to 'YYYY-MM-DD' | null.
 * The rest of the app (utils.ts, PlaceDetails, PlaceCard) expect this format.
 */
function timestampToDateString(ts: Timestamp | null): string | null {
  if (!ts) return null
  const d = ts.toDate()
  // Use UTC values to avoid timezone-shifted dates
  const yyyy = d.getUTCFullYear()
  const mm   = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd   = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Map a raw Firestore document + its ID to the app-facing Place type.
 * All Firestore-specific types are consumed here and never leak out.
 */
function fromFirestore(id: string, data: FirestorePlace): Place {
  const a = data.accessibility

  return {
    id,                                          // doc.id → Place.id
    name:         data.name,
    category:     data.category     as PlaceCategory,
    address:      data.address,
    area:         data.area,
    description:  data.description  ?? undefined,
    phone:        data.phone        ?? undefined,
    website:      data.website      ?? undefined,
    openingHours: data.openingHours ?? undefined,
    latitude:     data.latitude,
    longitude:    data.longitude,
    isOpenNow:    data.isOpenNow    ?? undefined,

    accessibility: {
      wheelchairEntrance: a.wheelchairEntrance,
      ramp:               a.ramp,
      elevator:           a.elevator,
      accessibleToilet:   a.accessibleToilet,
      accessibleParking:  a.accessibleParking,
      tactilePaving:      a.tactilePaving,
      audioAssistance:    a.audioAssistance,
      // optional sub-fields: null stored in Firestore → undefined in Place type
      accessiblePathways: a.accessiblePathways ?? undefined,
      doorWidth:          a.doorWidth          ?? undefined,
      entranceSurface:    a.entranceSurface    ?? undefined,
      elevatorNotes:      a.elevatorNotes      ?? undefined,
      restroomNotes:      a.restroomNotes      ?? undefined,
      parkingDistance:    a.parkingDistance    ?? undefined,
    },

    verification: {
      status:            data.verification.status as VerificationStatus,
      // KEY CONVERSION: Firestore Timestamp | null → 'YYYY-MM-DD' | null
      lastVerified:      timestampToDateString(data.verification.lastVerified),
      verificationCount: data.verification.verificationCount,
      communityReports:  data.verification.communityReports,
      source:            data.verification.source,
      // Phase 16.2 provenance fields — absent on legacy docs, undefined is fine
      verifiedAt: timestampToDateString(
        data.verification.verifiedAt instanceof Timestamp
          ? data.verification.verifiedAt
          : null
      ),
      verifiedBy: data.verification.verifiedBy ?? null,
      communityVerifiedAt: timestampToDateString(data.verification.communityVerifiedAt ?? null),
      communityVerifiedBy: data.verification.communityVerifiedBy ?? null,
      communityVerificationCount: data.verification.communityVerificationCount ?? 0,
    },
  }
}

// ─── Client-side filters (same logic as before, unchanged) ──────────────────

function applyFilters(places: Place[], filters: Partial<FilterState>): Place[] {
  let result = places

  if (filters.categories && filters.categories.length > 0) {
    result = result.filter(p =>
      filters.categories!.includes(p.category as PlaceCategory)
    )
  }
  if (filters.verificationStatus && filters.verificationStatus.length > 0) {
    result = result.filter(p =>
      filters.verificationStatus!.includes(p.verification.status)
    )
  }
  if (filters.accessibilityFeatures && filters.accessibilityFeatures.length > 0) {
    result = result.filter(p =>
      filters.accessibilityFeatures!.every(
        feat => p.accessibility[feat as keyof typeof p.accessibility] === true
      )
    )
  }
  if (filters.openNow) {
    result = result.filter(p => p.isOpenNow)
  }
  if (filters.hasContact) {
    result = result.filter(p => p.phone || p.website)
  }
  if (filters.recentlyVerified) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    result = result.filter(p => {
      if (!p.verification.lastVerified) return false
      return new Date(p.verification.lastVerified) >= thirtyDaysAgo
    })
  }

  return result
}

// ─── Public API — same signatures as before ──────────────────────────────────

// GET /api/places
export async function fetchPlaces(filters?: Partial<FilterState>): Promise<Place[]> {
  const snap  = await getDocs(collection(db, 'places'))
  const places = snap.docs.map(d => fromFirestore(d.id, d.data() as FirestorePlace))
  return filters ? applyFilters(places, filters) : places
}

// GET /api/places/:id
export async function fetchPlace(id: string): Promise<Place | null> {
  const snap = await getDoc(doc(db, 'places', id))
  if (!snap.exists()) return null
  return fromFirestore(snap.id, snap.data() as FirestorePlace)
}

// GET /api/places/search — client-side over Firestore data
export async function searchPlaces(searchQuery: string): Promise<SearchResult> {
  const q = searchQuery.toLowerCase().trim()
  if (!q) return { places: [], query: searchQuery, total: 0 }

  const snap   = await getDocs(collection(db, 'places'))
  const places = snap.docs
    .map(d => fromFirestore(d.id, d.data() as FirestorePlace))
    .filter(p =>
      p.name.toLowerCase().includes(q)        ||
      p.area.toLowerCase().includes(q)        ||
      p.address.toLowerCase().includes(q)     ||
      p.category.toLowerCase().includes(q)    ||
      (p.description?.toLowerCase().includes(q) ?? false)
    )

  return { places, query: searchQuery, total: places.length }
}

// GET /api/stats — Phase 10: calculated from Firestore places collection
export async function fetchStats(): Promise<Stats> {
  const snap = await getDocs(collection(db, 'places'))

  let verifiedPlaces = 0
  let totalReports   = 0
  const areas        = new Set<string>()

  for (const d of snap.docs) {
    const data = d.data() as FirestorePlace
    if (data.verification.status === 'verified' || data.verification.status === 'admin-verified') verifiedPlaces++
    totalReports += data.verification.communityReports ?? 0
    if (data.area) areas.add(data.area)
  }

  return {
    totalPlaces:    snap.size,
    verifiedPlaces,
    totalReports,
    areasCount:     areas.size,
  }
}

// GET /api/admin/contributions -- admin only
// Reads all pending contributions from Firestore, newest first.
// The Firestore rule (allow read: if isAdmin()) enforces server-side that
// only admins can call this — a non-admin gets permission-denied.
export async function fetchPendingContributions(): Promise<Contribution[]> {
  const q = query(
    collection(db, 'contributions'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)

  return snap.docs.map(d => {
    const data = d.data()
    const ts   = data.createdAt as Timestamp | null

    return {
      id:        d.id,
      placeName: data.placeName as string,
      category:  data.category  as Contribution['category'],
      address:   data.address   as string,
      area:      data.area      as string,
      phone:     (data.phone    as string | null)  ?? null,
      website:   (data.website  as string | null)  ?? null,
      notes:     (data.notes    as string | null)  ?? null,
      accessibility: {
        wheelchairEntrance: Boolean(data.accessibility?.wheelchairEntrance),
        ramp:               Boolean(data.accessibility?.ramp),
        elevator:           Boolean(data.accessibility?.elevator),
        accessibleToilet:   Boolean(data.accessibility?.accessibleToilet),
        accessibleParking:  Boolean(data.accessibility?.accessibleParking),
        tactilePaving:      Boolean(data.accessibility?.tactilePaving),
        audioAssistance:    Boolean(data.accessibility?.audioAssistance),
      },
      reporter: {
        name:  (data.reporter?.name  as string | null) ?? null,
        email: (data.reporter?.email as string | null) ?? null,
      },
      status:     data.status as Contribution['status'],
      createdAt:  ts ? ts.toDate().toISOString() : new Date().toISOString(),
      reviewedAt: null,
    } satisfies Contribution
  })
}

// ─── Admin moderation actions ─────────────────────────────────────────────────

/**
 * Approve a pending contribution.
 *
 * Uses a Firestore transaction to:
 *   1. Verify the contribution still has status === 'pending' (prevents double-approve).
 *   2. Create a new document in `places` with the provided coordinates.
 *   3. Update the contribution status to 'approved' and set reviewedAt.
 *
 * Throws if the contribution is not found, already reviewed, or the caller
 * lacks admin permissions (Firestore rules enforce this server-side).
 *
 * @param contributionId  Firestore document ID of the contribution
 * @param latitude        Validated latitude  (-90  … 90)
 * @param longitude       Validated longitude (-180 … 180)
 */
/**
 * Validate that a coordinate value is a finite number within the given range.
 * Rejects NaN, Infinity, -Infinity, and out-of-range values.
 * Throws with a clear, UI-displayable message on failure.
 */
function assertCoordinate(
  value: number,
  name: 'Latitude' | 'Longitude',
  min: number,
  max: number,
): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`invalid-coordinates: ${name} must be a finite number, got ${value}.`)
  }
  if (value < min || value > max) {
    throw new Error(
      `invalid-coordinates: ${name} must be between ${min} and ${max}, got ${value}.`
    )
  }
}
export async function approveContribution(
  contributionId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  const contributionRef = doc(db, 'contributions', contributionId)
  const newPlaceRef     = doc(collection(db, 'places'))   // auto-id, created inside transaction
    // Validate before opening a Firestore transaction — nothing is written if
  // either coordinate is invalid.
  assertCoordinate(latitude,  'Latitude',  -90,  90)
  assertCoordinate(longitude, 'Longitude', -180, 180)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(contributionRef)

    if (!snap.exists()) {
      throw new Error('contribution-not-found')
    }

    const data = snap.data()

    if (data.status !== 'pending') {
      throw new Error('contribution-already-reviewed')
    }

    // Build the place document — follows FirestorePlace shape exactly.
    // Optional fields the contribution doesn't carry are set to null.
    const placeDoc = {
      name:         data.placeName as string,
      category:     data.category  as string,
      address:      data.address   as string,
      area:         data.area      as string,
      description:  null,
      phone:        (data.phone    as string | null) ?? null,
      website:      (data.website  as string | null) ?? null,
      openingHours: null,
      latitude,
      longitude,
      isOpenNow:    null,

      accessibility: {
        wheelchairEntrance: Boolean(data.accessibility?.wheelchairEntrance),
        ramp:               Boolean(data.accessibility?.ramp),
        elevator:           Boolean(data.accessibility?.elevator),
        accessibleToilet:   Boolean(data.accessibility?.accessibleToilet),
        accessibleParking:  Boolean(data.accessibility?.accessibleParking),
        tactilePaving:      Boolean(data.accessibility?.tactilePaving),
        audioAssistance:    Boolean(data.accessibility?.audioAssistance),
        // Extended fields not collected in the contribution form
        accessiblePathways: null,
        doorWidth:          null,
        entranceSurface:    null,
        elevatorNotes:      null,
        restroomNotes:      null,
        parkingDistance:    null,
      },

            verification: {
        status:            'admin-verified' as VerificationStatus,
        lastVerified:      null,
        verificationCount: 0,
        communityReports:  1,
        source:            'community-contribution',
        // Phase 16.2: record when and by whom this place was approved.
        verifiedAt:        serverTimestamp(),
        verifiedBy:        auth.currentUser?.uid ?? null,
      },

      createdAt:  serverTimestamp(),
      updatedAt:  serverTimestamp(),
    }

    tx.set(newPlaceRef, placeDoc)
    tx.update(contributionRef, {
      status:     'approved' satisfies ContributionStatus,
      reviewedAt: serverTimestamp(),
    })
  })
}

/**
 * Reject a pending contribution.
 *
 * Uses runTransaction so the pending-status check and the status update are
 * atomic. Concurrent approve + reject operations cannot silently overwrite
 * each other: whichever transaction commits second will re-read the already-
 * updated status and throw 'contribution-already-reviewed'.
 *
 * No place document is created on rejection.
 *
 * Throws if the contribution is not found, already reviewed, or the caller
 * lacks admin permissions (Firestore rules enforce this server-side).
 *
 * @param contributionId  Firestore document ID of the contribution
 */
export async function rejectContribution(contributionId: string): Promise<void> {
  const contributionRef = doc(db, 'contributions', contributionId)

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(contributionRef)

    if (!snap.exists()) {
      throw new Error('contribution-not-found')
    }

    if (snap.data().status !== 'pending') {
      throw new Error('contribution-already-reviewed')
    }

    tx.update(contributionRef, {
      status:     'rejected' satisfies ContributionStatus,
      reviewedAt: serverTimestamp(),
    })
  })
}

const VERIFICATION_FIELDS = [
  'wheelchairEntrance', 'ramp', 'elevator', 'accessibleToilet',
  'accessibleParking', 'tactilePaving', 'audioAssistance',
] as const

export async function submitVerificationRequest(input: {
  placeId: string
  placeName: string
  accessibility: Record<(typeof VERIFICATION_FIELDS)[number], boolean>
  notes: string | null
}): Promise<string> {
  const placeSnap = await getDoc(doc(db, 'places', input.placeId))
  if (!placeSnap.exists()) throw new Error('place-not-found')
  const canonicalPlaceName = (placeSnap.data().name as string | undefined) ?? input.placeName
  const payload = Object.fromEntries(VERIFICATION_FIELDS.map(key => [key, input.accessibility[key]]))
  const requestRef = await addDoc(collection(db, 'verificationRequests'), {
    placeId: input.placeId,
    placeName: canonicalPlaceName,
    accessibility: payload,
    notes: input.notes,
    submitterUid: auth.currentUser?.uid ?? null,
    status: 'pending' satisfies VerificationRequestStatus,
    createdAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
  })
  return requestRef.id
}

export async function fetchPendingVerificationRequests(): Promise<VerificationRequest[]> {
  const q = query(collection(db, 'verificationRequests'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => verificationRequestFromDocument(d.id, d.data()))
}

export async function fetchReviewedVerificationRequests(): Promise<VerificationRequest[]> {
  const q = query(
    collection(db, 'verificationRequests'),
    where('status', 'in', ['approved', 'rejected']),
    orderBy('reviewedAt', 'desc'),
    limit(50),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => verificationRequestFromDocument(d.id, d.data()))
}

function verificationRequestFromDocument(id: string, data: Record<string, unknown>): VerificationRequest {
  const createdAt = data.createdAt as Timestamp | null
  const reviewedAt = data.reviewedAt as Timestamp | null
  return {
    id,
    placeId: data.placeId as string,
    placeName: data.placeName as string,
    accessibility: Object.fromEntries(VERIFICATION_FIELDS.map(key => [key, Boolean((data.accessibility as Record<string, unknown> | undefined)?.[key])])) as VerificationRequest['accessibility'],
    notes: (data.notes as string | null) ?? null,
    submitterUid: (data.submitterUid as string | null) ?? null,
    status: data.status as VerificationRequest['status'],
    createdAt: createdAt ? createdAt.toDate().toISOString() : new Date().toISOString(),
    reviewedAt: reviewedAt ? reviewedAt.toDate().toISOString() : null,
    reviewedBy: (data.reviewedBy as string | null) ?? null,
  }
}

export async function reviewVerificationRequest(requestId: string, decision: 'approved' | 'rejected'): Promise<void> {
  const requestRef = doc(db, 'verificationRequests', requestId)
  await runTransaction(db, async tx => {
    const requestSnap = await tx.get(requestRef)
    if (!requestSnap.exists()) throw new Error('verification-request-not-found')
    if (requestSnap.data().status !== 'pending') throw new Error('verification-request-already-reviewed')

    const placeId = requestSnap.data().placeId as string
    const placeRef = doc(db, 'places', placeId)
    const placeSnap = await tx.get(placeRef)
    if (!placeSnap.exists()) throw new Error('verification-place-not-found')

    const reviewedBy = auth.currentUser?.uid
    if (!reviewedBy) throw new Error('admin-auth-required')
    const reviewPatch = { status: decision, reviewedAt: serverTimestamp(), reviewedBy }
    tx.update(requestRef, reviewPatch)

    if (decision === 'approved') {
      const verification = placeSnap.data().verification ?? {}
      const currentCount = Number(verification.communityVerificationCount ?? 0)
      tx.update(placeRef, {
        'verification.communityVerificationCount': currentCount + 1,
        'verification.communityVerifiedAt': serverTimestamp(),
        'verification.communityVerifiedBy': reviewedBy,
      })
    }
  })
}

// POST /api/places/:id/verify — mock stub
export async function verifyPlace(placeId: string): Promise<{ success: boolean }> {
  console.log('[MOCK] Verify place:', placeId)
  return { success: true }
}

const REPORT_FIELDS_BY_CATEGORY: Record<PlaceReportCategory, readonly PlaceReportField[]> = {
  'place-details': ['name', 'address', 'area', 'phone', 'website', 'openingHours'],
  accessibility: [
    'wheelchairEntrance', 'ramp', 'elevator', 'accessibleToilet',
    'accessibleParking', 'tactilePaving', 'audioAssistance',
  ],
}

// Creates a private pending report only; it never writes to the places collection.
export async function submitReport(input: PlaceReportInput): Promise<{ success: true; id: string }> {
  if (!input.placeId.trim()) throw new Error('report-place-id-required')
  if (input.category !== 'place-details' && input.category !== 'accessibility') {
    throw new Error('report-category-invalid')
  }
  const allowedFields = REPORT_FIELDS_BY_CATEGORY[input.category]
  if (
    input.fields.length === 0 ||
    input.fields.length > allowedFields.length ||
    new Set(input.fields).size !== input.fields.length ||
    input.fields.some(field => !allowedFields.includes(field))
  ) throw new Error('report-fields-invalid')
  const description = input.description.trim()
  if (description.length === 0 || description.length > 2000) throw new Error('report-description-invalid')

  const placeSnap = await getDoc(doc(db, 'places', input.placeId))
  if (!placeSnap.exists()) throw new Error('place-not-found')
  const placeName = placeSnap.data().name
  if (typeof placeName !== 'string' || placeName.length < 2 || placeName.length > 150) {
    throw new Error('report-place-name-invalid')
  }

  const reportRef = await addDoc(collection(db, 'reports'), {
    placeId: input.placeId,
    placeName,
    category: input.category,
    fields: input.fields,
    description,
    reporterUid: auth.currentUser?.uid ?? null,
    status: 'pending',
    createdAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
    reviewDecision: null,
    rejectionReason: null,
    appliedChanges: null,
  })
  return { success: true, id: reportRef.id }
}

function placeReportFromDocument(id: string, data: Record<string, unknown>): PlaceReport {
  const createdAt = data.createdAt as Timestamp | null
  const reviewedAt = data.reviewedAt as Timestamp | null
  return {
    id,
    placeId: data.placeId as string,
    placeName: data.placeName as string,
    category: data.category as PlaceReportCategory,
    fields: data.fields as PlaceReportField[],
    description: data.description as string,
    reporterUid: (data.reporterUid as string | null) ?? null,
    status: data.status as PlaceReport['status'],
    createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : new Date().toISOString(),
    reviewedAt: reviewedAt instanceof Timestamp ? reviewedAt.toDate().toISOString() : null,
    reviewedBy: (data.reviewedBy as string | null) ?? null,
    reviewDecision: (data.reviewDecision as PlaceReport['reviewDecision']) ?? null,
    rejectionReason: (data.rejectionReason as string | null) ?? null,
    appliedChanges: (data.appliedChanges as PlaceReportChanges | null) ?? null,
  }
}

export async function fetchPendingPlaceReports(): Promise<PlaceReport[]> {
  const reportsQuery = query(collection(db, 'reports'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(reportsQuery)
  return snapshot.docs.map(report => placeReportFromDocument(report.id, report.data()))
}

export async function fetchReviewedPlaceReports(): Promise<PlaceReport[]> {
  const reportsQuery = query(
    collection(db, 'reports'),
    where('status', 'in', ['approved', 'rejected']),
    orderBy('reviewedAt', 'desc'),
    limit(50),
  )
  const snapshot = await getDocs(reportsQuery)
  return snapshot.docs.map(report => placeReportFromDocument(report.id, report.data()))
}

function reportFieldValue(placeData: Record<string, unknown>, field: PlaceReportField): unknown {
  if (['wheelchairEntrance', 'ramp', 'elevator', 'accessibleToilet', 'accessibleParking', 'tactilePaving', 'audioAssistance'].includes(field)) {
    return (placeData.accessibility as Record<string, unknown> | undefined)?.[field] ?? null
  }
  return placeData[field] ?? null
}

function validateReportReviewValues(
  report: PlaceReport,
  values: PlaceReportChanges,
  label: 'current' | 'approved',
): PlaceReportChanges {
  const keys = Object.keys(values) as PlaceReportField[]
  if (
    keys.length !== report.fields.length ||
    keys.some(field => !report.fields.includes(field)) ||
    report.fields.some(field => !Object.prototype.hasOwnProperty.call(values, field))
  ) throw new Error(`report-${label}-fields-invalid`)

  const result: PlaceReportChanges = {}
  for (const field of report.fields) {
    const value = values[field]
    const isAccessibility = ['wheelchairEntrance', 'ramp', 'elevator', 'accessibleToilet', 'accessibleParking', 'tactilePaving', 'audioAssistance'].includes(field)
    if (isAccessibility) {
      if (value !== null && typeof value !== 'boolean') throw new Error(`report-${label}-value-invalid`)
      result[field] = value
      continue
    }

    const nullableText = field === 'phone' || field === 'website' || field === 'openingHours'
    if (value === null && nullableText) {
      result[field] = null
      continue
    }
    if (typeof value !== 'string') throw new Error(`report-${label}-value-invalid`)
    const trimmed = value.trim()
    const minLength = field === 'name' ? 2 : field === 'address' ? 5 : field === 'area' ? 2 : 0
    if (trimmed.length < minLength) throw new Error(`report-${label}-value-required`)
    const maxLength = field === 'website' ? 2048 : field === 'address' ? 300 : field === 'area' ? 100 : field === 'phone' ? 30 : field === 'name' ? 150 : 500
    if (trimmed.length > maxLength) throw new Error(`report-${label}-value-too-long`)
    result[field] = trimmed || (nullableText ? null : trimmed)
  }
  return result
}

function reportFieldUpdatePath(field: PlaceReportField): string {
  return ['wheelchairEntrance', 'ramp', 'elevator', 'accessibleToilet', 'accessibleParking', 'tactilePaving', 'audioAssistance'].includes(field)
    ? `accessibility.${field}`
    : field
}

export async function reviewPlaceReport(input: {
  reportId: string
  decision: 'approved' | 'rejected'
  reason?: string
  expectedCurrentValues?: PlaceReportChanges
  approvedChanges?: PlaceReportChanges
}): Promise<void> {
  const reportRef = doc(db, 'reports', input.reportId)
  const reviewerUid = auth.currentUser?.uid
  if (!reviewerUid) throw new Error('admin-auth-required')

  if (input.decision === 'rejected') {
    const reason = input.reason?.trim() ?? ''
    if (!reason || reason.length > 1000) throw new Error('report-rejection-reason-required')
    await runTransaction(db, async transaction => {
      const reportSnapshot = await transaction.get(reportRef)
      if (!reportSnapshot.exists()) throw new Error('report-not-found')
      if (reportSnapshot.data().status !== 'pending') throw new Error('report-already-reviewed')
      transaction.update(reportRef, {
        status: 'rejected',
        reviewDecision: 'rejected',
        reviewedAt: serverTimestamp(),
        reviewedBy: reviewerUid,
        rejectionReason: reason,
        appliedChanges: null,
      })
    })
    return
  }

  await runTransaction(db, async transaction => {
    const reportSnapshot = await transaction.get(reportRef)
    if (!reportSnapshot.exists()) throw new Error('report-not-found')
    const reportData = reportSnapshot.data()
    if (reportData.status !== 'pending') throw new Error('report-already-reviewed')

    const report = placeReportFromDocument(reportSnapshot.id, reportData)
    const expectedValues = validateReportReviewValues(report, input.expectedCurrentValues ?? {}, 'current')
    const approvedChanges = validateReportReviewValues(report, input.approvedChanges ?? {}, 'approved')
    const placeRef = doc(db, 'places', report.placeId)
    const placeSnapshot = await transaction.get(placeRef)
    if (!placeSnapshot.exists()) throw new Error('report-place-not-found')

    const placeData = placeSnapshot.data()
    for (const field of report.fields) {
      const expected = expectedValues[field] ?? null
      const current = reportFieldValue(placeData, field) ?? null
      if (current !== expected) throw new Error('report-place-changed')
    }

    const placePatch: Record<string, PlaceReportValue> = {}
    for (const field of report.fields) placePatch[reportFieldUpdatePath(field)] = approvedChanges[field] ?? null
    transaction.update(placeRef, placePatch)
    transaction.update(reportRef, {
      status: 'approved',
      reviewDecision: 'approved',
      reviewedAt: serverTimestamp(),
      reviewedBy: reviewerUid,
      rejectionReason: null,
      appliedChanges: approvedChanges,
    })
  })
}

// POST /api/places — Phase 11A: writes to contributions collection
// Accepts the ContributeFormData shape from Contribute.tsx via the existing
// Record<string,unknown> signature so no call-site changes are needed.
export async function submitPlace(
  data: Record<string, unknown>
): Promise<{ success: boolean; id: string }> {
  const docRef = await addDoc(collection(db, 'contributions'), {
    placeName: data.placeName ?? null,
    category:  data.category  ?? null,
    address:   data.address   ?? null,
    area:      data.area      ?? null,
    phone:     (data.phone    as string | undefined) || null,
    website:   (data.website  as string | undefined) || null,

    accessibility: {
      wheelchairEntrance: Boolean(data.wheelchairEntrance),
      ramp:               Boolean(data.ramp),
      elevator:           Boolean(data.elevator),
      accessibleToilet:   Boolean(data.accessibleToilet),
      accessibleParking:  Boolean(data.accessibleParking),
      tactilePaving:      Boolean(data.tactilePaving),
      audioAssistance:    Boolean(data.audioAssistance),
    },

    notes: (data.notes as string | undefined) || null,

    reporter: {
      name:  (data.reporterName  as string | undefined) || null,
      email: (data.reporterEmail as string | undefined) || null,
    },

    status:     'pending' satisfies ContributionStatus,
    createdAt:  serverTimestamp(),
    reviewedAt: null,
  })

  return { success: true, id: docRef.id }
}
