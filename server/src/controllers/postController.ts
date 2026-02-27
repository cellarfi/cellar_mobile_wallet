import { BlockModel } from '@/models/block.model'
import { FundingMetaModel } from '@/models/fundingMeta.model'
import { MentionModel } from '@/models/mention.model'
import { PostModel } from '@/models/posts.model'
import { TokenMetaModel } from '@/models/tokenMeta.model'
import { NotificationService } from '@/service/notificationService'
import { PointsService } from '@/service/pointsService'
import prismaService from '@/service/prismaService'
import {
  createUnifiedPost,
  CreateUnifiedPostDto,
  UpdateFundraisingStatusDto,
  UpdatePostDto,
  updatePost as updatePostSchema,
  UpdateTokenCallDto,
  updateTokenCall as updateTokenCallSchema,
} from '@/utils/dto/socialfi.dto'
import { parseMentions } from '@/utils/mention.util'
import { Request, Response } from 'express'

const prisma = prismaService.prisma

/**
 * Controller function for returning posts.
 *
 * Query Parameters:
 * - page: number (optional, default: 1)
 * - pageSize: number (optional, default: 10)
 *
 * @param req Express request object
 * @param res Express response object
 * @returns void
 */
export const getPosts = async (
  req: Request<{}, {}, {}, { page: number; pageSize: number }>,
  res: Response
): Promise<void> => {
  const user = req.user!
  const user_id = user?.id

  // Get page and pageSize from query parameters, with defaults
  const page = Number(req.query.page) || 10
  const page_size = Number(req.query.pageSize) || 1

  // Validate page and pageSize
  if (page < 1 || page_size < 1) {
    res
      .status(400)
      .json({ error: 'Page and pageSize must be positive integers' })
  }

  const skip = (page - 1) * page_size
  const take = page_size

  // Get blocked user IDs to filter out
  let blockedIds: string[] = []
  if (user_id) {
    blockedIds = await BlockModel.getAllBlockedIds(user_id)
  }

  const totalPosts = await prisma.post.count({
    where: blockedIds.length > 0 ? { user_id: { notIn: blockedIds } } : {},
  })
  const totalPages = Math.ceil(totalPosts / page_size)

  // Calculate total pages based on total posts and page size
  if (totalPosts === 0) {
    res.status(200).json({
      success: true,
      data: [],
      pagination: {
        page,
        pageSize: page_size,
        totalPosts: 0,
        totalPages: 0,
      },
    })
    return
  }

  // Fetch posts with pagination
  try {
    const posts = await PostModel.getPosts(skip, take, blockedIds)
    const postsWithLikes = await Promise.all(
      posts.map(async (post: any) => {
        const like = await prismaService.prisma.like.findFirst({
          where: { post_id: post.id, user_id: user_id },
        })
        return {
          ...post,
          like: {
            status: !!like,
            id: like?.id,
          },
        }
      })
    )
    const data = user ? postsWithLikes : posts
    res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        pageSize: page_size,
        totalPosts,
        totalPages,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'An error occurred fetching posts.',
    })
  }
}

/**
 * Controller function for returning trending posts.
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - pageSize: number (default: 10)
 *
 * @param req Express request object
 * @param res Express response object
 * @returns void
 */
