import { Env } from '@/utils/constants/Env'
import { tapestryClient } from '@/utils/platforms.util'
import { ContentType } from 'socialfi'

export type TapestryExecutionOption =
  | 'FAST_UNCONFIRMED'
  | 'QUICK_SIGNATURE'
  | 'CONFIRMED_AND_PARSED'

export interface TapestryProfileInput {
  walletAddress: string
  username: string
  displayName?: string
  avatarUrl?: string | null
  bio?: string | null
  properties?: { key: string; value: string | number | boolean }[]
}

export interface TapestryPostInput {
  profileId: string
  contentId: string
  properties?: { key: string; value: string | number | boolean }[]
}

export interface TapestryCommentInput {
  profileId: string
  contentId: string
  text: string
  parentCommentId?: string
  targetProfileId?: string
  properties?: { key: string; value: string | number | boolean }[]
}

export interface TapestryLikeInput {
  profileId: string
  nodeId: string
}

export interface TapestryFollowInput {
  followerProfileId: string
  followeeProfileId: string
}

/** Payload for Tapestry POST /trades API (camelCase, required + optional) */
export interface TapestryLogTradeInput {
  transactionSignature: string
  walletAddress: string
  inputMint: string
  outputMint: string
  inputAmount: number
  outputAmount: number
  inputValueSOL: number
  outputValueSOL: number
  timestamp: number
  tradeType: 'buy' | 'sell'
  platform: string
  profileId?: string
  inputValueUSD?: number
  outputValueUSD?: number
  solPrice?: number
  source?: string
  slippage?: number
  priorityFee?: number
  sourceWallet?: string
  sourceTransactionId?: string
}

export interface TapestryServiceError {
  code: string
  status?: number
  message: string
  details?: any
}

function normalizeError(error: any, defaultCode: string): TapestryServiceError {
  if (!error) {
    return {
      code: defaultCode,
      message: 'Unknown error from Tapestry',
    }
  }

  const status = error.status ?? error.response?.status
  const message =
    error.message ??
    error.response?.data?.message ??
    error.response?.data?.error ??
    String(error)

  return {
    code: defaultCode,
    status,
    message,
    details: error.response?.data ?? error,
  }
}

export class TapestryService {
  static async findOrCreateProfile(input: TapestryProfileInput) {
    try {
      const {
        walletAddress,
        username,
        displayName,
        avatarUrl,
        bio,
        properties,
      } = input

      const result = await tapestryClient.profiles.findOrCreateCreate(
        { apiKey: Env.TAPESTRY_API_KEY },
        {
          walletAddress,
          username,
          image: avatarUrl ?? undefined,
          bio: bio ?? undefined,
          properties,
        },
      )

      return result.profile
    } catch (error: any) {
      console.error('error findOrCreateProfile failed', error)
      throw normalizeError(error, 'TAPESTRY_FIND_OR_CREATE_PROFILE_FAILED')
    }
  }

  static async updateProfile(
    profileId: string,
    data: Partial<TapestryProfileInput>,
  ) {
    try {
      const { username, displayName, avatarUrl, bio, properties } = data

      return await tapestryClient.profiles.profilesUpdate(
        { id: profileId, apiKey: Env.TAPESTRY_API_KEY },
        {
          username,
          image: avatarUrl ?? undefined,
          bio: bio ?? undefined,
          properties,
        },
      )
    } catch (error: any) {
      throw normalizeError(error, 'TAPESTRY_UPDATE_PROFILE_FAILED')
    }
  }

  static async followProfile(input: TapestryFollowInput) {
    try {
      const { followerProfileId, followeeProfileId } = input

      return await tapestryClient.followers.postFollowers(
        { apiKey: Env.TAPESTRY_API_KEY },
        {
          startId: followerProfileId,
          endId: followeeProfileId,
        },
      )
    } catch (error: any) {
      throw normalizeError(error, 'TAPESTRY_FOLLOW_PROFILE_FAILED')
    }
  }

