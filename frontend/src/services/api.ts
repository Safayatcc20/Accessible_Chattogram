/**
 * API service layer.
 * Currently uses mock data. Replace mock implementations with real fetch() calls
 * to the FastAPI backend when it's available. The function signatures stay the same.
 */

import type { Place, FilterState, SearchResult, Stats, PlaceCategory } from '@/types'
import { MOCK_PLACES, MOCK_STATS } from '@/data/mockPlaces'

const SIMULATED_DELAY = 400 // ms

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// GET /api/places
export async function fetchPlaces(filters?: Partial<FilterState>): Promise<Place[]> {
  await delay(SIMULATED_DELAY)
  let places = [...MOCK_PLACES]

  if (filters) {
    if (filters.categories && filters.categories.length > 0) {
      places = places.filter(p => filters.categories!.includes(p.category as PlaceCategory))
    }
    if (filters.verificationStatus && filters.verificationStatus.length > 0) {
      places = places.filter(p => filters.verificationStatus!.includes(p.verification.status))
    }
    if (filters.accessibilityFeatures && filters.accessibilityFeatures.length > 0) {
      places = places.filter(p =>
        filters.accessibilityFeatures!.every(
          feat => p.accessibility[feat as keyof typeof p.accessibility] === true
        )
      )
    }
    if (filters.openNow) {
      places = places.filter(p => p.isOpenNow)
    }
    if (filters.hasContact) {
      places = places.filter(p => p.phone || p.website)
    }
    if (filters.recentlyVerified) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      places = places.filter(p => {
        if (!p.verification.lastVerified) return false
        return new Date(p.verification.lastVerified) >= thirtyDaysAgo
      })
    }
  }

  return places
}

// GET /api/places/:id
export async function fetchPlace(id: string): Promise<Place | null> {
  await delay(SIMULATED_DELAY)
  return MOCK_PLACES.find(p => p.id === id) ?? null
}

// GET /api/places/search
export async function searchPlaces(query: string): Promise<SearchResult> {
  await delay(SIMULATED_DELAY)
  const q = query.toLowerCase().trim()
  if (!q) return { places: [], query, total: 0 }

  const places = MOCK_PLACES.filter(p => {
    return (
      p.name.toLowerCase().includes(q) ||
      p.area.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.description?.toLowerCase().includes(q) ?? false)
    )
  })

  return { places, query, total: places.length }
}

// GET /api/stats
export async function fetchStats(): Promise<Stats> {
  await delay(300)
  return MOCK_STATS
}

// POST /api/places/:id/verify
export async function verifyPlace(placeId: string): Promise<{ success: boolean }> {
  await delay(600)
  console.log('[MOCK] Verify place:', placeId)
  return { success: true }
}

// POST /api/reports
export async function submitReport(data: Record<string, unknown>): Promise<{ success: boolean; id: string }> {
  await delay(800)
  console.log('[MOCK] Submit report:', data)
  return { success: true, id: `report-${Date.now()}` }
}

// POST /api/places
export async function submitPlace(data: Record<string, unknown>): Promise<{ success: boolean; id: string }> {
  await delay(800)
  console.log('[MOCK] Submit place:', data)
  return { success: true, id: `place-${Date.now()}` }
}
