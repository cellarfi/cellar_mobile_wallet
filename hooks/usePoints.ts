import { pointsRequests } from '@/libs/api_requests/points.request';
import { usePointsStore } from '@/store/pointsStore';
import {
  LeaderboardFilterOptions,
  LeaderboardResponse,
  PointsHistoryFilterOptions,
  PointsHistoryResponse,
  UserPoint,
} from '@/types';
import { useQuery } from '@tanstack/react-query';

export function usePoints() {
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
  } = usePointsStore();

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
      const response = await pointsRequests.getMyPoints();

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch user points');
      }

      // Update the store with the fetched data
      setUserPoints(response.data);
      return response.data;
    },
    staleTime: 60 * 1000, // 60 seconds
    refetchIntervalInBackground: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Function to fetch points history
  const fetchPointsHistory = async (
    options?: PointsHistoryFilterOptions
  ): Promise<PointsHistoryResponse> => {
    try {
      const response = await pointsRequests.getPointsHistory(options);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch points history');
      }

      setPointsHistory(response.data);
      return response.data;
    } catch (error: any) {
      setError(error.message || 'Failed to fetch points history');
      throw error;
    }
  };

  // Function to fetch leaderboard
  const fetchLeaderboard = async (
    options?: LeaderboardFilterOptions
  ): Promise<LeaderboardResponse> => {
    try {
      const response = await pointsRequests.getLeaderboard(options);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch leaderboard');
      }

      setLeaderboard(response.data);
      return response.data;
    } catch (error: any) {
      setError(error.message || 'Failed to fetch leaderboard');
      throw error;
    }
  };

  // Handle errors
  const errorMessage = pointsError?.message || storeError;

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
  };
}
