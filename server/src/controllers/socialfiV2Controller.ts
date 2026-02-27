import { NotificationService } from '@/service/notificationService'
import { PointsService } from '@/service/pointsService'
import prismaService from '@/service/prismaService'
import { TapestryService } from '@/service/tapestryService'
import { CredibilityService } from '@/service/credibilityService'
import { FundingMetaModel } from '@/models/fundingMeta.model'
import { MentionModel } from '@/models/mention.model'
import { TokenMetaModel } from '@/models/tokenMeta.model'
import {
  CreateCommentV2Dto,
  CreatePostV2Dto,
  FollowUserV2Dto,
  LikePostV2Dto,
  LogTradeV2Dto,
  createCommentV2Schema,
  createPostV2Schema,
  followUserV2Schema,
  likePostV2Schema,
  logTradeV2Schema,
} from '@/utils/dto/socialfi.dto'
import { parseMentions } from '@/utils/mention.util'
import { NATIVE_SOL_MINT, WRAPPED_SOL_MINT } from '@/utils/solana.util'
import { Request, Response } from 'express'
import { Follower } from '../../generated/prisma'
import { LikeModel } from '@/models/like.model'
import { PostModel } from '@/models/posts.model'

const prisma = prismaService.prisma

async function ensureTapestryProfileForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallets: {
        where: { is_default: true },
        take: 1,
      },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  if (user.tapestry_profile_id) {
    return { user, tapestryProfileId: user.tapestry_profile_id }
  }

  const defaultWallet = user.wallets[0]
  if (!defaultWallet) {
    throw new Error('User has no default wallet')
  }

  const profile = await TapestryService.findOrCreateProfile({
    walletAddress: defaultWallet.address,
    username: user.tag_name,
    displayName: user.display_name,
    avatarUrl: user.profile_picture_url,
    bio: user.about ?? undefined,
  })

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { tapestry_profile_id: profile.id },
  })

  return { user: updated, tapestryProfileId: profile.id }
}

export const followUserV2 = async (
  req: Request<{}, {}, FollowUserV2Dto>,
  res: Response,
): Promise<void> => {
  try {
    const followerId = req.user!.id

    const { success, data, error } = await followUserV2Schema.safeParseAsync(
      req.body,
    )

    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
      return
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          data.target_user_id ? { id: data.target_user_id } : undefined,
          data.target_tag_name ? { tag_name: data.target_tag_name } : undefined,
        ].filter(Boolean) as any,
      },
    })

    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: 'Target user not found',
      })
      return
    }

    if (targetUser.id === followerId) {
      res.status(400).json({
        success: false,
        error: 'You cannot follow yourself',
      })
      return
    }

    // Ensure both users have Tapestry profiles
    const [{ tapestryProfileId: followerProfileId }, { tapestryProfileId }] =
      await Promise.all([
        ensureTapestryProfileForUser(followerId),
        ensureTapestryProfileForUser(targetUser.id),
      ])

    // Mirror follow in local DB
    let followEdge: Follower | null = await prisma.follower.findFirst({
      where: {
        user_id: targetUser.id,
        follower_id: followerId,
      },
    })

    if (!followEdge) {
      followEdge = await prisma.follower.create({
        data: {
          user_id: targetUser.id,
          follower_id: followerId,
        },
      })
    }

    // Award points for following
    try {
      await PointsService.awardPoints(followerId, 'USER_FOLLOW', {
        followed_user_id: targetUser.id,
      })
      await PointsService.awardPoints(targetUser.id, 'USER_FOLLOW', {
        follower_user_id: followerId,
      })
    } catch (pointsError) {
      console.error('[followUserV2] Error awarding points:', pointsError)
    }

    // Send notification to the user being followed
    try {
      const followerProfile = await prisma.user.findUnique({
        where: { id: followerId },
        select: { display_name: true, tag_name: true },
      })
      const followerName =
        followerProfile?.display_name || followerProfile?.tag_name || 'Someone'
      const followerTagName = followerProfile?.tag_name || followerId

      await NotificationService.sendNewFollowerNotification(
        targetUser.id,
        followerId,
        followerName,
        followerTagName,
      )
    } catch (notificationError) {
      console.error(
        '[followUserV2] Error sending notification:',
        notificationError,
      )
    }

    // Follow on Tapestry
    await TapestryService.followProfile({
      followerProfileId,
      followeeProfileId: tapestryProfileId,
    })

    res.status(200).json({
      success: true,
      data: {
        follow: followEdge,
      },
    })
  } catch (error: any) {
    console.error('[followUserV2] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred following the user',
    })
  }
}

