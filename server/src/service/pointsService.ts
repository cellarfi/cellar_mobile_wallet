import { PointsModel } from '@/models/points.model'
import { CreatePointDto } from '@/utils/dto/points.dto'

/**
 * Point reward values for different activities
 * These can be easily adjusted as needed
 */
export const POINT_VALUES = {
  // Social engagement
  POST_CREATION: 10,
  POST_LIKE: 2,
  POST_COMMENT: 5,
  USER_FOLLOW: 2,

  // Financial activities
  TOKEN_SWAP: 15,
  TOKEN_SEND: 10,
  TOKEN_LAUNCH: 50,
  DONATION: 20,

  // Daily engagement
  DAILY_LOGIN: 5,
  PROFILE_COMPLETION: 25,

  // Referrals
  REFERRAL_SIGNUP: 100,
}

/**
 * Service for awarding points for various user activities
 */
export class PointsService {
  /**
   * Award points for an activity
   * @param userId User ID to award points to
   * @param activity Activity type from POINT_VALUES
   * @param metadata Optional metadata to store with the point transaction
   * @returns The created point and updated user point balance
   */
  static async awardPoints(
    userId: string,
    activity: keyof typeof POINT_VALUES,
    metadata: Record<string, any> = {}
  ) {
    try {
      if (!userId) {
        console.error(
          '[PointsService] Cannot award points: No user ID provided'
        )
        return null
      }

      // Get point value for the activity
      const pointValue = POINT_VALUES[activity]

      if (pointValue === undefined) {
        console.error(`[PointsService] Unknown activity type: ${activity}`)
        return null
      }

      // Create point transaction
      const pointData: CreatePointDto = {
        user_id: userId,
        amount: pointValue,
        source: activity,
        metadata,
        action: 'increment', // Default is increment, but can be specified differently if needed
      }

      // Award the points using our existing model
      const result = await PointsModel.createPoint(pointData)

      // Log for monitoring purposes
      console.log(
        `[PointsService] Awarded ${pointValue} points to user ${userId} for ${activity}`
      )

      return result
    } catch (error) {
      console.error(
        `[PointsService] Error awarding points for ${activity}:`,
        error
      )
      // Return null but don't throw - we don't want points errors to break the main functionality
      return null
    }
  }
}
