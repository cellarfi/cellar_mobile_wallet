// NOTE: Run `npx prisma generate` to regenerate the Prisma client
// with the new FundingMeta model before using the updated methods

import prismaService from '@/service/prismaService'
import { CreatePostDto } from '@/utils/dto/socialfi.dto'

const prisma = prismaService.prisma

export class PostModel {
  /**
   * Get all posts
   * @param skip - Number of posts to skip for pagination
   * @param page_size - Number of posts to return
   * @param excludedUserIds - Optional array of user IDs to exclude (for blocking)
   */
  static async getPosts(
    skip: number,
    page_size: number,
    excludedUserIds?: string[]
  ) {
    const whereClause =
      excludedUserIds && excludedUserIds.length > 0
        ? { user_id: { notIn: excludedUserIds } }
        : {}

    return prisma.post.findMany({
      where: whereClause,
      include: {
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
      take: page_size,
      skip: skip,
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  /**
   * Get a post by id
   * @param id
   * @returns
   */
  static async getPost(id: string) {
    return prisma.post.findUnique({
      where: { id: id },
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
    })
  }

  /**
   * Get trending posts
   * @param skip
   * @param take
   * @returns
   */
  static async getTrendingPosts(skip: number, take: number) {
    return prisma.post.findMany({
      include: {
        _count: { select: { like: true } },
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
      orderBy: [
        {
          like: {
            _count: 'desc',
          },
        },
        {
          comment: {
            _count: 'desc',
          },
        },
      ],
      take,
      skip,
    })
  }

  /**
   * Get trending posts count
   * @returns number
   */
  static async getTrendingPostsCount() {
    const posts = await prisma.post.findMany({
      include: {
        _count: { select: { like: true } },
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
      orderBy: [
        {
          like: {
            _count: 'desc',
          },
        },
        {
          comment: {
            _count: 'desc',
          },
        },
      ],
    })
    return posts.length
  }

  /**
   * Get most commented posts
   * @param limit
   * @returns
   */
  static async getMostCommentedPosts(limit: number = 5) {
    return prisma.post.findMany({
      include: {
        _count: { select: { comment: true } },
        user: {
          select: {
            id: true,
            tag_name: true,
            display_name: true,
            profile_picture_url: true,
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
      },
      orderBy: {
        comment: {
          _count: 'desc',
        },
      },
      take: limit,
    })
  }

  /**
   * Search for post based on query and type
   * @param query
   * @param type
   * @returns
   */
  static async searchPost(
    query: string,
    type?: 'REGULAR' | 'TOKEN_CALL' | 'DONATION'
  ) {
    return prisma.post.findMany({
      where: {
        content: {
          contains: query,
          mode: 'insensitive',
        },
        ...(type && { post_type: type }),
      },
      select: {
        _count: { select: { comment: true, like: true } },
        id: true,
        post_type: true,
        created_at: true,
        content: true,
        media: true,
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
    })
  }

  /**
   * Get user's posts
   * @param user_id
   * @returns
   */
  static async getUserPosts(user_id: string) {
    return prisma.post.findMany({
      where: {
        user_id: user_id,
      },
      select: {
        id: true,
        content: true,
        created_at: true,
        post_type: true,
        _count: {
          select: {
            like: true,
            comment: true,
          },
        },
        funding_meta: {
          select: {
            target_amount: true,
            current_amount: true,
            status: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  /**
   * Creates a new post
   * @param createPost
   * @returns
   */
  static async createPost(createPost: CreatePostDto) {
    return prisma.post.create({
      data: {
        content: createPost.content,
        user_id: createPost.user_id,
        media: createPost.media,
        post_type: 'REGULAR', // Regular posts are always REGULAR type
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
        _count: {
          select: {
            like: true,
            comment: true,
          },
        },
      },
    })
  }

  /**
   * Create a fundraising post (without funding metadata)
   * Funding metadata should be created separately using FundingMetaModel
   */
  static async createFundraisingPost(
    content: string,
    user_id: string,
    post_type: 'TOKEN_CALL' | 'DONATION',
    media?: string[]
  ) {
    return prisma.post.create({
      data: {
        content,
        user_id,
        media,
        post_type,
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
        _count: {
          select: {
            like: true,
            comment: true,
          },
        },
      },
    })
  }

  /**
   * Get posts by type including funding metadata for fundraising posts
   */
  static async getPostsByType(
    post_type?: 'REGULAR' | 'TOKEN_CALL' | 'DONATION'
  ) {
    const whereClause: any = {}

    if (post_type) {
      whereClause.post_type = post_type
    }

    return prisma.post.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            tag_name: true,
            display_name: true,
            profile_picture_url: true,
            wallets: { select: { address: true } },
          },
        },
        _count: {
          select: {
            like: true,
            comment: true,
            donations: true,
          },
        },
        funding_meta:
          post_type === 'REGULAR'
            ? false
            : {
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
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  /**
   * Update a existing post's content
   * Note: Ownership should be verified before calling this method
   * @param post_id
   * @param user_id
   * @param content
   * @returns
   */
  static async updatePost(post_id: string, user_id: string, content: string) {
    return prisma.post.update({
      where: {
        id: post_id,
      },
      data: {
        content: content,
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
        _count: {
          select: {
            like: true,
            comment: true,
          },
        },
        funding_meta: {
          select: {
            target_amount: true,
            current_amount: true,
            status: true,
          },
        },
      },
    })
  }

  /**
   * Delete's a post
   * Note: Ownership should be verified before calling this method
   * @param post_id
   * @param user_id
   * @returns
   */
  static async deletePost(post_id: string, user_id: string) {
    return prisma.post.delete({
      where: {
        id: post_id,
      },
    })
  }

  /**
   * Get posts total count
   * @returns number
   */
  static async getPostsWithCounts() {
    return prisma.post.findMany({
      include: {
        _count: {
          select: {
            like: true,
            comment: true,
          },
        },
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
            status: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  static async getFollowingPosts(user_id: string) {
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
      orderBy: {
        created_at: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            display_name: true,
            tag_name: true,
            profile_picture_url: true,
            wallets: { select: { address: true } },
          },
        },
        _count: {
          select: {
            like: true,
            comment: true,
          },
        },
      },
    })

    return posts
  }

  /**
   * Get's a post with comment and comment likes count
   * @param post_id
   * @param user_id
   * @param take
   * @param skip
   * @returns
   */
  static async getPostWithCommentLikes(
    post_id: string,
    user_id: string,
    take: number,
    skip: number
  ) {
    return prisma.post.findUnique({
      where: { id: post_id },
      include: {
        comment: {
          include: {
            _count: { select: { CommentLike: true } },
            CommentLike: {
              where: { user_id },
              select: { id: true },
              orderBy: {
                created_at: 'desc',
              },
            },
            user: {
              select: {
                id: true,
                display_name: true,
                tag_name: true,
                profile_picture_url: true,
              },
            },
          },
          take,
          skip,
          orderBy: {
            created_at: 'desc',
          },
        },
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
    })
  }
}