export const unfollowUserV2 = async (
  req: Request<{}, {}, FollowUserV2Dto>,
  res: Response,
): Promise<void> => {
  try {
    const followerId = req.user!.id

    const { success, data, error } = await followUserV2Schema.safeParseAsync(
      req.body,
    )

    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
      return
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          data.target_user_id ? { id: data.target_user_id } : undefined,
          data.target_tag_name ? { tag_name: data.target_tag_name } : undefined,
        ].filter(Boolean) as any,
      },
    })

    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: 'Target user not found',
      })
      return
    }

    if (targetUser.id === followerId) {
      res.status(400).json({
        success: false,
        error: 'You cannot unfollow yourself',
      })
      return
    }

    const [{ tapestryProfileId: followerProfileId }, { tapestryProfileId }] =
      await Promise.all([
        ensureTapestryProfileForUser(followerId),
        ensureTapestryProfileForUser(targetUser.id),
      ])

    await prisma.follower.deleteMany({
      where: {
        user_id: targetUser.id,
        follower_id: followerId,
      },
    })

    await TapestryService.unfollowProfile({
      followerProfileId,
      followeeProfileId: tapestryProfileId,
    })

    res.status(200).json({
      success: true,
      data: {
        unfollowed: true,
      },
    })
  } catch (error: any) {
    console.error('[unfollowUserV2] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred unfollowing the user',
    })
  }
}

