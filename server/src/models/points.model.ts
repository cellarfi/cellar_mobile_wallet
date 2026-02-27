import prismaService from '@/service/prismaService';
import {
  CreatePointDto,
  GetLeaderboardDto,
  GetPointHistoryDto,
  UpdateUserPointDto,
} from '@/utils/dto/points.dto';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = prismaService.prisma;

export class PointsModel {
  /**
   * Create a new point transaction and update user point balance
   * @param dto CreatePointDto with user_id, amount, action, source, and optional metadata
   */
  static async createPoint(dto: CreatePointDto) {
    // Start a transaction to ensure data consistency
    return await prisma.$transaction(async (tx) => {
      // Create the point transaction
      const point = await tx.point.create({
        data: {
          user_id: dto.user_id,
          amount: new Decimal(dto.amount),
          action: dto.action,
          source: dto.source,
          metadata: dto.metadata || {},
        },
      });

      // Get or create user point record
      let userPoint = await tx.userPoint.findUnique({
        where: {
          user_id: dto.user_id,
        },
      });

      const pointAmount = new Decimal(dto.amount);

      // Calculate new balance based on action
      const balanceChange =
        dto.action === 'increment' ? pointAmount : pointAmount.negated();

      // If user point record exists, update it
      if (userPoint) {
        userPoint = await tx.userPoint.update({
          where: {
            user_id: dto.user_id,
          },
          data: {
            balance: {
              increment: balanceChange,
            },
            // Update level based on new balance
            level: this.calculateLevel(userPoint.balance.add(balanceChange)),
          },
        });
      } else {
        // Create new user point record if it doesn't exist
        userPoint = await tx.userPoint.create({
          data: {
            user_id: dto.user_id,
            balance: balanceChange,
            level: this.calculateLevel(balanceChange),
          },
        });
      }

      return { point, userPoint };
    });
  }

  /**
   * Get user point balance and details
   * @param user_id User ID to get points for
   */
  static async getUserPoints(user_id: string) {
    return await prisma.userPoint.findUnique({
      where: {
        user_id,
      },
    });
  }

  /**
   * Update user point details directly (use with caution)
   * @param dto UpdateUserPointDto with user_id and optional balance and level
   */
  static async updateUserPoints(dto: UpdateUserPointDto) {
    const { user_id, ...updateData } = dto;

    // Convert string balance to Decimal if needed
    if (updateData.balance && typeof updateData.balance === 'string') {
      updateData.balance = new Decimal(updateData.balance).toNumber();
    }

    return await prisma.userPoint.upsert({
      where: {
        user_id,
      },
      update: updateData,
      create: {
        user_id,
        balance: updateData.balance
          ? new Decimal(updateData.balance)
          : new Decimal(0),
        level: updateData.level || 1,
      },
    });
  }

