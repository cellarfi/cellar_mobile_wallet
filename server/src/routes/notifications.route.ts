import {
  deleteAllNotifications,
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from '@/controllers/notificationController'
import { authMiddleware } from '@/middleware/auth.middleware'
import { Router } from 'express'

const router = Router()

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for the current user (paginated)
 * @access  Private
 * @query   page - Page number (default: 1)
 * @query   pageSize - Items per page (default: 20, max: 50)
 * @query   is_read - Filter by read status ('true' or 'false')
 * @query   type - Filter by notification type
 */
router.get('/', authMiddleware(), getNotifications)

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', authMiddleware(), getUnreadCount)

/**
 * @route   PATCH /api/notifications/:notification_id/read
 * @desc    Mark a specific notification as read
 * @access  Private
 */
router.patch('/:notification_id/read', authMiddleware(), markAsRead)

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.patch('/read-all', authMiddleware(), markAllAsRead)

/**
 * @route   DELETE /api/notifications/:notification_id
 * @desc    Delete a specific notification
 * @access  Private
 */
router.delete('/:notification_id', authMiddleware(), deleteNotification)

/**
 * @route   DELETE /api/notifications
 * @desc    Delete all notifications for the current user
 * @access  Private
 */
router.delete('/', authMiddleware(), deleteAllNotifications)

export default router