export const createPostV2 = async (
  req: Request<{}, {}, CreatePostV2Dto>,
  res: Response,
): Promise<void> => {
  try {
    const user = req.user!
    const userId = user.id

    const { success, data, error } = await createPostV2Schema.safeParseAsync(
      req.body,
    )

    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
      return
    }

    // 1) Create local post using same logic as v1 (double entry)
    let post: any

    if (data.post_type === 'REGULAR') {
      post = await PostModel.createPost({
        content: data.content,
        media: data.media,
        user_id: userId,
      })
    } else {
      post = await PostModel.createFundraisingPost(
        data.content,
        userId,
        data.post_type,
        data.media,
      )
    }

    let result: any = { ...post }

    // Award points for post creation based on post type (match v1 behavior)
    try {
      if (data.post_type === 'REGULAR') {
        await PointsService.awardPoints(userId, 'POST_CREATION', {
          post_id: post.id,
          post_type: data.post_type,
        })
      } else if (data.post_type === 'DONATION') {
        await PointsService.awardPoints(userId, 'DONATION', {
          post_id: post.id,
          post_type: data.post_type,
        })
      } else if (data.post_type === 'TOKEN_CALL') {
        await PointsService.awardPoints(userId, 'TOKEN_LAUNCH', {
          post_id: post.id,
          post_type: data.post_type,
        })
      }
    } catch (pointsError) {
      console.error('[createPostV2] Error awarding points:', pointsError)
    }

    // Handle specific post types metadata (reuse v1 patterns)
    switch (data.post_type) {
      case 'REGULAR':
        break
      case 'DONATION': {
        const fundingMeta = await FundingMetaModel.createFundingMeta({
          post_id: post.id,
          target_amount: (data as any).target_amount,
          wallet_address: (data as any).wallet_address,
          chain_type: (data as any).chain_type,
          token_symbol: (data as any).token_symbol,
          token_address: (data as any).token_address,
          deadline: (data as any).deadline
            ? new Date((data as any).deadline)
            : undefined,
        })
        result.funding_meta = fundingMeta
        break
      }
      case 'TOKEN_CALL': {
        const tokenMeta = await TokenMetaModel.createTokenMeta({
          post_id: post.id,
          token_name: (data as any).token_name,
          token_symbol: (data as any).token_symbol,
          token_address: (data as any).token_address,
          chain_type: (data as any).chain_type,
          logo_url: (data as any).logo_url,
          launch_date: (data as any).launch_date
            ? new Date((data as any).launch_date)
            : undefined,
          initial_price: (data as any).initial_price,
          target_price: (data as any).target_price,
          market_cap: (data as any).market_cap,
          description: (data as any).description,
        })
        result.token_meta = tokenMeta
        break
      }
    }

    // Parse mentions and store them (v1-style)
    try {
      const tagNames = parseMentions(data.content)
      if (tagNames.length > 0) {
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

        if (mentionedUsers.length > 0) {
          const mentions = mentionedUsers.map((mentionedUser) => ({
            user_id: mentionedUser.id,
            tag_name: mentionedUser.tag_name,
          }))
          await MentionModel.createMentions(post.id, mentions)

          const userProfile = await prisma.user.findUnique({
            where: { id: userId },
            select: { display_name: true, tag_name: true },
          })
          const mentionerName =
            userProfile?.display_name || userProfile?.tag_name || 'Someone'

          for (const mentionedUser of mentionedUsers) {
            if (mentionedUser.id !== userId) {
              try {
                await NotificationService.sendMentionNotification(
                  mentionedUser.id,
                  userId,
                  mentionerName,
                  post.id,
                  data.content,
                )
              } catch (notifError) {
                console.error(
                  `[createPostV2] Error sending mention notification to ${mentionedUser.id}:`,
                  notifError,
                )
              }
            }
          }
        }
      }
    } catch (mentionError) {
      console.error('[createPostV2] Error storing mentions:', mentionError)
    }

    // 2) Mirror to Tapestry
    const { tapestryProfileId } = await ensureTapestryProfileForUser(userId)

    const properties: { key: string; value: string | number | boolean }[] = [
      { key: 'post_type', value: data.post_type },
    ]

    if (data.post_type === 'DONATION') {
      properties.push(
        { key: 'target_amount', value: (data as any).target_amount },
        { key: 'wallet_address', value: (data as any).wallet_address },
        { key: 'chain_type', value: (data as any).chain_type },
      )
    }

    if (data.post_type === 'TOKEN_CALL') {
      properties.push(
        { key: 'token_name', value: (data as any).token_name },
        { key: 'token_symbol', value: (data as any).token_symbol },
        { key: 'token_address', value: (data as any).token_address },
      )
    }

    const content = await TapestryService.findOrCreateContent({
      profileId: tapestryProfileId,
      contentId: crypto.randomUUID(),
      properties,
    })

    // Persist Tapestry content id on local post
    const tapestryContentId = (content as any).id
    if (tapestryContentId) {
      await prisma.post.update({
        where: { id: post.id },
        data: { tapestry_content_id: tapestryContentId },
      })
      result = { ...result, tapestry_content_id: tapestryContentId }
    }

    // Award extra points keyed by Tapestry id
    try {
      await PointsService.awardPoints(userId, 'POST_CREATION', {
        post_id: post.id,
        tapestry_content_id: tapestryContentId,
      })
    } catch (pointsError) {
      console.error(
        '[createPostV2] Error awarding Tapestry POST_CREATION points:',
        pointsError,
      )
    }

    res.status(201).json({
      success: true,
      data: {
        post: result,
        tapestry_content: content,
      },
    })
  } catch (error: any) {
    console.error('[createPostV2] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred creating the post',
    })
  }
}

