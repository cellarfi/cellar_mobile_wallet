import prismaService from '@/service/prismaService'

const prisma = prismaService.prisma

export class BlockModel {
  /**
   * Block a user and remove mutual follows
   */
  static async blockUser(blockerId: string, blockedId: string) {
    // Use a transaction to ensure atomicity
    return prisma.$transaction(async (tx) => {
      // 1. Create the block record
      const block = await tx.block.create({
        data: {
          blocker_id: blockerId,
          blocked_id: blockedId,
        },
      })

      // 2. Remove any existing follow relationships in both directions
      // Remove: blocker following blocked
      await tx.follower.deleteMany({
        where: {
          user_id: blockedId,
          follower_id: blockerId,
        },
      })

      // Remove: blocked following blocker
      await tx.follower.deleteMany({
        where: {
          user_id: blockerId,
          follower_id: blockedId,
        },
      })

      return block
    })
  }

  /**
   * Unblock a user
   */
  static async unblockUser(blockerId: string, blockedId: string) {
    return prisma.block.delete({
      where: {
        blocker_id_blocked_id: {
          blocker_id: blockerId,
          blocked_id: blockedId,
        },
      },
    })
  }

  /**
   * Check if user1 has blocked user2
   */
  static async hasBlocked(
    blockerId: string,
    blockedId: string
  ): Promise<boolean> {
    const block = await prisma.block.findUnique({
      where: {
        blocker_id_blocked_id: {
          blocker_id: blockerId,
          blocked_id: blockedId,
        },
      },
    })
    return !!block
  }

  /**
   * Check if either user has blocked the other (bidirectional check)
   */
  static async isBlocked(userId1: string, userId2: string): Promise<boolean> {
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blocker_id: userId1, blocked_id: userId2 },
          { blocker_id: userId2, blocked_id: userId1 },
        ],
      },
    })
    return !!block
  }

  /**
   * Get block relationship details between two users
   */
  static async getBlockStatus(viewerId: string, targetId: string) {
    const [viewerBlockedTarget, targetBlockedViewer] = await Promise.all([
      prisma.block.findUnique({
        where: {
          blocker_id_blocked_id: {
            blocker_id: viewerId,
            blocked_id: targetId,
          },
        },
      }),
      prisma.block.findUnique({
        where: {
          blocker_id_blocked_id: {
            blocker_id: targetId,
            blocked_id: viewerId,
          },
        },
      }),
    ])

    return {
      is_blocked_by_viewer: !!viewerBlockedTarget,
      has_blocked_viewer: !!targetBlockedViewer,
    }
  }

  /**
   * Get list of users blocked by a specific user
   */
  static async getBlockedUsers(blockerId: string) {
    const blocks = await prisma.block.findMany({
      where: {
        blocker_id: blockerId,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    // Get user details for blocked users
    const blockedUserIds = blocks.map((b) => b.blocked_id)

    const users = await prisma.user.findMany({
      where: {
        id: { in: blockedUserIds },
      },
      select: {
        id: true,
        display_name: true,
        tag_name: true,
        profile_picture_url: true,
      },
    })

    // Merge with block data
    return blocks.map((block) => ({
      ...block,
      blocked_user: users.find((u) => u.id === block.blocked_id),
    }))
  }

  /**
   * Get IDs of users who have blocked this user
   */
  static async getBlockedByIds(userId: string): Promise<string[]> {
    const blocks = await prisma.block.findMany({
      where: {
        blocked_id: userId,
      },
      select: {
        blocker_id: true,
      },
    })
    return blocks.map((b) => b.blocker_id)
  }

  /**
   * Get IDs of users this user has blocked
   */
  static async getBlockedIds(userId: string): Promise<string[]> {
    const blocks = await prisma.block.findMany({
      where: {
        blocker_id: userId,
      },
      select: {
        blocked_id: true,
      },
    })
    return blocks.map((b) => b.blocked_id)
  }

  /**
   * Get all blocked user IDs (both directions) for filtering
   */
  static async getAllBlockedIds(userId: string): Promise<string[]> {
    const blocks = await prisma.block.findMany({
      where: {
        OR: [{ blocker_id: userId }, { blocked_id: userId }],
      },
    })

    const blockedIds = new Set<string>()
    blocks.forEach((block) => {
      if (block.blocker_id === userId) {
        blockedIds.add(block.blocked_id)
      } else {
        blockedIds.add(block.blocker_id)
      }
    })

    return Array.from(blockedIds)
  }
}