export const trendingPosts = async (
  req: Request<{}, {}, {}, { page: number; pageSize: number }>,
  res: Response
): Promise<void> => {
  const user = req.user!
  const user_id = user?.id

  // Get page and pageSize from query parameters, with defaults
  const page = Number(req.query.page) || 10
  const page_size = Number(req.query.pageSize) || 1

  // Validate page and pageSize
  if (page < 1 || page_size < 1) {
    res
      .status(400)
      .json({ error: 'Page and pageSize must be positive integers' })
    return
  }

  const skip = (page - 1) * page_size
  const take = page_size
  const totalPosts = await PostModel.getTrendingPostsCount()

  console.log('Total Posts', totalPosts)

  // Calculate total pages based on total posts and page size
  if (totalPosts === 0) {
    res.status(200).json({
      success: true,
      data: [],
      pagination: {
        page,
        pageSize: page_size,
        totalPosts: 0,
        totalPages: 0,
      },
    })
    return
  }

  if (page > Math.ceil(totalPosts / page_size)) {
    res.status(400).json({
      success: false,
      error: 'Page number exceeds total pages',
    })
    return
  }
  // Calculate total pages
  const totalPages = Math.ceil(totalPosts / page_size)

  // Fetch trending posts with pagination
  try {
    const posts = await PostModel.getTrendingPosts(skip, take)
    const postsWithLikes = await Promise.all(
      posts.map(async (post: any) => {
        const like = await prismaService.prisma.like.findFirst({
          where: { post_id: post.id, user_id: user_id },
        })
        return {
          ...post,
          like: {
            status: !!like,
            id: like?.id,
          },
        }
      })
    )

    // Return paginated data
    const data = user ? postsWithLikes : posts
    res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        pageSize: page_size,
        totalPages,
        totalPosts,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'An error occurred fetching posts.',
    })
  }
}

/**
 * Controller function handling get user's following posts
 * @param req
 * @param res
 * @returns void
 */
export const followersPosts = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user = req.user!
  const user_id = user?.id
  try {
    const posts = await PostModel.getFollowingPosts(user_id)
    const postsWithLikes = await Promise.all(
      posts.map(async (post: any) => {
        const like = await prismaService.prisma.like.findFirst({
          where: { post_id: post.id, user_id: user_id },
        })
        return {
          ...post,
          like: {
            status: !!like,
            id: like?.id,
          },
        }
      })
    )
    res.status(200).json({
      success: true,
      data: user ? postsWithLikes : posts,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'An error occurred fetching following posts.',
    })
  }
}

/**
 * Controller function to get posts by a specific user (by tag_name) with pagination
 * @param req - Express request object. Expects:
 *   - req.params.tag_name: string (User's tag name)
 *   - req.query.page: number (optional, default 1)
 *   - req.query.pageSize: number (optional, default 10)
 * @param res - Express response object
 */
export const getUserPostsByTagName = async (
  req: Request<
    { tag_name: string },
    {},
    {},
    { page?: string; pageSize?: string }
  >,
  res: Response
): Promise<void> => {
  try {
    const { tag_name } = req.params
    const user = req.user // Optional - for checking like status
    const currentUserId = user?.id

    if (!tag_name) {
      res.status(400).json({
        success: false,
        error: 'Tag name is required',
      })
      return
    }

    // Find the user by tag_name
    const targetUser = await prismaService.prisma.user.findUnique({
      where: { tag_name },
      select: { id: true },
    })

    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      })
      return
    }

    const page = parseInt(req.query.page || '1', 10)
    const page_size = parseInt(req.query.pageSize || '10', 10)

    // Get total count for pagination
    const totalPosts = await prismaService.prisma.post.count({
      where: { user_id: targetUser.id },
    })
    const totalPages = Math.ceil(totalPosts / page_size)

    // Get paginated posts
    const posts = await prismaService.prisma.post.findMany({
      where: { user_id: targetUser.id },
      skip: (page - 1) * page_size,
      take: page_size,
      orderBy: { created_at: 'desc' },
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
            id: true,
            target_amount: true,
            current_amount: true,
            status: true,
            deadline: true,
            wallet_address: true,
            chain_type: true,
            token_symbol: true,
          },
        },
        token_meta: {
          select: {
            id: true,
            token_address: true,
            token_name: true,
            token_symbol: true,
            logo_url: true,
            chain_type: true,
            launch_date: true,
            price: true,
            target_price: true,
            market_cap: true,
            description: true,
          },
        },
      },
    })

    // Add like status if user is authenticated
    const postsWithLikes = await Promise.all(
      posts.map(async (post) => {
        if (currentUserId) {
          const like = await prismaService.prisma.like.findFirst({
            where: { post_id: post.id, user_id: currentUserId },
          })
          return {
            ...post,
            like: {
              count: post._count.like,
              status: !!like,
              id: like?.id || null,
            },
          }
        }
        return {
          ...post,
          like: {
            count: post._count.like,
            status: false,
            id: null,
          },
        }
      })
    )

    res.status(200).json({
      success: true,
      data: postsWithLikes,
      pagination: {
        page,
        pageSize: page_size,
        totalPages,
        totalPosts,
      },
    })
  } catch (error) {
    console.error('Error fetching user posts:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred fetching user posts.',
    })
  }
}

