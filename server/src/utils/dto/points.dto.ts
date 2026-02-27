import { z } from 'zod';

// DTO for creating a new point transaction
export const createPointDtoSchema = z.object({
  user_id: z.string(),
  amount: z.number().or(z.string()),
  action: z.enum(['increment', 'decrement']).default('increment'),
  source: z.string(),
  metadata: z.record(z.any()).optional(),
});

export type CreatePointDto = z.infer<typeof createPointDtoSchema>;

// DTO for getting leaderboard data
export const getLeaderboardDtoSchema = z
  .object({
    limit: z.string().optional(),
    offset: z.string().optional(),
    timeFrame: z
      .enum(['all_time', 'weekly', 'monthly'])
      .optional()
      .default('all_time'),
  })
  .refine(
    (data) => {
      const limit = Number(data.limit);
      const offset = Number(data.offset);
      return !isNaN(limit) && !isNaN(offset);
    },
    { message: 'Invalid limit or offset' }
  );

export type GetLeaderboardDto = z.infer<typeof getLeaderboardDtoSchema>;

// DTO for updating a user's point balance
export const updateUserPointDtoSchema = z.object({
  user_id: z.string(),
  balance: z.number().or(z.string()).optional(),
  level: z.number().optional(),
});

export type UpdateUserPointDto = z.infer<typeof updateUserPointDtoSchema>;

// DTO for getting a user's point history with filters
export const getPointHistoryDtoSchema = z.object({
  user_id: z.string(),
  source: z.string().optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export type GetPointHistoryDto = z.infer<typeof getPointHistoryDtoSchema>;
