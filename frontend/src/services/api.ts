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
  orderBy,
  query,
  where,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
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
export async function searchPlaces(query: string): Promise<SearchResult> {
  const q = query.toLowerCase().trim()
  if (!q) return { places: [], query, total: 0 }

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

  return { places, query, total: places.length }
}

// GET /api/stats — Phase 10: calculated from Firestore places collection
export async function fetchStats(): Promise<Stats> {
  const snap = await getDocs(collection(db, 'places'))

  let verifiedPlaces = 0
  let totalReports   = 0
  const areas        = new Set<string>()

  for (const d of snap.docs) {
    const data = d.data() as FirestorePlace
    if (data.verification.status === 'verified') verifiedPlaces++
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

// POST /api/places/:id/verify — mock stub
export async function verifyPlace(placeId: string): Promise<{ success: boolean }> {
  console.log('[MOCK] Verify place:', placeId)
  return { success: true }
}

// POST /api/reports — mock stub
export async function submitReport(
  data: Record<string, unknown>
): Promise<{ success: boolean; id: string }> {
  console.log('[MOCK] Submit report:', data)
  return { success: true, id: `report-${Date.now()}` }
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