  /**
   * Get user point history with optional filters
   * @param dto GetPointHistoryDto with filters
   */
  static async getPointHistory(dto: GetPointHistoryDto) {
    const {
      user_id,
      source,
      start_date,
      end_date,
      limit = 20,
      offset = 0,
    } = dto;

    // Build where clause based on provided filters
    const whereClause: any = {
      user_id,
    };

    if (source) {
      whereClause.source = source;
    }

    // Add date range filter if provided
    if (start_date || end_date) {
      whereClause.created_at = {};

      if (start_date) {
        whereClause.created_at.gte = start_date;
      }

      if (end_date) {
        whereClause.created_at.lte = end_date;
      }
    }

    // Get point history with pagination
    const points = await prisma.point.findMany({
      where: whereClause,
      orderBy: {
        created_at: 'desc',
      },
      skip: offset,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.point.count({
      where: whereClause,
    });

    return {
      points,
      pagination: {
        total: totalCount,
        offset,
        limit,
      },
    };
  }

  /**
   * Calculate level based on point balance
   * This is a utility function that can be used to determine level
   * @param balance Current balance
   * @returns Appropriate level
   */
  static calculateLevel(balance: number | string | Decimal): number {
    // Convert balance to number for comparison
    const balanceNum =
      typeof balance === 'object'
        ? parseFloat(balance.toString())
        : typeof balance === 'string'
        ? parseFloat(balance)
        : balance;

    // Example level calculation logic - can be adjusted based on requirements
    if (balanceNum < 100) return 1;
    if (balanceNum < 500) return 2;
    if (balanceNum < 1000) return 3;
    if (balanceNum < 2500) return 4;
    if (balanceNum < 5000) return 5;
    if (balanceNum < 10000) return 6;
    if (balanceNum < 25000) return 7;
    if (balanceNum < 50000) return 8;
    if (balanceNum < 100000) return 9;
    return 10; // Maximum level
  }

  /**
   * Get leaderboard of top users by points
   * @param dto GetLeaderboardDto with time period and pagination options
   * @returns Array of users with their point balances, sorted by highest points
   */
  static async getLeaderboard(dto: GetLeaderboardDto) {
    const { limit = 10, offset = 0, timeFrame = 'all_time' } = dto;

    // Determine date range based on timeFrame
    let startDate: Date | null = null;
    const now = new Date();

    if (timeFrame === 'weekly') {
      // One week ago
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (timeFrame === 'monthly') {
      // One month ago
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    }

    // For points earned within a specific time period, we'll need to join with points
    // to calculate the sum for the given timeframe
    if (startDate && (timeFrame === 'weekly' || timeFrame === 'monthly')) {
      // Get the sum of points within the time period for each user
      const userPointsInPeriod = await prisma.point.groupBy({
        by: ['user_id'],
        where: {
          created_at: {
            gte: startDate,
          },
          action: 'increment', // Only count increments
        },
        _sum: {
          amount: true,
        },
        orderBy: {
          _sum: {
            amount: 'desc',
          },
        },
        take: Number(limit),
        skip: Number(offset),
      });

      // Get user details for each user_id
      const userIds = userPointsInPeriod.map((entry) => entry.user_id);
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
        select: {
          id: true,
          display_name: true,
          tag_name: true,
          profile_picture_url: true,
        },
      });

      // Get corresponding UserPoint entries for level information
      const userPoints = await prisma.userPoint.findMany({
        where: {
          user_id: {
            in: userIds,
          },
        },
      });

      // Map users with their point sums
      const formattedLeaderboard = userPointsInPeriod.map((entry, index) => {
        const user = users.find((u) => u.id === entry.user_id);
        const userPoint = userPoints.find((up) => up.user_id === entry.user_id);

        return {
          rank: Number(offset) + index + 1,
          user_id: entry.user_id,
          tag_name: user?.tag_name || '',
          display_name: user?.display_name || '',
          profile_picture_url: user?.profile_picture_url || '',
          balance: entry._sum.amount || 0,
          level: userPoint?.level || 1,
        };
      });

      // Get total count for pagination
      const totalCount = await prisma.point
        .groupBy({
          by: ['user_id'],
          where: {
            created_at: {
              gte: startDate,
            },
            action: 'increment',
          },
          _count: true,
        })
        .then((result) => result.length);

      return {
        leaderboard: formattedLeaderboard,
        pagination: {
          total: totalCount,
          offset,
          limit,
        },
        timeFrame,
      };
    }

    // For all-time leaderboard, use the simpler query with UserPoint totals
    const leaderboard = await prisma.userPoint.findMany({
      include: {
        user: {
          select: {
            display_name: true,
            tag_name: true,
            profile_picture_url: true,
          },
        },
      },
      orderBy: {
        balance: 'desc', // Order by highest balance first
      },
      skip: Number(offset),
      take: Number(limit),
    });

    // Get total count for pagination
    const totalCount = await prisma.userPoint.count();

    // Format the results
    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: Number(offset) + index + 1,
      user_id: entry.user_id,
      tag_name: entry.user.tag_name || '',
      display_name: entry.user.display_name || '',
      profile_picture_url: entry.user.profile_picture_url || '',
      balance: entry.balance,
      level: entry.level,
    }));

    return {
      leaderboard: formattedLeaderboard,
      pagination: {
        total: totalCount,
        offset,
        limit,
      },
    };
  }
}