export const createCommentV2 = async (
  req: Request<{}, {}, CreateCommentV2Dto>,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id

    const { success, data, error } = await createCommentV2Schema.safeParseAsync(
      {
        ...req.body,
        user_id: userId,
      },
    )

    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
      return
    }

    // For v2, treat post_id as the Tapestry content id
    const tapestryContentId = data.post_id

    const { tapestryProfileId } = await ensureTapestryProfileForUser(userId)

    const properties: { key: string; value: string | number | boolean }[] = [
      ...(data.media?.length
        ? [{ key: 'media', value: JSON.stringify(data.media) } as const]
        : []),
      ...(data.properties ?? []),
    ]

    const tapestryComment = await TapestryService.createComment({
      profileId: tapestryProfileId,
      contentId: tapestryContentId,
      text: data.text,
      parentCommentId: (data as any).parent_id,
      properties,
    })

    await PointsService.awardPoints(userId, 'POST_COMMENT', {
      tapestry_content_id: tapestryContentId,
      tapestry_comment_id: (tapestryComment as any).id,
    })

    res.status(201).json({
      success: true,
      data: tapestryComment,
    })
  } catch (error: any) {
    console.error('[createCommentV2] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred creating the comment',
    })
  }
}

export const likePostV2 = async (
  req: Request<{ post_id: string }, {}, LikePostV2Dto>,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id
    const postId = req.params.post_id || req.body.post_id

    const { success, data, error } = await likePostV2Schema.safeParseAsync({
      post_id: postId,
    })

    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
      return
    }

    // For v2, treat post_id as the Tapestry content/node id
    const tapestryContentId = data.post_id

    const { tapestryProfileId } = await ensureTapestryProfileForUser(userId)

    await TapestryService.likeNode({
      profileId: tapestryProfileId,
      nodeId: tapestryContentId,
    })

    await PointsService.awardPoints(userId, 'POST_LIKE', {
      tapestry_content_id: tapestryContentId,
    })

    res.status(200).json({
      success: true,
      data: {
        liked: true,
        tapestry_content_id: tapestryContentId,
      },
    })
  } catch (error: any) {
    console.error('[likePostV2] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred liking the post',
    })
  }
}

export const likeNodeV2 = async (
  req: Request<{ node_id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id
    const nodeId = req.params.node_id

    if (!nodeId) {
      res.status(400).json({
        success: false,
        error: 'node_id path parameter is required',
      })
      return
    }

    const { tapestryProfileId } = await ensureTapestryProfileForUser(userId)

    await TapestryService.likeNode({
      profileId: tapestryProfileId,
      nodeId,
    })

    res.status(200).json({
      success: true,
      data: {
        liked: true,
        node_id: nodeId,
      },
    })
  } catch (error: any) {
    console.error('[likeNodeV2] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred liking the node',
    })
  }
}

export const unlikeNodeV2 = async (
  req: Request<{ node_id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id
    const nodeId = req.params.node_id

    if (!nodeId) {
      res.status(400).json({
        success: false,
        error: 'node_id path parameter is required',
      })
      return
    }

    const { tapestryProfileId } = await ensureTapestryProfileForUser(userId)

    await TapestryService.unlikeNode({
      profileId: tapestryProfileId,
      nodeId,
    })

    res.status(200).json({
      success: true,
      data: {
        unliked: true,
        node_id: nodeId,
      },
    })
  } catch (error: any) {
    console.error('[unlikeNodeV2] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred unliking the node',
    })
  }
}

export const unlikePostV2 = async (
  req: Request<{ post_id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const postId = req.params.post_id
    if (!postId) {
      res.status(400).json({ success: false, error: 'Post id required' })
      return
    }
    const userId = req.user!.id
    const { tapestryProfileId } = await ensureTapestryProfileForUser(userId)
    await TapestryService.unlikeNode({
      profileId: tapestryProfileId,
      nodeId: postId,
    })
    res.status(200).json({ success: true, unliked: true })
  } catch (error: any) {
    console.error('[unlikePostV2] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred unliking the post',
    })
  }
}

export const deletePostV2 = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const contentId = req.params.id
    if (!contentId) {
      res.status(400).json({ success: false, error: 'Content id required' })
      return
    }
    await TapestryService.deleteContent(contentId)
    res.status(200).json({ success: true, deleted: true })
  } catch (error: any) {
    console.error('[deletePostV2] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred deleting the post',
    })
  }
}

