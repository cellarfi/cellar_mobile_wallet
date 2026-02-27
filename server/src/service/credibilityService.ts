import prismaService from '@/service/prismaService'
import { PostType } from '../../generated/prisma'

const prisma = prismaService.prisma

export interface CredibilityComponents {
  callAccuracy: number
  followerCredibility: number
  engagementQuality: number
  finalScore: number
}

export class CredibilityService {
  /**
   * Compute credibility score components and final score for a single user
   * over a rolling 30-day window (or provided window).
   */
  static async computeUserScore(
    userId: string,
    windowEnd: Date = new Date(),
  ): Promise<CredibilityComponents> {
    const windowStart = new Date(windowEnd.getTime() - 30 * 24 * 60 * 60 * 1000)

    // --- 1. Call accuracy (TOKEN_CALL posts in window) ---
    const tokenCalls = await prisma.post.findMany({
      where: {
        user_id: userId,
        post_type: PostType.TOKEN_CALL,
        created_at: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
      include: {
        token_meta: true,
      },
    })

    // Placeholder implementation: we don't yet pull historical prices here.
    // For now, treat call accuracy as 0 if there are fewer than 3 calls,
    // otherwise 50 as a neutral baseline until price evaluation logic is added.
    let callAccuracy = 0
    if (tokenCalls.length >= 3) {
      callAccuracy = 50
    }

    // --- 2. Follower credibility (uses local follower edges only for now) ---
    const followers = await prisma.follower.findMany({
      where: {
        user_id: userId,
      },
      select: {
        follower_id: true,
      },
    })

    let followerCredibility = 0
    if (followers.length > 0) {
      const followerScores = await prisma.credibilityScore.findMany({
        where: {
          user_id: {
            in: followers.map((f) => f.follower_id),
          },
        },
      })

      const validScores = followerScores
        .map((s) => Number(s.score))
        .filter((v) => !Number.isNaN(v))

      if (validScores.length > 0) {
        const sum = validScores.reduce((acc, v) => acc + v, 0)
        followerCredibility = sum / validScores.length
      }
    }

    // --- 3. Engagement quality (likes + comments from high-credibility users) ---
    const postsInWindow = await prisma.post.findMany({
      where: {
        user_id: userId,
        created_at: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
      select: {
        id: true,
      },
    })

    const postIds = postsInWindow.map((p) => p.id)

    let engagementQuality = 0
    if (postIds.length > 0) {
      const [likes, comments] = await Promise.all([
        prisma.like.findMany({
          where: {
            post_id: { in: postIds },
          },
          select: {
            user_id: true,
          },
        }),
        prisma.comment.findMany({
          where: {
            post_id: { in: postIds },
          },
          select: {
            user_id: true,
          },
        }),
      ])

      const interactionUserIds = [
        ...likes.map((l) => l.user_id),
        ...comments.map((c) => c.user_id),
      ]

      const totalInteractions = interactionUserIds.length

      if (totalInteractions > 0) {
        const uniqueInteractorIds = Array.from(new Set(interactionUserIds))

        const interactorScores = await (prisma as any).credibilityScore.findMany(
          {
            where: {
              user_id: {
                in: uniqueInteractorIds,
              },
            },
          },
        )

        const scoreMap = new Map<string, number>()
        interactorScores.forEach((s) => {
          const value = Number(s.score)
          if (!Number.isNaN(value)) {
            scoreMap.set(s.user_id, value)
          }
        })

        let qualifiedInteractions = 0
        for (const userId of interactionUserIds) {
          const s = scoreMap.get(userId)
          if (s !== undefined && s > 40) {
            qualifiedInteractions += 1
          }
        }

        engagementQuality = (qualifiedInteractions / totalInteractions) * 100
      }
    }

    // --- 4. Combine metrics with weights ---
    const finalScore =
      0.5 * callAccuracy +
      0.3 * followerCredibility +
      0.2 * engagementQuality

    const clampedScore = Math.max(0, Math.min(100, finalScore))

    // Persist latest score (one row per user)
    await (prisma as any).credibilityScore.upsert({
      where: {
        user_id: userId,
      },
      update: {
        score: clampedScore,
        call_accuracy: callAccuracy,
        follower_credibility: followerCredibility,
        engagement_quality: engagementQuality,
        window_start: windowStart,
        window_end: windowEnd,
        computed_at: new Date(),
      },
      create: {
        user_id: userId,
        score: clampedScore,
        call_accuracy: callAccuracy,
        follower_credibility: followerCredibility,
        engagement_quality: engagementQuality,
        window_start: windowStart,
        window_end: windowEnd,
        computed_at: new Date(),
      },
    })

    return {
      callAccuracy,
      followerCredibility,
      engagementQuality,
      finalScore: clampedScore,
    }
  }

  /**
   * Recompute scores for all users that have activity in the last 30 days.
   */
  static async recomputeAll(windowEnd: Date = new Date()): Promise<void> {
    const windowStart = new Date(windowEnd.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Users with posts or comments in the window
    const usersWithActivity = await prisma.user.findMany({
      where: {
        OR: [
          {
            post: {
              some: {
                created_at: {
                  gte: windowStart,
                  lte: windowEnd,
                },
              },
            },
          },
          {
            comments: {
              some: {
                created_at: {
                  gte: windowStart,
                  lte: windowEnd,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    })

    for (const user of usersWithActivity) {
      try {
        await this.computeUserScore(user.id, windowEnd)
      } catch (err) {
        console.error(
          '[CredibilityService.recomputeAll] Error computing score for user',
          user.id,
          err,
        )
      }
    }
  }
}

