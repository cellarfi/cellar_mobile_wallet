/**
 * Points interfaces for the User Points Display & Leaderboard features
 */

/**
 * User Point Balance
 */
export interface UserPoint {
  id?: string;
  user_id: string;
  balance: number;
  level: number;
  created_at: string;
  updated_at: string;
}

/**
 * Point Transaction
 */
export interface PointTransaction {
  id: string;
  user_id: string;
  amount: number;
  action: 'increment' | 'decrement';
  source: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Points History Response
 */
export interface PointsHistoryResponse {
  data: PointTransaction[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
  };
}

/**
 * Leaderboard Entry
 */
export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  tag_name: string;
  display_name: string;
  profile_picture_url: string | null;
  balance: number;
  level: number;
}

/**
 * Leaderboard Time Frame
 */
export type LeaderboardTimeFrame = 'all_time' | 'weekly' | 'monthly';

/**
 * Leaderboard Response
 */
export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
  };
  timeFrame: LeaderboardTimeFrame;
}

/**
 * Leaderboard Filter Options
 */
export interface LeaderboardFilterOptions {
  timeFrame: LeaderboardTimeFrame;
  limit?: number;
  offset?: number;
}

/**
 * Points History Filter Options
 */
export interface PointsHistoryFilterOptions {
  source?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}