export const deleteCommentV2 = async (
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const commentId = req.params.id
    if (!commentId) {
      res.status(400).json({ success: false, error: 'Comment id required' })
      return
    }
    await TapestryService.deleteComment(commentId)
    res.status(200).json({ success: true, deleted: true })
  } catch (error: any) {
    console.error('[deleteCommentV2] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred deleting the comment',
    })
  }
}

export const getSuggestedProfilesV2 = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const identifier =
      (req.query.identifier as string) ||
      (await (async () => {
        const userId = req.user!.id
        const { tapestryProfileId } = await ensureTapestryProfileForUser(userId)
        return tapestryProfileId
      })())
    const result = await TapestryService.getSuggestedProfiles(identifier)
    // SuggestedDetailData is Record<string, { profile: { id, username, bio?, image? }, ... }>
    const list = Object.values(
      (result as Record<
        string,
        {
          profile: {
            id: string
            username: string
            bio?: string | null
            image?: string | null
          }
        }
      >) ?? {},
    )
    const mapped = list.map((item) => ({
      id: item.profile.id,
      username: item.profile.username,
      bio: item.profile.bio,
      image: item.profile.image,
    }))
    res.status(200).json({ success: true, data: { suggested: mapped } })
  } catch (error: any) {
    console.error('[getSuggestedProfilesV2] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred fetching suggested profiles',
    })
  }
  3
}

export const getActivityFeedV2 = async (
  req: Request<{ username: string }, {}, { page?: string; pageSize?: string }>,
  res: Response,
): Promise<void> => {
  try {
    const username = req.params.username
    if (!username) {
      res.status(400).json({
        success: false,
        error: 'username path parameter is required',
      })
      return
    }

    const page = req.query.page as string | undefined
    const pageSize = req.query.pageSize as string | undefined
    const feed = await TapestryService.getActivityFeed({
      username,
      page,
      pageSize,
    })
    res.status(200).json({ success: true, data: feed })
  } catch (error: any) {
    console.error('[getActivityFeedV2] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred fetching activity feed',
    })
  }
}

export const getSwapActivityV2 = async (
  req: Request<
    { username: string },
    {},
    { page?: string; pageSize?: string; tokenAddress?: string }
  >,
  res: Response,
): Promise<void> => {
  try {
    const username = req.params.username
    const page = req.query.page as string | undefined
    const pageSize = req.query.pageSize as string | undefined
    const tokenAddress = req.query.tokenAddress as string | undefined
    const result = await TapestryService.getSwapActivity({
      username,
      page,
      pageSize,
      tokenAddress,
    })
    res.status(200).json({ success: true, data: result })
  } catch (error: any) {
    console.error('[getSwapActivityV2] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred fetching swap activity',
    })
  }
}

export const getGlobalActivityV2 = async (
  req: Request<{}, {}, { page?: string; pageSize?: string }>,
  res: Response,
): Promise<void> => {
  try {
    const page = req.query.page as string | undefined
    const pageSize = req.query.pageSize as string | undefined
    const result = await TapestryService.getGlobalActivity({ page, pageSize })
    res.status(200).json({ success: true, data: result })
  } catch (error: any) {
    console.error('[getGlobalActivityV2] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred fetching global activity',
    })
  }
}

export const recomputeCredibilityScoresV2 = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const now = new Date()
    await CredibilityService.recomputeAll(now)
    res.status(200).json({
      success: true,
      data: {
        recomputedAt: now.toISOString(),
      },
    })
  } catch (error: any) {
    console.error('[recomputeCredibilityScoresV2] Error:', error)
    res.status(500).json({
      success: false,
      error:
        error.message ||
        'An error occurred recomputing credibility scores for all users',
    })
  }
}