  static async unfollowProfile(input: TapestryFollowInput) {
    try {
      const { followerProfileId, followeeProfileId } = input

      return await tapestryClient.followers.removeCreate(
        { apiKey: Env.TAPESTRY_API_KEY },
        {
          startId: followerProfileId,
          endId: followeeProfileId,
        },
      )
    } catch (error: any) {
      throw normalizeError(error, 'TAPESTRY_UNFOLLOW_PROFILE_FAILED')
    }
  }

  static async findOrCreateContent(input: TapestryPostInput) {
    try {
      const { profileId, contentId, properties } = input

      return await tapestryClient.contents.findOrCreateCreate(
        { apiKey: Env.TAPESTRY_API_KEY },
        {
          id: contentId,
          profileId,
          properties,
        },
      )
    } catch (error: any) {
      throw normalizeError(error, 'TAPESTRY_FIND_OR_CREATE_CONTENT_FAILED')
    }
  }

  static async createComment(input: TapestryCommentInput) {
    try {
      const {
        profileId,
        contentId,
        text,
        parentCommentId,
        targetProfileId,
        properties,
      } = input
      console.log('input', input)
      return await tapestryClient.comments.commentsCreate(
        { apiKey: Env.TAPESTRY_API_KEY },
        {
          profileId,
          contentId,
          text,
          // commentId: parentCommentId,
          // targetProfileId,
          properties,
        },
      )
    } catch (error: any) {
      console.error('error createComment failed', error?.response?.data)
      throw normalizeError(error, 'TAPESTRY_CREATE_COMMENT_FAILED')
    }
  }

  static async likeNode(input: TapestryLikeInput) {
    try {
      const { profileId, nodeId } = input
      return await tapestryClient.likes.likesCreate(
        { nodeId, apiKey: Env.TAPESTRY_API_KEY },
        {
          startId: profileId,
        },
      )
    } catch (error: any) {
      throw normalizeError(error, 'TAPESTRY_LIKE_NODE_FAILED')
    }
  }

  static async unlikeNode(input: TapestryLikeInput) {
    try {
      const { profileId, nodeId } = input

      return await tapestryClient.likes.likesDelete(
        { nodeId, apiKey: Env.TAPESTRY_API_KEY },
        {
          startId: profileId,
        },
      )
    } catch (error: any) {
      throw normalizeError(error, 'TAPESTRY_UNLIKE_NODE_FAILED')
    }
  }

  static async deleteContent(contentId: string) {
    try {
      return await tapestryClient.contents.contentsDelete({
        id: contentId,
        apiKey: Env.TAPESTRY_API_KEY,
      })
    } catch (error: any) {
      throw normalizeError(error, 'TAPESTRY_DELETE_CONTENT_FAILED')
    }
  }

  static async deleteComment(commentId: string) {
    try {
      return await tapestryClient.comments.commentsDelete({
        id: commentId,
        apiKey: Env.TAPESTRY_API_KEY,
      })
    } catch (error: any) {
      throw normalizeError(error, 'TAPESTRY_DELETE_COMMENT_FAILED')
    }
  }

  static async getProfileDetails(profileId: string) {
    try {
      return await tapestryClient.profiles.profilesDetail({
        id: profileId,
        apiKey: Env.TAPESTRY_API_KEY,
      })
    } catch (error: any) {
      throw normalizeError(error, 'TAPESTRY_GET_PROFILE_DETAILS_FAILED')
    }
  }

  static async getSuggestedProfiles(identifier: string) {
    try {
      return await tapestryClient.profiles.suggestedDetail({
        identifier,
        apiKey: Env.TAPESTRY_API_KEY,
      })
    } catch (error: any) {
      throw normalizeError(error, 'TAPESTRY_GET_SUGGESTED_PROFILES_FAILED')
    }
  }

