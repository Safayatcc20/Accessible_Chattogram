/**
 * useContributions
 *
 * TanStack Query hook for fetching pending contributions.
 * Follows the same pattern as usePlaces / useStats.
 * Only callable by an authenticated admin — the Firestore rule enforces this
 * server-side; a non-admin user would receive a permission-denied error which
 * TanStack Query surfaces as isError.
 */

import { useQuery } from '@tanstack/react-query'
import { fetchPendingContributions } from '@/services/api'

export function usePendingContributions() {
  return useQuery({
    queryKey: ['contributions', 'pending'],
    queryFn:  fetchPendingContributions,
    // Do not retry on permission-denied — it will never succeed for non-admins
    retry: (failureCount, error: unknown) => {
      const code = (error as { code?: string }).code
      if (code === 'permission-denied') return false
      return failureCount < 2
    },
  })
}