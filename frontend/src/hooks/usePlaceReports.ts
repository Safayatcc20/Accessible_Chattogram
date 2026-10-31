import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchPendingPlaceReports, fetchReviewedPlaceReports, reviewPlaceReport } from '@/services/api'
import type { PlaceReportChanges } from '@/types'

const PENDING_REPORTS_KEY = ['reports', 'pending'] as const
const REVIEWED_REPORTS_KEY = ['reports', 'reviewed'] as const

function retryUnlessPermissionOrIndexError(failureCount: number, error: unknown) {
  const code = (error as { code?: string })?.code
  if (code === 'permission-denied' || code === 'failed-precondition') return false
  return failureCount < 2
}

export function usePendingPlaceReports() {
  return useQuery({
    queryKey: PENDING_REPORTS_KEY,
    queryFn: fetchPendingPlaceReports,
    retry: retryUnlessPermissionOrIndexError,
  })
}

export function useReviewedPlaceReports() {
  return useQuery({
    queryKey: REVIEWED_REPORTS_KEY,
    queryFn: fetchReviewedPlaceReports,
    retry: retryUnlessPermissionOrIndexError,
  })
}

export function useReviewPlaceReport() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      reportId: string
      placeId: string
      decision: 'approved' | 'rejected'
      reason?: string
      expectedCurrentValues?: PlaceReportChanges
      approvedChanges?: PlaceReportChanges
    }) => reviewPlaceReport(input),
    onSuccess: (_result, input) => {
      void client.invalidateQueries({ queryKey: PENDING_REPORTS_KEY })
      void client.invalidateQueries({ queryKey: REVIEWED_REPORTS_KEY })
      void client.invalidateQueries({ queryKey: ['place', input.placeId] })
      void client.invalidateQueries({ queryKey: ['places'] })
      void client.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}
