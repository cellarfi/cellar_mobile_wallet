import prismaService from '@/service/prismaService'

const prisma = prismaService.prisma

export class MentionModel {
  /**
   * Create mentions for a post
   * @param postId - The post ID
   * @param mentions - Array of objects with user_id and tag_name
   */
  static async createMentions(
    postId: string,
    mentions: Array<{ user_id: string; tag_name: string }>
  ) {
    if (mentions.length === 0) {
      return []
    }

    // Use createMany with skipDuplicates to handle duplicate mentions gracefully
    try {
      await prisma.mention.createMany({
        data: mentions.map((mention) => ({
          post_id: postId,
          user_id: mention.user_id,
          tag_name: mention.tag_name,
        })),
        skipDuplicates: true,
      })

      // Return the created mentions
      return await prisma.mention.findMany({
        where: {
          post_id: postId,
        },
        include: {
          user: {
            select: {
              id: true,
              tag_name: true,
              display_name: true,
              profile_picture_url: true,
            },
          },
        },
      })
    } catch (error) {
      console.error('[MentionModel] Error creating mentions:', error)
      throw error
    }
  }

  /**
   * Delete all mentions for a post
   * @param postId - The post ID
   */
  static async deleteMentionsByPostId(postId: string) {
    return await prisma.mention.deleteMany({
      where: {
        post_id: postId,
      },
    })
  }

  /**
   * Get all mentions for a post
   * @param postId - The post ID
   */
  static async getMentionsByPostId(postId: string) {
    return await prisma.mention.findMany({
      where: {
        post_id: postId,
      },
      include: {
        user: {
          select: {
            id: true,
            tag_name: true,
            display_name: true,
            profile_picture_url: true,
          },
        },
      },
    })
  }

  /**
   * Get all posts where a user is mentioned
   * @param userId - The user ID
   * @param skip - Number of records to skip
   * @param take - Number of records to take
   */
  static async getPostsMentioningUser(
    userId: string,
    skip: number = 0,
    take: number = 10
  ) {
    return await prisma.mention.findMany({
      where: {
        user_id: userId,
      },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                tag_name: true,
                display_name: true,
                profile_picture_url: true,
              },
            },
            _count: {
              select: {
                like: true,
                comment: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      skip,
      take,
    })
  }
}
