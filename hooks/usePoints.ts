import { pointsRequests } from '@/libs/api_requests/points.request'
import { useNetworkStore } from '@/store/networkStore'
import { usePointsStore } from '@/store/pointsStore'
import {
  LeaderboardFilterOptions,
  LeaderboardResponse,
  PointsHistoryFilterOptions,
  PointsHistoryResponse,
  UserPoint,
} from '@/types'
import { useQuery } from '@tanstack/react-query'

export function usePoints() {
  const { isOnline } = useNetworkStore()
  const {
    userPoints,
    pointsHistory,
    leaderboard,
    isLoading: storeLoading,
    error: storeError,
    setUserPoints,
    setPointsHistory,
    setLeaderboard,
    setError,
  } = usePointsStore()

  // Fetch user points
  const {
    data: pointsData,
    error: pointsError,
    isLoading: pointsLoading,
    refetch: refetchPoints,
    isRefetching: isRefetchingPoints,
  } = useQuery({
    queryKey: ['userPoints'],
    queryFn: async (): Promise<UserPoint> => {
      // Check if offline before making request
      if (isOnline === false) {
        throw new Error('Device is offline - using cached data')
      }

      const response = await pointsRequests.getMyPoints()

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch user points')
      }

      // Update the store with the fetched data
      setUserPoints(response.data)
      return response.data
    },
    enabled: isOnline !== false, // Only enable when online
    staleTime: isOnline === false ? Infinity : 60 * 1000, // Never stale when offline
    gcTime: 10 * 60 * 1000, // Keep cached data for 10 minutes
    retry: (failureCount, error) => {
      if (isOnline === false) return false
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: isOnline === true,
    refetchOnReconnect: isOnline === true,
    refetchIntervalInBackground: false,
  })

  // Function to fetch points history
  const fetchPointsHistory = async (
    options?: PointsHistoryFilterOptions
  ): Promise<PointsHistoryResponse> => {
    try {
      const response = await pointsRequests.getPointsHistory(options)

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch points history')
      }

      setPointsHistory(response.data)
      return response.data
    } catch (error: any) {
      setError(error.message || 'Failed to fetch points history')
      throw error
    }
  }

  // Function to fetch leaderboard
  const fetchLeaderboard = async (
    options?: LeaderboardFilterOptions
  ): Promise<LeaderboardResponse> => {
    try {
      const response = await pointsRequests.getLeaderboard(options)

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch leaderboard')
      }

      setLeaderboard(response.data)
      return response.data
    } catch (error: any) {
      setError(error.message || 'Failed to fetch leaderboard')
      throw error
    }
  }

  // Handle errors
  const errorMessage = pointsError?.message || storeError

  return {
    // State
    userPoints: pointsData || userPoints,
    pointsHistory: pointsHistory,
    leaderboard: leaderboard,
    isLoading: pointsLoading || storeLoading,
    isRefetchingPoints,
    error: errorMessage,

    // Actions
    refetchPoints,
    fetchPointsHistory,
    fetchLeaderboard,
  }
}
