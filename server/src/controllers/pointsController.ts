import { PointsModel } from '@/models/points.model';
import {
  GetLeaderboardDto,
  getLeaderboardDtoSchema,
  GetPointHistoryDto,
  getPointHistoryDtoSchema,
} from '@/utils/dto/points.dto';
import { Request, Response } from 'express';

/**
 * Get user points leaderboard
 * Returns a paginated list of top users by points
 */
export const getLeaderboard = async (
  req: Request<{}, {}, {}, GetLeaderboardDto>,
  res: Response
): Promise<void> => {
  try {
    // Parse and validate query parameters
    const { success, data, error } = getLeaderboardDtoSchema.safeParse(
      req.query
    );

    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    // Get leaderboard data from the model
    const leaderboardData = await PointsModel.getLeaderboard(data);

    res.status(200).json({
      success: true,
      data: leaderboardData,
    });
  } catch (error) {
    console.error('[getLeaderboard] Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard data',
    });
  }
};

/**
 * Get point balance and details for a user
 */
export const getUserPoints = async (
  req: Request<{ user_id?: string }, {}, {}, {}>,
  res: Response
): Promise<void> => {
  try {
    // Use the requested user_id if provided, otherwise use the authenticated user's ID
    const user_id = req.params.user_id || req.user?.id;

    if (!user_id) {
      res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
      return;
    }

    const userPoints = await PointsModel.getUserPoints(user_id);

    if (!userPoints) {
      // Return default values if no user points record exists yet
      res.json({
        success: true,
        data: {
          user_id,
          balance: 0,
          level: 1,
          created_at: null,
          updated_at: null,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: userPoints,
    });
  } catch (err: any) {
    console.error('[getUserPoints] Error:', err);
    res.status(500).json({
      success: false,
      error: 'An error occurred retrieving user points',
    });
  }
};

/**
 * Get point history for a user with filters
 */
export const getPointHistory = async (
  req: Request<
    {},
    {},
    {},
    {
      source?: string;
      start_date?: string;
      end_date?: string;
      limit?: string;
      offset?: string;
    }
  >,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
      return;
    }

    // Build request data from params and query
    const queryData: GetPointHistoryDto = {
      user_id,
      source: req.query.source as string | undefined,
      start_date: req.query.start_date
        ? new Date(req.query.start_date as string)
        : undefined,
      end_date: req.query.end_date
        ? new Date(req.query.end_date as string)
        : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      offset: req.query.offset ? Number(req.query.offset) : 0,
    };

    const { success, data, error } =
      await getPointHistoryDtoSchema.safeParseAsync(queryData);
    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    const history = await PointsModel.getPointHistory(data);

    res.json({
      success: true,
      data: history.points,
      pagination: history.pagination,
    });
  } catch (err: any) {
    console.error('[getPointHistory] Error:', err);
    res.status(500).json({
      success: false,
      error: 'An error occurred retrieving point history',
    });
  }
};