  static async getActivityFeed(params: {
    username: string
    page?: string
    pageSize?: string
  }) {
    try {
      return await tapestryClient.activity.feedList({
        apiKey: Env.TAPESTRY_API_KEY,
        username: params.username,
        page: params.page,
        pageSize: params.pageSize,
      })
    } catch (error: any) {
      throw normalizeError(error, 'TAPESTRY_GET_ACTIVITY_FEED_FAILED')
    }
  }

  static async getSwapActivity(params?: {
    username?: string
    page?: string
    pageSize?: string
    tokenAddress?: string
  }) {
    try {
      return await tapestryClient.activity.swapList({
        apiKey: Env.TAPESTRY_API_KEY,
        username: params?.username,
        page: params?.page,
        pageSize: params?.pageSize,
        tokenAddress: params?.tokenAddress,
      })
    } catch (error: any) {
      throw normalizeError(error, 'TAPESTRY_GET_SWAP_ACTIVITY_FAILED')
    }
  }

  static async getNodeLikers(nodeId: string) {
    try {
      return await tapestryClient.request({
        path: `/likes/${nodeId}`,
        type: ContentType.Json,
        method: 'GET',
        query: {
          apiKey: Env.TAPESTRY_API_KEY,
        },
      })
    } catch (error: any) {
      throw normalizeError(error, 'TAPESTRY_GET_NODE_LIKERS_FAILED')
    }
  }

  static async getTokenOwners(tokenAddress: string) {
    try {
      return await tapestryClient.profiles.tokenOwnersDetail({
        tokenAddress,
        apiKey: Env.TAPESTRY_API_KEY,
      })
    } catch (error: any) {
      throw normalizeError(error, 'TAPESTRY_GET_TOKEN_OWNERS_FAILED')
    }
  }

  static async getGlobalActivity(params?: {
    page?: string
    pageSize?: string
  }) {
    try {
      return await tapestryClient.request({
        path: '/activity/global',
        type: ContentType.Json,
        method: 'GET',
        query: {
          apiKey: Env.TAPESTRY_API_KEY,
          page: params?.page,
          pageSize: params?.pageSize,
        },
      })
    } catch (error: any) {
      throw normalizeError(error, 'TAPESTRY_GET_GLOBAL_ACTIVITY_FAILED')
    }
  }

  static async logTrade(payload: TapestryLogTradeInput) {
    try {
      const body: Record<string, unknown> = {
        transactionSignature: payload.transactionSignature,
        walletAddress: payload.walletAddress,
        inputMint: payload.inputMint,
        outputMint: payload.outputMint,
        inputAmount: payload.inputAmount,
        outputAmount: payload.outputAmount,
        inputValueSOL: payload.inputValueSOL,
        outputValueSOL: payload.outputValueSOL,
        timestamp: payload.timestamp,
        tradeType: payload.tradeType,
        platform: payload.platform,
      }
      if (payload.profileId != null) body.profileId = payload.profileId
      if (payload.inputValueUSD != null)
        body.inputValueUSD = payload.inputValueUSD
      if (payload.outputValueUSD != null)
        body.outputValueUSD = payload.outputValueUSD
      if (payload.solPrice != null) body.solPrice = payload.solPrice
      if (payload.source != null) body.source = payload.source
      if (payload.slippage != null) body.slippage = payload.slippage
      if (payload.priorityFee != null) body.priorityFee = payload.priorityFee
      if (payload.sourceWallet != null) body.sourceWallet = payload.sourceWallet
      if (payload.sourceTransactionId != null)
        body.sourceTransactionId = payload.sourceTransactionId
      console.log('body', body)
      return await tapestryClient.request({
        path: '/trades',
        type: ContentType.Json,
        method: 'POST',
        query: {
          apiKey: Env.TAPESTRY_API_KEY,
        },
        body,
      })
    } catch (error: any) {
      throw normalizeError(error, 'TAPESTRY_LOG_TRADE_FAILED')
    }
  }
}