/**
 * Controller function to get a post by its ID, including paginated comments.
 * @param req - Express request object. Expects:
 *   - req.params.id: string (Post ID)
 *   - req.query.page: number (optional, default 1)
 *   - req.query.pageSize: number (optional, default 10)
 * @param res - Express response object
 */
export const getPost = async (
  req: Request<{ id: string }, {}, {}, { page: number; pageSize: number }>,
  res: Response
): Promise<void> => {
  const user = req.user!
  const user_id = user?.id
  const { id } = req.params

  // Get page and pageSize from query parameters, with defaults
  const page = Number(req.query.page) || 10
  const page_size = Number(req.query.pageSize) || 1

  // Validate page and pageSize
  if (page < 1 || page_size < 1) {
    res
      .status(400)
      .json({ error: 'Comment Page and pageSize must be positive integers' })
    return
  }

  const skip = (page - 1) * page_size
  const take = page_size

  const totalPosts = await prisma.comment.count({
    where: {
      post_id: id,
    },
  })
  const totalPages = Math.ceil(totalPosts / page_size)

  // Return Paginated Replies
  try {
    // Use the new model method
    const post = await PostModel.getPostWithCommentLikes(
      id,
      user_id,
      take,
      skip
    )

    if (!post) {
      res.status(404).json({
        success: false,
        error: 'Post not found.',
      })
      return
    }

    // Get like for the post (for the current user)
    const like = await prismaService.prisma.like.findFirst({
      where: { post_id: post.id, user_id: user_id },
    })

    // Check if current user is following the post author
    let is_following = false
    if (user_id && post.user_id && post.user_id !== user_id) {
      const followRecord = await prismaService.prisma.follower.findFirst({
        where: {
          user_id: post.user_id,
          follower_id: user_id as string,
        },
      })
      is_following = !!followRecord
    }

    // Process comments to add like count and status
    const commentsWithLikeStatus = post.comment.map((comment) => ({
      ...comment,
      like: {
        count: comment._count.CommentLike,
        status: comment.CommentLike.length > 0,
        id: comment.CommentLike[0]?.id,
      },
      CommentLike: undefined,
    }))

    let postWithLikes = {
      ...post,
      is_following,
      like: {
        count: post._count.like,
        status: !!like,
        id: like?.id,
      },
      comment: commentsWithLikeStatus,
    }

    const data = user ? postWithLikes : post

    res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        pageSize: page_size,
        totalPages,
        totalPosts,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'An error occurred fetching the post.',
    })
  }
}

/**
 * Unified function to create any type of post with proper validation
 */
