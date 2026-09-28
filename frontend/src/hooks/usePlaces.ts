import { useQuery } from '@tanstack/react-query'
import type { FilterState } from '@/types'
import { fetchPlaces, fetchPlace, fetchStats } from '@/services/api'

// Fix 14: removed useSearch (was unused — local text search handles this in Explore.tsx)

export function usePlaces(filters?: Partial<FilterState>) {
  return useQuery({
    queryKey: ['places', filters],
    queryFn: () => fetchPlaces(filters),
  })
}

export function usePlace(id: string) {
  return useQuery({
    queryKey: ['place', id],
    queryFn: () => fetchPlace(id),
    enabled: Boolean(id),
  })
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  })
}