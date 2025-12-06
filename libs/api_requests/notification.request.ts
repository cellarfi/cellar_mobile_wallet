import { apiResponse, httpRequest } from '../api.helpers'

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  data?: any
  is_read: boolean
  post_id?: string
  comment_id?: string
  actor_id?: string
  actor?: {
    id: string
    display_name: string
    tag_name: string
    profile_picture_url?: string
  }
  created_at: string
  updated_at: string
}

export interface NotificationPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface GetNotificationsParams {
  page?: number
  pageSize?: number
  is_read?: boolean
  type?: string
}

export const notificationRequests = {
  /**
   * Get notifications for the current user (paginated)
   */
  getNotifications: async (params?: GetNotificationsParams) => {
    try {
      const api = httpRequest()
      const res = await api.get('/notifications', { params })

      return apiResponse(true, 'Fetched notifications', {
        notifications: res.data.data as Notification[],
        pagination: res.data.pagination as NotificationPagination,
      })
    } catch (err: any) {
      console.log('Error fetching notifications:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error || err?.message || 'Error occurred.',
        err
      )
    }
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async () => {
    try {
      const api = httpRequest()
      const res = await api.get('/notifications/unread-count')

      return apiResponse(true, 'Fetched unread count', res.data.data)
    } catch (err: any) {
      console.log('Error fetching unread count:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error || err?.message || 'Error occurred.',
        err
      )
    }
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (notificationId: string) => {
    try {
      const api = httpRequest()
      const res = await api.patch(`/notifications/${notificationId}/read`)

      return apiResponse(true, 'Notification marked as read', res.data)
    } catch (err: any) {
      console.log('Error marking notification as read:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error || err?.message || 'Error occurred.',
        err
      )
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    try {
      const api = httpRequest()
      const res = await api.patch('/notifications/read-all')

      return apiResponse(true, 'All notifications marked as read', res.data.data)
    } catch (err: any) {
      console.log('Error marking all as read:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error || err?.message || 'Error occurred.',
        err
      )
    }
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (notificationId: string) => {
    try {
      const api = httpRequest()
      const res = await api.delete(`/notifications/${notificationId}`)

      return apiResponse(true, 'Notification deleted', res.data)
    } catch (err: any) {
      console.log('Error deleting notification:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error || err?.message || 'Error occurred.',
        err
      )
    }
  },

  /**
   * Delete all notifications
   */
  deleteAllNotifications: async () => {
    try {
      const api = httpRequest()
      const res = await api.delete('/notifications')

      return apiResponse(true, 'All notifications deleted', res.data.data)
    } catch (err: any) {
      console.log('Error deleting all notifications:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error || err?.message || 'Error occurred.',
        err
      )
    }
  },
}