export const createPost = async (
  req: Request<{}, {}, CreateUnifiedPostDto>,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!
    const user_id = user.id

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      })
      return
    }

    // Validate the entire request using the unified schema
    const { success, data, error } = await createUnifiedPost.safeParseAsync(
      req.body
    )

    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
      console.log(error)
      return
    }

    // Create the base post using the appropriate method based on post type
    let post: any

    if (data.post_type === 'REGULAR') {
      post = await PostModel.createPost({
        content: data.content,
        media: data.media,
        user_id: user_id,
      })
    } else {
      post = await PostModel.createFundraisingPost(
        data.content,
        user_id,
        data.post_type,
        data.media
      )
    }

    let result: any = { ...post }

    // Award points for post creation based on post type
    try {
      // Award different points based on post type
      if (data.post_type === 'REGULAR') {
        await PointsService.awardPoints(user_id, 'POST_CREATION', {
          post_id: post.id,
          post_type: data.post_type,
        })
      } else if (data.post_type === 'DONATION') {
        await PointsService.awardPoints(user_id, 'DONATION', {
          post_id: post.id,
          post_type: data.post_type,
        })
      } else if (data.post_type === 'TOKEN_CALL') {
        await PointsService.awardPoints(user_id, 'TOKEN_LAUNCH', {
          post_id: post.id,
          post_type: data.post_type,
        })
      }
    } catch (pointsError) {
      // Log but don't prevent post creation if points can't be awarded
      console.error('[createPost] Error awarding points:', pointsError)
    }

    // Handle specific post types with their metadata
    switch (data.post_type) {
      case 'REGULAR':
        // No additional metadata needed
        break

      case 'DONATION':
        // Create funding metadata
        const fundingMeta = await FundingMetaModel.createFundingMeta({
          post_id: post.id,
          target_amount: data.target_amount,
          wallet_address: data.wallet_address,
          chain_type: data.chain_type,
          token_symbol: data.token_symbol,
          token_address: data.token_address,
          deadline: data.deadline ? new Date(data.deadline) : undefined,
        })

        result.funding_meta = fundingMeta
        break

      case 'TOKEN_CALL':
        // Create token metadata
        const tokenMeta = await TokenMetaModel.createTokenMeta({
          post_id: post.id,
          token_name: data.token_name,
          token_symbol: data.token_symbol,
          token_address: data.token_address,
          chain_type: data.chain_type,
          logo_url: data.logo_url,
          launch_date: data.launch_date
            ? new Date(data.launch_date)
            : undefined,
          initial_price: data.initial_price,
          target_price: data.target_price,
          market_cap: data.market_cap,
          description: data.description,
        })

        result.token_meta = tokenMeta
        break
    }

    // Parse and store mentions, then send notifications
    try {
      const tagNames = parseMentions(data.content)
      if (tagNames.length > 0) {
        // Find users by tag_name
        const mentionedUsers = await prisma.user.findMany({
          where: {
            tag_name: {
              in: tagNames,
            },
          },
          select: {
            id: true,
            tag_name: true,
          },
        })

        // Create mentions for valid users
        if (mentionedUsers.length > 0) {
          const mentions = mentionedUsers.map((mentionedUser) => ({
            user_id: mentionedUser.id,
            tag_name: mentionedUser.tag_name,
          }))
          await MentionModel.createMentions(post.id, mentions)

          // Fetch user profile from database to get display name
          const userProfile = await prisma.user.findUnique({
            where: { id: user_id },
            select: { display_name: true, tag_name: true },
          })
          const mentionerName =
            userProfile?.display_name || userProfile?.tag_name || 'Someone'

          // Send notifications to mentioned users
          for (const mentionedUser of mentionedUsers) {
            // Don't notify the post creator if they mention themselves
            if (mentionedUser.id !== user_id) {
              try {
                await NotificationService.sendMentionNotification(
                  mentionedUser.id,
                  user_id,
                  mentionerName,
                  post.id,
                  data.content
                )
              } catch (notifError) {
                console.error(
                  `[createPost] Error sending mention notification to ${mentionedUser.id}:`,
                  notifError
                )
              }
            }
          }
        }
      }
    } catch (mentionError) {
      // Log but don't prevent post creation if mentions can't be stored
      console.error('[createPost] Error storing mentions:', mentionError)
    }

    res.status(201).json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error creating post:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred creating the post.',
    })
  }
}

/**
 * Get fundraising posts (token calls and donations)
 */
export const getFundraisingPosts = async (
  req: Request<{}, {}, {}, { type?: 'TOKEN_CALL' | 'DONATION' }>,
  res: Response
): Promise<void> => {
  try {
    const { type } = req.query
    const posts = await FundingMetaModel.getFundraisingPostsByType(type)

    res.status(200).json({
      success: true,
      data: posts,
    })
  } catch (error) {
    console.error('Error fetching fundraising posts:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred fetching fundraising posts.',
    })
  }
}

