import { apiResponse, httpRequest } from '../api.helpers'

export interface BlockedUser {
  id: string
  blocker_id: string
  blocked_id: string
  created_at: string
  blocked_user?: {
    id: string
    display_name: string
    tag_name: string
    profile_picture_url: string | null
  }
}

export interface BlockStatus {
  is_blocked_by_viewer: boolean
  has_blocked_viewer: boolean
}

export const moderationRequests = {
  /**
   * Block a user
   * @param userId - The ID of the user to block
   */
  blockUser: async (userId: string) => {
    try {
      const api = httpRequest()
      const response = await api.post('/moderation/block', { user_id: userId })
      return apiResponse<{ id: string }>(
        true,
        response.data?.message || 'User blocked successfully',
        response.data?.data
      )
    } catch (err: any) {
      console.log('Error blocking user:', err?.response?.data)
      return apiResponse<{ id: string }>(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error blocking user',
        undefined
      )
    }
  },

  /**
   * Unblock a user
   * @param userId - The ID of the user to unblock
   */
  unblockUser: async (userId: string) => {
    try {
      const api = httpRequest()
      const response = await api.delete(`/moderation/block/${userId}`)
      return apiResponse(
        true,
        response.data?.message || 'User unblocked successfully',
        response.data?.data
      )
    } catch (err: any) {
      console.log('Error unblocking user:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error unblocking user',
        undefined
      )
    }
  },

  /**
   * Get list of blocked users
   */
  getBlockedUsers: async () => {
    try {
      const api = httpRequest()
      const response = await api.get('/moderation/blocks')
      return apiResponse<BlockedUser[]>(
        true,
        'Blocked users fetched successfully',
        response.data?.data
      )
    } catch (err: any) {
      console.log('Error fetching blocked users:', err?.response?.data)
      return apiResponse<BlockedUser[]>(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error fetching blocked users',
        []
      )
    }
  },

  /**
   * Get block status between current user and target user
   * @param userId - The ID of the user to check block status with
   */
  getBlockStatus: async (userId: string) => {
    try {
      const api = httpRequest()
      const response = await api.get(`/moderation/block-status/${userId}`)
      return apiResponse<BlockStatus>(
        true,
        'Block status fetched successfully',
        response.data?.data
      )
    } catch (err: any) {
      console.log('Error fetching block status:', err?.response?.data)
      return apiResponse<BlockStatus>(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error fetching block status',
        { is_blocked_by_viewer: false, has_blocked_viewer: false }
      )
    }
  },

  /**
   * Report a post
   * @param postId - The ID of the post to report
   * @param reason - The reason for reporting
   */
  reportPost: async (postId: string, reason: string) => {
    try {
      const api = httpRequest()
      const response = await api.post('/moderation/report/post', {
        post_id: postId,
        reason,
      })
      return apiResponse(
        true,
        response.data?.message || 'Post reported successfully',
        response.data?.data
      )
    } catch (err: any) {
      console.log('Error reporting post:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error reporting post',
        undefined
      )
    }
  },

  /**
   * Report a user
   * @param userId - The ID of the user to report
   * @param reason - The reason for reporting
   */
  reportUser: async (userId: string, reason: string) => {
    try {
      const api = httpRequest()
      const response = await api.post('/moderation/report/user', {
        user_id: userId,
        reason,
      })
      return apiResponse(
        true,
        response.data?.message || 'User reported successfully',
        response.data?.data
      )
    } catch (err: any) {
      console.log('Error reporting user:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error reporting user',
        undefined
      )
    }
  },
}
