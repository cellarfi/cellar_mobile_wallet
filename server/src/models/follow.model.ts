import prismaService from '@/service/prismaService'

const prisma = prismaService.prisma

export class FollowModel {
  static async followUser(follower_id: string, user_id: string) {
    // First check if the user exists
    const user = await prisma.user.findUnique({
      where: {
        id: user_id,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Check if the follow relationship already exists
    const existingFollow = await prisma.follower.findFirst({
      where: {
        user_id: user_id,
        follower_id: follower_id,
      },
    })

    if (existingFollow) {
      // If it exists, unfollow by deleting the relationship
      await prisma.follower.delete({
        where: {
          id: existingFollow.id,
        },
      })
      return { action: 'unfollowed' }
    } else {
      // If it doesn't exist, create the follow relationship
      await prisma.follower.create({
        data: {
          user_id: user_id,
          follower_id: follower_id,
        },
      })
      return { action: 'followed' }
    }
  }

  static async getFollowingPosts(user_id: string, take: number, skip: number) {
    // Get the list of users the current user is following
    const following = await prisma.follower.findMany({
      where: {
        follower_id: user_id,
      },
      select: {
        user_id: true,
      },
    })

    // Extract the user IDs of the followed users
    const following_ids = following.map((f) => f.user_id)

    // Get posts from followed users, ordered by most recent
    const posts = await prisma.post.findMany({
      where: {
        user_id: {
          // Fixed: use userId instead of ownerId
          in: following_ids,
        },
      },
      include: {
        comment: true,
        _count: { select: { comment: true, like: true } },
        user: {
          select: {
            id: true,
            tag_name: true,
            display_name: true,
            profile_picture_url: true,
            wallets: { select: { address: true } },
          },
        },
        funding_meta: {
          select: {
            target_amount: true,
            current_amount: true,
            wallet_address: true,
            chain_type: true,
            token_symbol: true,
            token_address: true,
            deadline: true,
            status: true,
          },
        },
        token_meta: {
          select: {
            token_name: true,
            token_symbol: true,
            token_address: true,
            chain_type: true,
            logo_url: true,
            launch_date: true,
            price: true,
            target_price: true,
            market_cap: true,
            description: true,
          },
        },
      },
      take,
      skip,
      orderBy: {
        created_at: 'desc',
      },
    })

    return posts
  }

  static async getFollowingPostsCount(user_id: string) {
    // Get the list of users the current user is following
    const following = await prisma.follower.findMany({
      where: {
        follower_id: user_id,
      },
      select: {
        user_id: true,
      },
    })

    // Extract the user IDs of the followed users
    const following_ids = following.map((f) => f.user_id)

    // Get posts from followed users, ordered by most recent
    const posts = await prisma.post.findMany({
      where: {
        user_id: {
          // Fixed: use userId instead of ownerId
          in: following_ids,
        },
      },
      include: {
        comment: true,
        _count: { select: { comment: true, like: true } },
        user: {
          select: {
            id: true,
            tag_name: true,
            display_name: true,
            profile_picture_url: true,
            wallets: { select: { address: true } },
          },
        },
        funding_meta: {
          select: {
            target_amount: true,
            current_amount: true,
            wallet_address: true,
            chain_type: true,
            token_symbol: true,
            token_address: true,
            deadline: true,
            status: true,
          },
        },
        token_meta: {
          select: {
            token_name: true,
            token_symbol: true,
            token_address: true,
            chain_type: true,
            logo_url: true,
            launch_date: true,
            price: true,
            target_price: true,
            market_cap: true,
            description: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    return posts.length
  }

  static async getFollowers(user_id: string) {
    return prisma.follower.findMany({
      where: {
        user_id: user_id,
      },
      include: {
        user: {
          select: {
            id: true,
            display_name: true,
            tag_name: true,
            profile_picture_url: true,
          },
        },
      },
    })
  }

  static async getFollowing(user_id: string) {
    return prisma.follower.findMany({
      where: {
        follower_id: user_id,
      },
      include: {
        user: {
          select: {
            id: true,
            display_name: true,
            tag_name: true,
            profile_picture_url: true,
          },
        },
      },
    })
  }

  static async suggestedAccounts(user_id: string) {
    // Get users with highest number of followers
    const topUsers = await prisma.user.findMany({
      where: {
        id: {
          not: user_id, // Exclude the current user
        },
      },
      select: {
        id: true,
        display_name: true,
        tag_name: true,
        profile_picture_url: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      orderBy: {
        followers: {
          _count: 'desc',
        },
        post: {
          _count: 'desc',
        },
        comments: {
          _count: 'desc',
        },
        donations: {
          _count: 'desc',
        },
      },
      take: 10, // Get top 10 users
    })

    // Check if current user follows each suggested account
    const suggestedAccounts = await Promise.all(
      topUsers.map(async (user) => {
        const existingFollow = await prisma.follower.findFirst({
          where: {
            user_id: user.id,
            follower_id: user_id,
          },
        })

        return {
          id: user.id,
          display_name: user.display_name,
          tag_name: user.tag_name,
          _count: user._count,
          profile_picture_url: user.profile_picture_url,
          following: !!existingFollow,
        }
      })
    )

    return suggestedAccounts
  }

  static async checkIfFollowing(follower_id: string, user_id: string) {
    const existingFollow = await prisma.follower.findFirst({
      where: {
        user_id: user_id,
        follower_id: follower_id,
      },
    })
    return !!existingFollow
  }
}
