import { useQuery } from '@tanstack/react-query'
import type { FilterState } from '@/types'
import { fetchPlaces, fetchPlace, searchPlaces, fetchStats } from '@/services/api'

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

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => searchPlaces(query),
    enabled: query.length > 1,
  })
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  })
}
