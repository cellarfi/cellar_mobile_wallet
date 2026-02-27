import { NotificationModel } from '@/models/notification.model'
import { Request, Response } from 'express'
import { z } from 'zod'
import { NotificationType } from '../../generated/prisma'

// Validation schemas
const getNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  is_read: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  type: z.nativeEnum(NotificationType).optional(),
})

const markAsReadSchema = z.object({
  notification_id: z.string(),
})

const deleteNotificationSchema = z.object({
  notification_id: z.string(),
})

/**
 * Get notifications for the current user with pagination
 */
export const getNotifications = async (
  req: Request<{}, {}, {}, { page?: string; pageSize?: string; is_read?: string; type?: string }>,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user!.id

    const { success, data, error } = getNotificationsQuerySchema.safeParse(
      req.query
    )

    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
      return
    }

    const result = await NotificationModel.getUserNotifications({
      user_id,
      page: data.page,
      page_size: data.pageSize,
      is_read: data.is_read,
      type: data.type,
    })

    res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
    })
  } catch (err: any) {
    console.error('[getNotifications] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred fetching notifications',
    })
  }
}

/**
 * Get unread notification count for the current user
 */
export const getUnreadCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user!.id

    const count = await NotificationModel.getUnreadCount(user_id)

    res.status(200).json({
      success: true,
      data: { count },
    })
  } catch (err: any) {
    console.error('[getUnreadCount] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred fetching unread count',
    })
  }
}

/**
 * Mark a notification as read
 */
export const markAsRead = async (
  req: Request<{ notification_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user!.id
    const { notification_id } = req.params

    if (!notification_id) {
      res.status(400).json({
        success: false,
        error: 'Notification ID is required',
      })
      return
    }

    const result = await NotificationModel.markAsRead(notification_id, user_id)

    if (result.count === 0) {
      res.status(404).json({
        success: false,
        error: 'Notification not found or access denied',
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    })
  } catch (err: any) {
    console.error('[markAsRead] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred marking notification as read',
    })
  }
}

/**
 * Mark all notifications as read for the current user
 */
export const markAllAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user!.id

    const result = await NotificationModel.markAllAsRead(user_id)

    res.status(200).json({
      success: true,
      message: `Marked ${result.count} notifications as read`,
      data: { count: result.count },
    })
  } catch (err: any) {
    console.error('[markAllAsRead] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred marking all notifications as read',
    })
  }
}

/**
 * Delete a notification
 */
export const deleteNotification = async (
  req: Request<{ notification_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user!.id
    const { notification_id } = req.params

    if (!notification_id) {
      res.status(400).json({
        success: false,
        error: 'Notification ID is required',
      })
      return
    }

    const result = await NotificationModel.deleteNotification(
      notification_id,
      user_id
    )

    if (result.count === 0) {
      res.status(404).json({
        success: false,
        error: 'Notification not found or access denied',
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
    })
  } catch (err: any) {
    console.error('[deleteNotification] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred deleting the notification',
    })
  }
}

/**
 * Delete all notifications for the current user
 */
export const deleteAllNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user!.id

    const result = await NotificationModel.deleteAllNotifications(user_id)

    res.status(200).json({
      success: true,
      message: `Deleted ${result.count} notifications`,
      data: { count: result.count },
    })
  } catch (err: any) {
    console.error('[deleteAllNotifications] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred deleting all notifications',
    })
  }
}