/**
 * Get active fundraising posts
 */
export const getActiveFundraisingPosts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const posts = await FundingMetaModel.getActiveFundraisingPosts()

    res.status(200).json({
      success: true,
      data: posts,
    })
  } catch (error) {
    console.error('Error fetching active fundraising posts:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred fetching active fundraising posts.',
    })
  }
}

/**
 * Update fundraising post status
 */
export const updateFundraisingStatus = async (
  req: Request<{}, {}, UpdateFundraisingStatusDto>,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!
    const user_id = user.id

    // First, verify the user owns the post
    const post = await PostModel.getPost(req.body.post_id)
    if (!post || post.user_id !== user_id) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: You can only update your own posts',
      })
      return
    }

    const updatedMeta = await FundingMetaModel.updateStatus(
      req.body.post_id,
      req.body.status
    )

    res.status(200).json({
      success: true,
      data: updatedMeta,
    })
  } catch (error) {
    console.error('Error updating fundraising status:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred updating the fundraising status.',
    })
  }
}

/**
 * Get user's fundraising posts
 */
export const getUserFundraisingPosts = async (
  req: Request<{ user_id?: string }>,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!
    const target_user_id = req.params.user_id || user.id

    const posts = await FundingMetaModel.getUserFundraisingPosts(target_user_id)

    res.status(200).json({
      success: true,
      data: posts,
    })
  } catch (error) {
    console.error('Error fetching user fundraising posts:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred fetching user fundraising posts.',
    })
  }
}

/**
 * Get funding statistics for a post
 */
export const getFundingStats = async (
  req: Request<{ post_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { post_id } = req.params

    const stats = await FundingMetaModel.getFundingStats(post_id)

    if (!stats) {
      res.status(404).json({
        success: false,
        error: 'Funding metadata not found for this post',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error fetching funding stats:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred fetching funding statistics.',
    })
  }
}

/**
 * Controller to handle searching for posts.
 *
 * Expects:
 *   - req.query.query: string (search term, required)
 *   - req.query.type: string (optional, post type filter: "REGULAR" | "TOKEN_CALL" | "DONATION")
 *
 * @param req - Express request object
 * @param res - Express response object
 * @returns void
 */
export const searchPosts = async (
  req: Request<{}, {}, {}, { query: string; type?: string }>,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!
    const user_id = user?.id
    const query = req.query.query
    const type = req.query.type

    if (!query) {
      res.status(400).json({
        success: false,
        error: 'Search query is required',
      })
      return
    }

    const postType = type as 'REGULAR' | 'TOKEN_CALL' | 'DONATION' | undefined
    const posts = await PostModel.searchPost(query, postType)
    const postsWithLikes = await Promise.all(
      posts.map(async (post: any) => {
        const like = await prismaService.prisma.like.findFirst({
          where: { post_id: post.id, user_id: user_id },
        })
        return {
          ...post,
          like: {
            status: !!like,
            id: like?.id,
          },
        }
      })
    )

    res.status(200).json({
      success: true,
      data: user ? postsWithLikes : posts,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      error: 'An error occurred searching for posts.',
    })
  }
}

/**
 * Get all token calls
 */
export const getTokenCalls = async (
  req: Request<{}, {}, {}, { chain_type?: string; is_launched?: string }>,
  res: Response
): Promise<void> => {
  try {
    const { chain_type, is_launched } = req.query

    let tokenCalls

    if (chain_type) {
      tokenCalls = await TokenMetaModel.getTokenCallsByChain(chain_type)
    } else if (is_launched !== undefined) {
      // Convert string to boolean and use launch_date-based logic
      tokenCalls = await TokenMetaModel.getTokenCallsByStatus(
        is_launched === 'true'
      )
    } else {
      tokenCalls = await TokenMetaModel.getTokenCalls()
    }

    res.status(200).json({
      success: true,
      data: tokenCalls,
    })
  } catch (error) {
    console.error('Error fetching token calls:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred fetching token calls.',
    })
  }
}

