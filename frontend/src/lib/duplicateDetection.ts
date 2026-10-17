/**
 * duplicateDetection.ts — Phase 16.1
 *
 * Pure functions for detecting potentially duplicate places.
 * No Firebase dependency — takes already-loaded Place[] arrays so callers
 * can use cached TanStack Query data without an extra Firestore round-trip.
 *
 * Matching criteria (any one is sufficient to flag a candidate):
 *   1. Normalized name match  — case-insensitive, trimmed, collapsed whitespace.
 *   2. Geographic proximity   — Haversine distance ≤ DISTANCE_THRESHOLD_METRES.
 *
 * Distance threshold: 100 metres.
 *   Chattogram is a dense urban area. 100 m captures the same building / entrance
 *   without flagging neighbouring blocks. References: OSM and Google Places use
 *   50–100 m for same-venue deduplication in high-density cities.
 */

import type { Place } from '@/types'

// ─── Configuration ────────────────────────────────────────────────────────────

export const DISTANCE_THRESHOLD_METRES = 100

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DuplicateCandidate {
  place:          Place
  /** Matched because names are the same after normalization. */
  nameMatch:      boolean
  /** Matched because coordinates are within DISTANCE_THRESHOLD_METRES. */
  proximityMatch: boolean
  /** Haversine distance in metres, or null if either coordinate set is missing. */
  distanceMetres: number | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalise a place name for comparison:
 *   - trim leading/trailing whitespace
 *   - collapse internal whitespace runs to a single space
 *   - lowercase
 */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

/**
 * Haversine formula — great-circle distance between two lat/lng points.
 * Returns distance in metres.
 *
 * Both inputs must be finite numbers; callers are responsible for validation.
 */
export function haversineMetres(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R   = 6_371_000              // Earth radius in metres
  const φ1  = (lat1 * Math.PI) / 180
  const φ2  = (lat2 * Math.PI) / 180
  const Δφ  = ((lat2 - lat1) * Math.PI) / 180
  const Δλ  = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Find existing places that might be a duplicate of the incoming contribution.
 *
 * @param contributionName  The name field from the pending Contribution.
 * @param lat               Latitude the admin entered, or undefined if not yet provided.
 * @param lng               Longitude the admin entered, or undefined if not yet provided.
 * @param existingPlaces    The full places array from TanStack Query cache.
 * @param threshold         Distance threshold in metres (defaults to DISTANCE_THRESHOLD_METRES).
 * @returns                 Array of DuplicateCandidate, sorted by distance ascending
 *                          (proximity matches first, then name-only matches).
 */
export function findDuplicateCandidates(
  contributionName: string,
  lat:              number | undefined,
  lng:              number | undefined,
  existingPlaces:   Place[],
  threshold:        number = DISTANCE_THRESHOLD_METRES,
): DuplicateCandidate[] {
  const normContrib = normalizeName(contributionName)

  const hasCoords =
    lat !== undefined &&
    lng !== undefined &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)

  const candidates: DuplicateCandidate[] = []

  for (const place of existingPlaces) {
    const nameMatch = normalizeName(place.name) === normContrib

    let proximityMatch = false
    let distanceMetres: number | null = null

    if (
      hasCoords &&
      Number.isFinite(place.latitude) &&
      Number.isFinite(place.longitude)
    ) {
      distanceMetres = haversineMetres(lat!, lng!, place.latitude, place.longitude)
      proximityMatch = distanceMetres <= threshold
    }

    if (nameMatch || proximityMatch) {
      candidates.push({ place, nameMatch, proximityMatch, distanceMetres })
    }
  }

  // Sort: proximity matches (with distance) first, ascending by distance;
  // name-only matches after, alphabetical by place name.
  candidates.sort((a, b) => {
    if (a.distanceMetres !== null && b.distanceMetres !== null) {
      return a.distanceMetres - b.distanceMetres
    }
    if (a.distanceMetres !== null) return -1
    if (b.distanceMetres !== null) return 1
    return a.place.name.localeCompare(b.place.name)
  })

  return candidates
}