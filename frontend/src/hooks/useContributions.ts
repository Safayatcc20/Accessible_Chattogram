// /**
//  * useContributions
//  *
//  * TanStack Query hooks for fetching and moderating pending contributions.
//  * Follows the same patterns as usePlaces / useStats.
//  * Only callable by an authenticated admin — the Firestore rule enforces this
//  * server-side; a non-admin user would receive a permission-denied error which
//  * TanStack Query surfaces as isError.
//  */

// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
// import {
//   approveContribution,
//   fetchPendingContributions,
//   rejectContribution,
// } from '@/services/api'
// import { toast } from '@/hooks/use-toast'

// // ─── Query key ───────────────────────────────────────────────────────────────

// const PENDING_QUERY_KEY = ['contributions', 'pending'] as const

// // ─── Fetch hook ───────────────────────────────────────────────────────────────

// export function usePendingContributions() {
//   return useQuery({
//     queryKey: PENDING_QUERY_KEY,
//     queryFn:  fetchPendingContributions,
//     // Do not retry on permission-denied — it will never succeed for non-admins.
//     // Also skip retry on failed-precondition (missing index) — user action needed.
//     retry: (failureCount, error: unknown) => {
//       const code = (error as { code?: string }).code
//       if (code === 'permission-denied')    return false
//       if (code === 'failed-precondition') return false
//       return failureCount < 2
//     },
//   })
// }

// // ─── Approve mutation ─────────────────────────────────────────────────────────

// interface ApproveVariables {
//   contributionId: string
//   latitude:       number
//   longitude:      number
// }

// export function useApproveContribution() {
//   const queryClient = useQueryClient()

//   return useMutation({
//     mutationFn: ({ contributionId, latitude, longitude }: ApproveVariables) =>
//       approveContribution(contributionId, latitude, longitude),

//     onSuccess: () => {
//       // Remove approved contribution from the cached list immediately
//       void queryClient.invalidateQueries({ queryKey: PENDING_QUERY_KEY })
//     },

//     onError: (err: unknown) => {
//       // Surface a persistent toast so the error is visible even if the dialog
//       // is dismissed before the admin reads the inline error message.
//       const msg = (err as Error)?.message ?? ''
//       const description =
//         msg === 'contribution-already-reviewed'
//           ? 'This contribution was already approved or rejected.'
//           : msg === 'contribution-not-found'
//           ? 'This contribution no longer exists.'
//           : 'Approval failed. Check the browser console for details.'
//       toast({ title: 'Approval failed', description, variant: 'destructive' })
//     },
//   })
// }

// // ─── Reject mutation ──────────────────────────────────────────────────────────

// interface RejectVariables {
//   contributionId: string
// }

// export function useRejectContribution() {
//   const queryClient = useQueryClient()

//   return useMutation({
//     mutationFn: ({ contributionId }: RejectVariables) =>
//       rejectContribution(contributionId),

//     onSuccess: () => {
//       // Remove rejected contribution from the cached list immediately
//       void queryClient.invalidateQueries({ queryKey: PENDING_QUERY_KEY })
//     },

//     onError: (err: unknown) => {
//       // Surface a persistent toast so the error is visible even if the dialog
//       // is dismissed before the admin reads the inline error message.
//       const msg = (err as Error)?.message ?? ''
//       const description =
//         msg === 'contribution-already-reviewed'
//           ? 'This contribution was already approved or rejected.'
//           : msg === 'contribution-not-found'
//           ? 'This contribution no longer exists.'
//           : 'Rejection failed. Check the browser console for details.'
//       toast({ title: 'Rejection failed', description, variant: 'destructive' })
//     },
//   })
// }

/**
 * useContributions
 *
 * TanStack Query hooks for fetching and moderating pending contributions.
 * Follows the same patterns as usePlaces / useStats.
 * Only callable by an authenticated admin — the Firestore rule enforces this
 * server-side; a non-admin user would receive a permission-denied error which
 * TanStack Query surfaces as isError.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveContribution,
  fetchPendingContributions,
  fetchPlaces,
  rejectContribution,
} from '@/services/api'
import { toast } from '@/hooks/use-toast'

// ─── Query keys ──────────────────────────────────────────────────────────────

const PENDING_QUERY_KEY = ['contributions', 'pending'] as const

// Separate key so the admin duplicate-check load doesn't pollute the public
// explore-page places cache (different staleTime requirements).
const ADMIN_PLACES_KEY = ['admin', 'places'] as const

// ─── Places loader for duplicate detection ────────────────────────────────────

/**
 * Load all published places for the admin dashboard duplicate-detection check.
 * Uses a distinct query key from the public usePlaces() hook so cache
 * invalidation on approval doesn't disrupt the explore page mid-session.
 *
 * staleTime: 2 minutes — places don't change often during a review session,
 * and a fresh fetch runs automatically if the admin leaves and returns.
 */
export function usePlacesForDuplicateCheck() {
  return useQuery({
    queryKey:  ADMIN_PLACES_KEY,
    queryFn:   () => fetchPlaces(),
    staleTime: 2 * 60 * 1000,
  })
}

// ─── Fetch hook ───────────────────────────────────────────────────────────────

export function usePendingContributions() {
  return useQuery({
    queryKey: PENDING_QUERY_KEY,
    queryFn:  fetchPendingContributions,
    // Do not retry on permission-denied — it will never succeed for non-admins.
    // Also skip retry on failed-precondition (missing index) — user action needed.
    retry: (failureCount, error: unknown) => {
      const code = (error as { code?: string }).code
      if (code === 'permission-denied')    return false
      if (code === 'failed-precondition') return false
      return failureCount < 2
    },
  })
}

// ─── Approve mutation ─────────────────────────────────────────────────────────

interface ApproveVariables {
  contributionId: string
  latitude:       number
  longitude:      number
}

export function useApproveContribution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ contributionId, latitude, longitude }: ApproveVariables) =>
      approveContribution(contributionId, latitude, longitude),

    onSuccess: () => {
      // Remove approved contribution from the cached list immediately
      void queryClient.invalidateQueries({ queryKey: PENDING_QUERY_KEY })
    },

    onError: (err: unknown) => {
      // Surface a persistent toast so the error is visible even if the dialog
      // is dismissed before the admin reads the inline error message.
      const msg = (err as Error)?.message ?? ''
      const description =
        msg === 'contribution-already-reviewed'
          ? 'This contribution was already approved or rejected.'
          : msg === 'contribution-not-found'
          ? 'This contribution no longer exists.'
          : 'Approval failed. Check the browser console for details.'
      toast({ title: 'Approval failed', description, variant: 'destructive' })
    },
  })
}

// ─── Reject mutation ──────────────────────────────────────────────────────────

interface RejectVariables {
  contributionId: string
}

export function useRejectContribution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ contributionId }: RejectVariables) =>
      rejectContribution(contributionId),

    onSuccess: () => {
      // Remove rejected contribution from the cached list immediately
      void queryClient.invalidateQueries({ queryKey: PENDING_QUERY_KEY })
    },

    onError: (err: unknown) => {
      // Surface a persistent toast so the error is visible even if the dialog
      // is dismissed before the admin reads the inline error message.
      const msg = (err as Error)?.message ?? ''
      const description =
        msg === 'contribution-already-reviewed'
          ? 'This contribution was already approved or rejected.'
          : msg === 'contribution-not-found'
          ? 'This contribution no longer exists.'
          : 'Rejection failed. Check the browser console for details.'
      toast({ title: 'Rejection failed', description, variant: 'destructive' })
    },
  })
}