export const getNodeLikersV2 = async (
  req: Request<{ node_id: string }>,
  res: Response,
): Promise<void> => {
  try {
    const nodeId = req.params.node_id
    if (!nodeId) {
      res.status(400).json({
        success: false,
        error: 'node_id path parameter is required',
      })
      return
    }

    const result = await TapestryService.getNodeLikers(nodeId)

    // Shape result into lightweight profile list when possible
    const likers =
      (result as any)?.profiles ??
      (Array.isArray(result) ? result : (result as any)?.data ?? result)

    res.status(200).json({
      success: true,
      data: {
        node_id: nodeId,
        likers,
      },
    })
  } catch (error: any) {
    console.error('[getNodeLikersV2] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred fetching node likers',
    })
  }
}

export const getTokenOwnersV2 = async (
  req: Request<{ token_address: string }>,
  res: Response,
): Promise<void> => {
  try {
    const tokenAddress = req.params.token_address
    if (!tokenAddress) {
      res.status(400).json({
        success: false,
        error: 'token_address path parameter is required',
      })
      return
    }

    const owners = await TapestryService.getTokenOwners(tokenAddress)

    res.status(200).json({
      success: true,
      data: owners,
    })
  } catch (error: any) {
    console.error('[getTokenOwnersV2] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred fetching token owners',
    })
  }
}

const TAPESTRY_PLATFORM = 'trenches'

function isSolMint(mint: string): boolean {
  return mint === NATIVE_SOL_MINT || mint === WRAPPED_SOL_MINT
}

export const logTradeV2 = async (
  req: Request<{}, {}, LogTradeV2Dto>,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id

    const { success, data, error } = await logTradeV2Schema.safeParseAsync(
      req.body,
    )

    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
      return
    }

    const authWallet =
      (req.user as any).wallet?.address ?? req.user!.wallet?.address
    const walletAddress = data.wallet_address ?? authWallet
    if (!walletAddress) {
      res.status(400).json({
        success: false,
        error: 'Wallet address is required for trade logging',
      })
      return
    }

    const { tapestryProfileId } = await ensureTapestryProfileForUser(userId)

    const inputAmountNum = parseFloat(data.amount_in)
    const outputAmountNum = parseFloat(data.amount_out)
    const timestamp = Date.now()

    const tradeType: 'buy' | 'sell' =
      data.trade_type ??
      (isSolMint(data.token_in_mint) ? 'sell' : 'buy')

    const usdIn = data.usd_value_in ?? 0
    const usdOut = data.usd_value_out ?? 0
    const solPrice = data.sol_price
    let inputValueSOL = data.input_value_sol
    let outputValueSOL = data.output_value_sol
    if (
      (inputValueSOL == null || outputValueSOL == null) &&
      typeof solPrice === 'number' &&
      solPrice > 0
    ) {
      if (inputValueSOL == null && usdIn >= 0)
        inputValueSOL = usdIn / solPrice
      if (outputValueSOL == null && usdOut >= 0)
        outputValueSOL = usdOut / solPrice
    }
    if (inputValueSOL == null) inputValueSOL = 0
    if (outputValueSOL == null) outputValueSOL = 0

    await TapestryService.logTrade({
      transactionSignature: data.tx_signature,
      walletAddress: data.wallet_address ?? walletAddress,
      inputMint: data.token_in_mint,
      outputMint: data.token_out_mint,
      inputAmount: Number.isFinite(inputAmountNum) ? inputAmountNum : 0,
      outputAmount: Number.isFinite(outputAmountNum) ? outputAmountNum : 0,
      inputValueSOL,
      outputValueSOL,
      timestamp,
      tradeType,
      platform: TAPESTRY_PLATFORM,
      profileId: tapestryProfileId,
      inputValueUSD: data.usd_value_in,
      outputValueUSD: data.usd_value_out,
      solPrice: data.sol_price,
      source: data.source,
      slippage: data.slippage,
      priorityFee: data.priority_fee,
      sourceWallet: data.source_wallet,
      sourceTransactionId: data.source_transaction_id,
    })

    res.status(201).json({
      success: true,
      data: {
        logged: true,
      },
    })
  } catch (err: any) {
    console.error('[logTradeV2] Error:', err)
    res.status(500).json({
      success: false,
      error: err.message || 'An error occurred logging the trade',
    })
  }
}
