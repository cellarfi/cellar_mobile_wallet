import {
  SwapActivityResponse,
  User,
} from '@/types'
import { Post } from '@/types/posts.interface'
import { apiResponse, httpRequest } from '../api.helpers'

type LoadingSetter = (loading: boolean) => void

interface CreateCommentInput {
  postId: string
  text: string
  parentId?: string
  media?: string[]
}

interface ActivityQuery {
  page?: string
  pageSize?: string
}

interface SwapActivityQuery extends ActivityQuery {
  tokenAddress?: string
}

export const createTapestryClient = (options?: {
  setLoading?: LoadingSetter
}) => {
  const api = httpRequest(options?.setLoading)

  return {
    // --- Profile registration ---
    registerTapestryProfile: async () => {
      try {
        const res = await api.post('/users/tapestry/register')
        return apiResponse(true, 'Tapestry profile registered', res.data?.data)
      } catch (err: any) {
        return apiResponse(
          false,
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Error registering Tapestry profile',
          undefined,
        )
      }
    },

    // --- Follow graph (v2) ---
    followUser: async (targetTagName: string) => {
      try {
        const res = await api.post('/v2/users/follow', {
          target_tag_name: targetTagName,
        })
        return apiResponse(true, 'Followed user (v2)', res.data?.data)
      } catch (err: any) {
        return apiResponse(
          false,
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Error following user (v2)',
          undefined,
        )
      }
    },

    unfollowUser: async (targetTagName: string) => {
      try {
        const res = await api.post('/v2/users/unfollow', {
          target_tag_name: targetTagName,
        })
        return apiResponse(true, 'Unfollowed user (v2)', res.data?.data)
      } catch (err: any) {
        return apiResponse(
          false,
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Error unfollowing user (v2)',
          undefined,
        )
      }
    },

    // --- Posts (v2) ---
    createPost: async (payload: any) => {
      try {
        const res = await api.post('/v2/posts', payload)
        // Backend returns combined local + Tapestry payload; we only need success/data
        return apiResponse<Post | any>(
          true,
          'Post created (v2)',
          res.data?.data,
        )
      } catch (err: any) {
        return apiResponse<Post | any>(
          false,
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Error creating post (v2)',
          undefined,
        )
      }
    },

    deletePost: async (tapestryContentId: string) => {
      try {
        const res = await api.delete(`/v2/posts/${tapestryContentId}`)
        return apiResponse(true, 'Post deleted (v2)', res.data?.data)
      } catch (err: any) {
        return apiResponse(
          false,
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Error deleting post (v2)',
          undefined,
        )
      }
    },

    // --- Comments (v2) ---
    createComment: async ({
      postId,
      text,
      parentId,
      media,
    }: CreateCommentInput) => {
      try {
        const res = await api.post(`/v2/posts/${postId}/comments`, {
          post_id: postId,
          text,
          parent_id: parentId,
          media,
        })
        return apiResponse(true, 'Comment created (v2)', res.data?.data)
      } catch (err: any) {
        return apiResponse(
          false,
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Error creating comment (v2)',
          undefined,
        )
      }
    },

    deleteComment: async (tapestryCommentId: string) => {
      try {
        const res = await api.delete(`/v2/comments/${tapestryCommentId}`)
        return apiResponse(true, 'Comment deleted (v2)', res.data?.data)
      } catch (err: any) {
        return apiResponse(
          false,
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Error deleting comment (v2)',
          undefined,
        )
      }
    },

    // --- Likes on posts (v2, using Tapestry content/node id) ---
    likePost: async (tapestryContentId: string) => {
      try {
        const res = await api.post(`/v2/posts/${tapestryContentId}/like`, {
          post_id: tapestryContentId,
        })
        return apiResponse(true, 'Post liked (v2)', res.data?.data)
      } catch (err: any) {
        return apiResponse(
          false,
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Error liking post (v2)',
          undefined,
        )
      }
    },

    unlikePost: async (tapestryContentId: string) => {
      try {
        const res = await api.delete(`/v2/posts/${tapestryContentId}/like`, {
          data: { post_id: tapestryContentId },
        })
        return apiResponse(true, 'Post unliked (v2)', res.data?.data)
      } catch (err: any) {
        return apiResponse(
          false,
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Error unliking post (v2)',
          undefined,
        )
      }
    },

    // --- Generic likes on Tapestry nodes (v2) ---
    likeNode: async (nodeId: string) => {
      try {
        const res = await api.post(`/v2/likes/${nodeId}`)
        return apiResponse(true, 'Node liked (v2)', res.data?.data)
      } catch (err: any) {
        return apiResponse(
          false,
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Error liking node (v2)',
          undefined,
        )
      }
    },

    unlikeNode: async (nodeId: string) => {
      try {
        const res = await api.delete(`/v2/likes/${nodeId}`)
        return apiResponse(true, 'Node unliked (v2)', res.data?.data)
      } catch (err: any) {
        return apiResponse(
          false,
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Error unliking node (v2)',
          undefined,
        )
      }
    },

    getNodeLikers: async (nodeId: string) => {
      try {
        const res = await api.get(`/v2/likes/${nodeId}`)
        return apiResponse(true, 'Fetched node likers (v2)', res.data?.data)
      } catch (err: any) {
        return apiResponse(
          false,
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Error fetching node likers (v2)',
          undefined,
        )
      }
    },

    // --- Token owners (v2) ---
    getTokenOwners: async (tokenAddress: string) => {
      try {
        const res = await api.get(`/v2/tokens/${tokenAddress}/owners`)
        return apiResponse(true, 'Fetched token owners (v2)', res.data?.data)
      } catch (err: any) {
        return apiResponse(
          false,
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Error fetching token owners (v2)',
          undefined,
        )
      }
    },

    // --- Profile with Tapestry social counts (v2) ---
    getUserByTagNameV2: async (tagName: string) => {
      try {
        const res = await api.get(
          `/users/v2/tag_name/${encodeURIComponent(tagName)}`,
        )
        return apiResponse<User>(
          true,
          'User fetched (v2)',
          res.data?.data as User,
        )
      } catch (err: any) {
        return apiResponse<User>(
          false,
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Error fetching user (v2)',
          undefined,
        )
      }
    },

    // --- Suggested profiles (v2) ---
    getSuggestedProfiles: async () => {
      try {
        const res = await api.get('/v2/profiles/suggested')
        const suggested = res.data?.data?.suggested ?? res.data?.data ?? []
        return apiResponse<any[]>(
          true,
          'Suggested profiles fetched (v2)',
          suggested,
        )
      } catch (err: any) {
        return apiResponse<any[]>(
          false,
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Error fetching suggested profiles (v2)',
          [],
        )
      }
    },

    // --- Activity feeds (v2) ---
    getActivityFeed: async (username: string, query?: ActivityQuery) => {
      try {
        const res = await api.get(
          `/v2/activity/feed/${encodeURIComponent(username)}`,
          {
            params: query,
          },
        )
        return apiResponse(true, 'Activity feed fetched (v2)', res.data?.data)
      } catch (err: any) {
        return apiResponse(
          false,
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Error fetching activity feed (v2)',
          undefined,
        )
      }
    },

    getSwapActivity: async (username: string, query?: SwapActivityQuery) => {
      try {
        const res = await api.get(
          `/v2/activity/swap/${encodeURIComponent(username)}`,
          {
            params: query,
          },
        )
        return apiResponse<SwapActivityResponse>(
          true,
          'Swap activity fetched (v2)',
          res.data?.data as SwapActivityResponse | undefined,
        )
      } catch (err: any) {
        return apiResponse<SwapActivityResponse>(
          false,
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Error fetching swap activity (v2)',
          undefined,
        )
      }
    },

    getGlobalActivity: async (query?: ActivityQuery) => {
      try {
        const res = await api.get('/v2/activity/global', {
          params: query,
        })
        return apiResponse(true, 'Global activity fetched (v2)', res.data?.data)
      } catch (err: any) {
        return apiResponse(
          false,
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Error fetching global activity (v2)',
          undefined,
        )
      }
    },

    // --- Trade logging (v2) ---
    logTrade: async (payload: {
      tokenInMint: string
      tokenOutMint: string
      amountIn: string
      amountOut: string
      txSignature: string
      usdValueIn?: number
      usdValueOut?: number
      walletAddress?: string
      inputValueSol?: number
      outputValueSol?: number
      solPrice?: number
      tradeType?: 'buy' | 'sell'
      slippage?: number
      priorityFee?: number
      source?: string
      sourceWallet?: string
      sourceTransactionId?: string
    }) => {
      try {
        const body: Record<string, unknown> = {
          token_in_mint: payload.tokenInMint,
          token_out_mint: payload.tokenOutMint,
          amount_in: payload.amountIn,
          amount_out: payload.amountOut,
          tx_signature: payload.txSignature,
          usd_value_in: payload.usdValueIn,
          usd_value_out: payload.usdValueOut,
        }
        if (payload.walletAddress != null) body.wallet_address = payload.walletAddress
        if (payload.inputValueSol != null) body.input_value_sol = payload.inputValueSol
        if (payload.outputValueSol != null)
          body.output_value_sol = payload.outputValueSol
        if (payload.solPrice != null) body.sol_price = payload.solPrice
        if (payload.tradeType != null) body.trade_type = payload.tradeType
        if (payload.slippage != null) body.slippage = payload.slippage
        if (payload.priorityFee != null) body.priority_fee = payload.priorityFee
        if (payload.source != null) body.source = payload.source
        if (payload.sourceWallet != null) body.source_wallet = payload.sourceWallet
        if (payload.sourceTransactionId != null)
          body.source_transaction_id = payload.sourceTransactionId

        const res = await api.post('/v2/trades', body)
        return apiResponse(true, 'Trade logged (v2)', res.data?.data)
      } catch (err: any) {
        return apiResponse(
          false,
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            'Error logging trade (v2)',
          undefined,
        )
      }
    },
  }
}

// Default shared client instance using standard ENV + Privy JWT handling
export const tapestryRequests = createTapestryClient()
