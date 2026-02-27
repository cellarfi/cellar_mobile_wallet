import axios, { AxiosInstance } from 'axios'
import { apiResponse } from '../api.helpers'

export interface TapestryClientOptions {
  baseURL?: string
  token?: string
}

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

const createAxiosInstance = ({ baseURL, token }: TapestryClientOptions) => {
  const api: AxiosInstance = axios.create({
    baseURL: baseURL || DEFAULT_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  return api
}

export const createTapestryClient = (options: TapestryClientOptions = {}) => {
  const api = createAxiosInstance(options)

  return {
    /**
     * Register the current authenticated user with Tapestry
     * POST /users/tapestry/register
     */
    registerTapestryProfile: async () => {
      try {
        const res = await api.post('/users/tapestry/register')
        return apiResponse(true, 'Registered Tapestry profile', res.data)
      } catch (err: any) {
        console.log(
          '[tapestryRequests] Error registering Tapestry profile:',
          err?.response?.data,
        )
        return apiResponse(
          false,
          err?.response?.data?.error || err?.message || 'Error occurred.',
          err,
        )
      }
    },

    /**
     * Follow a user (v2)
     * POST /v2/users/follow
     */
    followUser: async (body: {
      target_tag_name?: string
      target_user_id?: string
    }) => {
      try {
        const res = await api.post('/v2/users/follow', body)
        return apiResponse(true, 'Followed user (v2)', res.data)
      } catch (err: any) {
        console.log('[tapestryRequests] Error following user:', err?.response?.data)
        return apiResponse(
          false,
          err?.response?.data?.error || err?.message || 'Error occurred.',
          err,
        )
      }
    },

    /**
     * Unfollow a user (v2)
     * POST /v2/users/unfollow
     */
    unfollowUser: async (body: {
      target_tag_name?: string
      target_user_id?: string
    }) => {
      try {
        const res = await api.post('/v2/users/unfollow', body)
        return apiResponse(true, 'Unfollowed user (v2)', res.data)
      } catch (err: any) {
        console.log(
          '[tapestryRequests] Error unfollowing user:',
          err?.response?.data,
        )
        return apiResponse(
          false,
          err?.response?.data?.error || err?.message || 'Error occurred.',
          err,
        )
      }
    },

    /**
     * Create a Tapestry-backed post (v2)
     * POST /v2/posts
     */
    createPost: async (body: {
      content: string
      post_type: string
      media?: string[]
      [key: string]: any
    }) => {
      try {
        const res = await api.post('/v2/posts', body)
        return apiResponse(
          true,
          'Created Tapestry v2 post',
          res.data?.data?.tapestry_content ?? res.data,
        )
      } catch (err: any) {
        console.log('[tapestryRequests] Error creating post:', err?.response?.data)
        return apiResponse(
          false,
          err?.response?.data?.error || err?.message || 'Error occurred.',
          err,
        )
      }
    },

    /**
     * Create a comment on a Tapestry content (v2)
     * POST /v2/posts/:postId/comments
     */
    createComment: async (
      postId: string,
      body: {
        post_id: string
        text: string
        media?: string[]
        properties?: { key: string; value: string | number | boolean }[]
      },
    ) => {
      try {
        const res = await api.post(`/v2/posts/${postId}/comments`, body)
        return apiResponse(true, 'Created Tapestry v2 comment', res.data)
      } catch (err: any) {
        console.log(
          '[tapestryRequests] Error creating comment:',
          err?.response?.data,
        )
        return apiResponse(
          false,
          err?.response?.data?.error || err?.message || 'Error occurred.',
          err,
        )
      }
    },

    /**
     * Like a Tapestry content (v2)
     * POST /v2/posts/:postId/like
     */
    likePost: async (postId: string) => {
      try {
        const res = await api.post(`/v2/posts/${postId}/like`, {
          post_id: postId,
        })
        return apiResponse(true, 'Liked Tapestry v2 post', res.data)
      } catch (err: any) {
        console.log('[tapestryRequests] Error liking post:', err?.response?.data)
        return apiResponse(
          false,
          err?.response?.data?.error || err?.message || 'Error occurred.',
          err,
        )
      }
    },

    /**
     * Unlike a Tapestry content (v2)
     * DELETE /v2/posts/:postId/like
     */
    unlikePost: async (postId: string) => {
      try {
        const res = await api.delete(`/v2/posts/${postId}/like`)
        return apiResponse(true, 'Unliked Tapestry v2 post', res.data)
      } catch (err: any) {
        console.log('[tapestryRequests] Error unliking post:', err?.response?.data)
        return apiResponse(
          false,
          err?.response?.data?.error || err?.message || 'Error occurred.',
          err,
        )
      }
    },

    /**
     * Delete a Tapestry comment (v2)
     * DELETE /v2/comments/:commentId
     */
    deleteComment: async (commentId: string) => {
      try {
        const res = await api.delete(`/v2/comments/${commentId}`)
        return apiResponse(true, 'Deleted Tapestry v2 comment', res.data)
      } catch (err: any) {
        console.log(
          '[tapestryRequests] Error deleting comment:',
          err?.response?.data,
        )
        return apiResponse(
          false,
          err?.response?.data?.error || err?.message || 'Error occurred.',
          err,
        )
      }
    },

    /**
     * Delete a Tapestry content/post (v2)
     * DELETE /v2/posts/:contentId
     */
    deletePost: async (contentId: string) => {
      try {
        const res = await api.delete(`/v2/posts/${contentId}`)
        return apiResponse(true, 'Deleted Tapestry v2 post', res.data)
      } catch (err: any) {
        console.log('[tapestryRequests] Error deleting post:', err?.response?.data)
        return apiResponse(
          false,
          err?.response?.data?.error || err?.message || 'Error occurred.',
          err,
        )
      }
    },

    /**
     * Get profile by tag_name (v2, enriched with Tapestry socialCounts)
     * GET /users/v2/tag_name/:tagName
     */
    getProfileByTagNameV2: async (tagName: string) => {
      try {
        const res = await api.get(`/users/v2/tag_name/${tagName}`)
        return apiResponse(
          true,
          'Fetched v2 user profile by tag_name',
          res.data,
        )
      } catch (err: any) {
        console.log(
          '[tapestryRequests] Error fetching profile by tag_name:',
          err?.response?.data,
        )
        return apiResponse(
          false,
          err?.response?.data?.error || err?.message || 'Error occurred.',
          err,
        )
      }
    },

    /**
     * Get suggested profiles to follow (v2)
     * GET /v2/profiles/suggested
     */
    getSuggestedProfiles: async (identifier?: string) => {
      try {
        const res = await api.get('/v2/profiles/suggested', {
          params: identifier ? { identifier } : undefined,
        })
        return apiResponse(
          true,
          'Fetched suggested profiles',
          res.data?.data?.suggested ?? res.data,
        )
      } catch (err: any) {
        console.log(
          '[tapestryRequests] Error fetching suggested profiles:',
          err?.response?.data,
        )
        return apiResponse(
          false,
          err?.response?.data?.error || err?.message || 'Error occurred.',
          err,
        )
      }
    },

    /**
     * Get activity feed for a username (v2)
     * GET /v2/activity/feed/:username
     */
    getActivityFeed: async (
      username: string,
      params?: { page?: string; pageSize?: string },
    ) => {
      try {
        const res = await api.get(`/v2/activity/feed/${username}`, {
          params,
        })
        return apiResponse(true, 'Fetched activity feed', res.data)
      } catch (err: any) {
        console.log(
          '[tapestryRequests] Error fetching activity feed:',
          err?.response?.data,
        )
        return apiResponse(
          false,
          err?.response?.data?.error || err?.message || 'Error occurred.',
          err,
        )
      }
    },

    /**
     * Get swap activity from followed wallets or specific token (v2)
     * GET /v2/activity/swap/:username
     */
    getSwapActivity: async (
      username: string,
      params?: { page?: string; pageSize?: string; tokenAddress?: string },
    ) => {
      try {
        const res = await api.get(`/v2/activity/swap/${username}`, {
          params,
        })
        return apiResponse(true, 'Fetched swap activity', res.data)
      } catch (err: any) {
        console.log(
          '[tapestryRequests] Error fetching swap activity:',
          err?.response?.data,
        )
        return apiResponse(
          false,
          err?.response?.data?.error || err?.message || 'Error occurred.',
          err,
        )
      }
    },

    /**
     * Get global activity (v2)
     * GET /v2/activity/global
     */
    getGlobalActivity: async (params?: { page?: string; pageSize?: string }) => {
      try {
        const res = await api.get('/v2/activity/global', { params })
        return apiResponse(true, 'Fetched global activity', res.data)
      } catch (err: any) {
        console.log(
          '[tapestryRequests] Error fetching global activity:',
          err?.response?.data,
        )
        return apiResponse(
          false,
          err?.response?.data?.error || err?.message || 'Error occurred.',
          err,
        )
      }
    },
  }
}