/**
 * Get trending token calls
 */
export const getTrendingTokenCalls = async (
  req: Request<{}, {}, {}, { limit?: string }>,
  res: Response
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit || '10', 10)
    const tokenCalls = await TokenMetaModel.getTrendingTokenCalls(limit)

    res.status(200).json({
      success: true,
      data: tokenCalls,
    })
  } catch (error) {
    console.error('Error fetching trending token calls:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred fetching trending token calls.',
    })
  }
}

/**
 * Update token call metadata
 */
export const updateTokenCall = async (
  req: Request<{}, {}, UpdateTokenCallDto>,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!
    const user_id = user.id

    // Validate request data using Zod schema
    const { success, data, error } = await updateTokenCallSchema.safeParseAsync(
      req.body
    )

    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
      return
    }

    // First, verify the user owns the post
    const post = await PostModel.getPost(data.post_id)
    if (!post || post.user_id !== user_id) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: You can only update your own token calls',
      })
      return
    }

    const { post_id, launch_date, ...updateData } = data

    const updatedTokenCall = await TokenMetaModel.updateTokenMeta(post_id, {
      ...updateData,
      launch_date: launch_date ? new Date(launch_date) : undefined,
    })

    res.status(200).json({
      success: true,
      data: updatedTokenCall,
    })
  } catch (error) {
    console.error('Error updating token call:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred updating the token call.',
    })
  }
}

/**
 * Mark token as launched
 */
export const markTokenAsLaunched = async (
  req: Request<
    {},
    {},
    { post_id: string; launch_date?: string; initial_price?: number }
  >,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!
    const user_id = user.id

    // First, verify the user owns the post
    const post = await PostModel.getPost(req.body.post_id)
    if (!post || post.user_id !== user_id) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: You can only update your own token calls',
      })
      return
    }

    const { post_id, launch_date, initial_price } = req.body

    const updatedTokenCall = await TokenMetaModel.markTokenAsLaunched(post_id, {
      launch_date: launch_date ? new Date(launch_date) : undefined,
      initial_price,
    })

    res.status(200).json({
      success: true,
      data: updatedTokenCall,
    })
  } catch (error) {
    console.error('Error marking token as launched:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred marking the token as launched.',
    })
  }
}

/**
 * Search token calls
 */
export const searchTokenCalls = async (
  req: Request<{}, {}, {}, { query: string }>,
  res: Response
): Promise<void> => {
  try {
    const query = req.query.query

    if (!query) {
      res.status(400).json({
        success: false,
        error: 'Search query is required',
      })
      return
    }

    const tokenCalls = await TokenMetaModel.searchTokenCalls(query)

    res.status(200).json({
      success: true,
      data: tokenCalls,
    })
  } catch (error) {
    console.error('Error searching token calls:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred searching token calls.',
    })
  }
}

/**
 * Get token call by address
 */
export const getTokenCallByAddress = async (
  req: Request<{ token_address: string }>,
  res: Response
): Promise<void> => {
  try {
    const { token_address } = req.params

    const tokenCall = await TokenMetaModel.getTokenCallByAddress(token_address)

    if (!tokenCall) {
      res.status(404).json({
        success: false,
        error: 'Token call not found',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: tokenCall,
    })
  } catch (error) {
    console.error('Error fetching token call by address:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred fetching the token call.',
    })
  }
}

/**
 * Update a post's content
 */
