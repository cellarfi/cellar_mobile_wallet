import {
  LeaderboardFilterOptions,
  LeaderboardResponse,
  PointsHistoryFilterOptions,
  PointsHistoryResponse,
  UserPoint,
} from '@/types';
import { apiResponse, httpRequest } from '../api.helpers';

export const pointsRequests = {
  /**
   * Get the current user's points
   */
  getMyPoints: async () => {
    try {
      const api = httpRequest();
      const response = await api.get('/points/me');
      return apiResponse<UserPoint>(
        true,
        'User points fetched successfully',
        response.data?.data
      );
    } catch (err: any) {
      console.log('Error fetching user points:', err?.response?.data?.data);
      return apiResponse<UserPoint>(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error fetching user points',
        undefined
      );
    }
  },

  /**
   * Get a specific user's points
   * @param userId The ID of the user to get points for
   */
  getUserPoints: async (userId: string) => {
    try {
      const api = httpRequest();
      const response = await api.get(`/points/user/${userId}`);
      return apiResponse<UserPoint>(
        true,
        'User points fetched successfully',
        response.data?.data
      );
    } catch (err: any) {
      console.log('Error fetching user points:', err?.response?.data?.data);
      return apiResponse<UserPoint>(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error fetching user points',
        undefined
      );
    }
  },

  /**
   * Get points history for the current user
   * @param options Filter options for the history
   */
  getPointsHistory: async (options?: PointsHistoryFilterOptions) => {
    try {
      const api = httpRequest();

      // Send parameters in request params as JSON
      const params = new URLSearchParams();
      if (options?.source) params.set('source', options.source);
      if (options?.start_date) params.set('start_date', options.start_date);
      if (options?.end_date) params.set('end_date', options.end_date);
      if (typeof options?.limit === 'number')
        params.set('limit', options.limit.toString());
      if (typeof options?.offset === 'number')
        params.set('offset', options.offset.toString());

      const response = await api.get(`/points/history?${params.toString()}`);
      return apiResponse<PointsHistoryResponse>(
        true,
        'Points history fetched successfully',
        response.data
      );
    } catch (err: any) {
      console.log('Error fetching points history:', err?.response?.data?.data);
      return apiResponse<PointsHistoryResponse>(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error fetching points history',
        undefined
      );
    }
  },

  /**
   * Get the points leaderboard
   * @param options Filter and pagination options for the leaderboard
   */
  getLeaderboard: async (options?: LeaderboardFilterOptions) => {
    try {
      const api = httpRequest();

      const params = new URLSearchParams();
      if (options?.timeFrame) params.set('timeFrame', options.timeFrame);
      if (typeof options?.limit === 'number')
        params.set('limit', options.limit.toString());
      if (typeof options?.offset === 'number')
        params.set('offset', options.offset.toString());

      const response = await api.get(
        `/points/leaderboard?${params.toString()}`
      );
      return apiResponse<LeaderboardResponse>(
        true,
        'Leaderboard fetched successfully',
        response.data?.data
      );
    } catch (err: any) {
      console.log('Error fetching leaderboard:', err?.response?.data?.data);
      return apiResponse<LeaderboardResponse>(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error fetching leaderboard',
        undefined
      );
    }
  },
};