export const updatePost = async (
  req: Request<{}, {}, UpdatePostDto>,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!
    const user_id = user.id

    // Validate request data using Zod schema
    const { success, data, error } = await updatePostSchema.safeParseAsync(
      req.body
    )

    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
      return
    }

    // First, verify the user owns the post
    const post = await PostModel.getPost(data.id)
    if (!post) {
      res.status(404).json({
        success: false,
        error: 'Post not found',
      })
      return
    }

    if (post.user_id !== user_id) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: You can only update your own posts',
      })
      return
    }

    const updatedPost = await PostModel.updatePost(
      data.id,
      user_id,
      data.content
    )

    // Update mentions when post content is updated
    try {
      // Get existing mentions before deleting (to avoid notifying already-mentioned users)
      const existingMentions = await prisma.mention.findMany({
        where: { post_id: data.id },
        select: { user_id: true },
      })
      const existingMentionedUserIds = new Set(
        existingMentions.map((m) => m.user_id)
      )

      // Delete existing mentions
      await MentionModel.deleteMentionsByPostId(data.id)

      // Parse and create new mentions
      const tagNames = parseMentions(data.content)
      if (tagNames.length > 0) {
        // Find users by tag_name
        const mentionedUsers = await prisma.user.findMany({
          where: {
            tag_name: {
              in: tagNames,
            },
          },
          select: {
            id: true,
            tag_name: true,
          },
        })

        // Create mentions for valid users
        if (mentionedUsers.length > 0) {
          const mentions = mentionedUsers.map((mentionedUser) => ({
            user_id: mentionedUser.id,
            tag_name: mentionedUser.tag_name,
          }))
          await MentionModel.createMentions(data.id, mentions)

          // Fetch user profile from database to get display name for notifications
          const userProfile = await prisma.user.findUnique({
            where: { id: user_id },
            select: { display_name: true, tag_name: true },
          })
          const mentionerName =
            userProfile?.display_name || userProfile?.tag_name || 'Someone'

          // Send notifications only to NEWLY mentioned users (not previously mentioned)
          for (const mentionedUser of mentionedUsers) {
            // Don't notify the post creator or users who were already mentioned
            if (
              mentionedUser.id !== user_id &&
              !existingMentionedUserIds.has(mentionedUser.id)
            ) {
              try {
                await NotificationService.sendMentionNotification(
                  mentionedUser.id,
                  user_id,
                  mentionerName,
                  data.id,
                  data.content
                )
              } catch (notifError) {
                console.error(
                  `[updatePost] Error sending mention notification to ${mentionedUser.id}:`,
                  notifError
                )
              }
            }
          }
        }
      }
    } catch (mentionError) {
      // Log but don't prevent post update if mentions can't be stored
      console.error('[updatePost] Error storing mentions:', mentionError)
    }

    res.status(200).json({
      success: true,
      data: updatedPost,
    })
  } catch (error) {
    console.error('Error updating post:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred updating the post.',
    })
  }
}

/**
 * Delete a post
 */
export const deletePost = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!
    const user_id = user.id
    const { id } = req.params

    // First, verify the user owns the post
    const post = await PostModel.getPost(id)
    if (!post) {
      res.status(404).json({
        success: false,
        error: 'Post not found',
      })
      return
    }

    if (post.user_id !== user_id) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: You can only delete your own posts',
      })
      return
    }

    await PostModel.deletePost(id, user_id)

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting post:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred deleting the post.',
    })
  }
}

/**
 * Increment funding amount for a donation post
 */
export const incrementFundingAmount = async (
  req: Request<{ post_id: string }, {}, { amount: number }>,
  res: Response
): Promise<void> => {
  try {
    const { post_id } = req.params
    const { amount } = req.body

    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        error: 'Amount must be a positive number',
      })
      return
    }

    // Verify the post exists and is a donation post
    const post = await PostModel.getPost(post_id)
    if (!post) {
      res.status(404).json({
        success: false,
        error: 'Post not found',
      })
      return
    }

    if (post.post_type !== 'DONATION') {
      res.status(400).json({
        success: false,
        error: 'This endpoint is only for donation posts',
      })
      return
    }

    // Increment the funding amount
    const updatedMeta = await FundingMetaModel.incrementAmount(post_id, amount)

    res.status(200).json({
      success: true,
      data: updatedMeta,
    })
  } catch (error) {
    console.error('Error incrementing funding amount:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred updating the funding amount.',
    })
  }
}
