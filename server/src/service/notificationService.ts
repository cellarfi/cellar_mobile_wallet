import {
  CreateNotificationDto,
  NotificationModel,
} from '@/models/notification.model'
import { NotificationType } from '../../generated/prisma'
import { FCMNotificationPayload, FCMService } from './fcmService'

export interface SendNotificationOptions {
  // User to receive the notification
  userId: string
  // User who triggered the notification
  actorId?: string
  // Notification type
  type: NotificationType
  // Notification content
  title: string
  body: string
  // Additional data for navigation
  data?: Record<string, string>
  // Related entities
  postId?: string
  commentId?: string
  // Tapestry v2 identifiers (for experimental SocialFi)
  tapestryContentId?: string
  tapestryCommentId?: string
  // Whether to send push notification (default: true)
  sendPush?: boolean
  // Rate limit: prevent duplicate notifications within X minutes
  rateLimitMinutes?: number
}

/**
 * Unified Notification Service that handles both database storage and FCM push
 */
export class NotificationService {
  /**
   * Send a notification to a user
   * This will:
   * 1. Check for rate limiting (optional)
   * 2. Store the notification in the database
   * 3. Send push notification via FCM
   */
  static async sendNotification(options: SendNotificationOptions): Promise<{
    success: boolean
    notification?: any
    pushResult?: any
    skipped?: boolean
    reason?: string
  }> {
    try {
      const {
        userId,
        actorId,
        type,
        title,
        body,
        data,
        postId,
        commentId,
        tapestryContentId,
        tapestryCommentId,
        sendPush = true,
        rateLimitMinutes = 5,
      } = options

      // Don't send notification to yourself
      if (actorId && userId === actorId) {
        return {
          success: true,
          skipped: true,
          reason: 'User cannot notify themselves',
        }
      }

      // Check rate limiting
      if (actorId && rateLimitMinutes > 0) {
        const exists = await NotificationModel.notificationExists(
          userId,
          actorId,
          type,
          postId,
          commentId,
          rateLimitMinutes
        )

        if (exists) {
          console.log(
            `[NotificationService] Rate limited: ${type} from ${actorId} to ${userId}`
          )
          return {
            success: true,
            skipped: true,
            reason: 'Rate limited - similar notification exists',
          }
        }
      }

      // Create notification in database
      const notificationDto: CreateNotificationDto = {
        user_id: userId,
        type,
        title,
        body,
        data,
        post_id: postId,
        comment_id: commentId,
        actor_id: actorId,
        tapestry_content_id: tapestryContentId,
        tapestry_comment_id: tapestryCommentId,
      }

      const notification = await NotificationModel.createNotification(
        notificationDto
      )

      let pushResult = null

      // Send push notification
      if (sendPush) {
        const payload: FCMNotificationPayload = {
          title,
          body,
          data: {
            ...data,
            notificationId: notification.id,
            type,
            ...(postId && { postId }),
            ...(commentId && { commentId }),
            ...(actorId && { actorId }),
          },
        }

        pushResult = await FCMService.sendToUser(userId, payload)
      }

      console.log(
        `[NotificationService] Sent ${type} notification to user ${userId}`
      )

      return {
        success: true,
        notification,
        pushResult,
      }
    } catch (error: any) {
      console.error('[NotificationService] Error sending notification:', error)
      return {
        success: false,
        reason: error.message,
      }
    }
  }

  /**
   * Send a POST_LIKE notification
   */
  static async sendPostLikeNotification(
    postOwnerId: string,
    likerId: string,
    likerName: string,
    postId: string
  ) {
    return this.sendNotification({
      userId: postOwnerId,
      actorId: likerId,
      type: NotificationType.POST_LIKE,
      title: 'New Like',
      body: `${likerName} liked your post`,
      data: {
        screen: 'post-details',
        postId,
      },
      postId,
    })
  }

  /**
   * Send a POST_COMMENT notification
   */
  static async sendPostCommentNotification(
    postOwnerId: string,
    commenterId: string,
    commenterName: string,
    postId: string,
    commentId: string,
    commentPreview: string
  ) {
    const truncatedComment =
      commentPreview.length > 50
        ? commentPreview.substring(0, 47) + '...'
        : commentPreview

    return this.sendNotification({
      userId: postOwnerId,
      actorId: commenterId,
      type: NotificationType.POST_COMMENT,
      title: 'New Comment',
      body: `${commenterName}: ${truncatedComment}`,
      data: {
        screen: 'post-details',
        postId,
        commentId,
      },
      postId,
      commentId,
    })
  }

  /**
   * Send a POST_MENTION notification
   */
  static async sendMentionNotification(
    mentionedUserId: string,
    mentionerId: string,
    mentionerName: string,
    postId: string,
    postPreview: string
  ) {
    const truncatedPost =
      postPreview.length > 50
        ? postPreview.substring(0, 47) + '...'
        : postPreview

    return this.sendNotification({
      userId: mentionedUserId,
      actorId: mentionerId,
      type: NotificationType.POST_MENTION,
      title: 'You were mentioned',
      body: `${mentionerName} mentioned you: ${truncatedPost}`,
      data: {
        screen: 'post-details',
        postId,
      },
      postId,
    })
  }

  /**
   * Send COMMENT_LIKE notification
   */
  static async sendCommentLikeNotification(
    commentOwnerId: string,
    likerId: string,
    likerName: string,
    postId: string,
    commentId: string
  ) {
    return this.sendNotification({
      userId: commentOwnerId,
      actorId: likerId,
      type: NotificationType.COMMENT_LIKE,
      title: 'Comment Liked',
      body: `${likerName} liked your comment`,
      data: {
        screen: 'post-details',
        postId,
        commentId,
      },
      postId,
      commentId,
    })
  }

  /**
   * Send COMMENT_REPLY notification
   */
  static async sendCommentReplyNotification(
    parentCommentOwnerId: string,
    replierId: string,
    replierName: string,
    postId: string,
    commentId: string,
    replyPreview: string
  ) {
    const truncatedReply =
      replyPreview.length > 50
        ? replyPreview.substring(0, 47) + '...'
        : replyPreview

    return this.sendNotification({
      userId: parentCommentOwnerId,
      actorId: replierId,
      type: NotificationType.COMMENT_REPLY,
      title: 'New Reply',
      body: `${replierName}: ${truncatedReply}`,
      data: {
        screen: 'post-details',
        postId,
        commentId,
      },
      postId,
      commentId,
    })
  }

  /**
   * Send NEW_FOLLOWER notification
   */
  static async sendNewFollowerNotification(
    followedUserId: string,
    followerId: string,
    followerName: string,
    followerTagName: string
  ) {
    return this.sendNotification({
      userId: followedUserId,
      actorId: followerId,
      type: NotificationType.NEW_FOLLOWER,
      title: 'New Follower',
      body: `${followerName} started following you`,
      data: {
        screen: 'profile',
        tagName: followerTagName,
      },
    })
  }

  /**
   * Send a system notification to a user
   */
  static async sendSystemNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    return this.sendNotification({
      userId,
      type: NotificationType.SYSTEM,
      title,
      body,
      data,
      rateLimitMinutes: 0, // No rate limiting for system notifications
    })
  }

  /**
   * Send a system notification to multiple users
   */
  static async sendBulkSystemNotification(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    const results = await Promise.all(
      userIds.map((userId) =>
        this.sendSystemNotification(userId, title, body, data)
      )
    )

    return {
      success: results.every((r) => r.success),
      totalSent: results.filter((r) => r.success && !r.skipped).length,
      totalSkipped: results.filter((r) => r.skipped).length,
      totalFailed: results.filter((r) => !r.success).length,
    }
  }

  /**
   * Send push notification only (without storing in database)
   * Useful for transient notifications
   */
  static async sendPushOnly(userId: string, payload: FCMNotificationPayload) {
    return FCMService.sendToUser(userId, payload)
  }

  /**
   * Send push notification to a specific FCM token
   */
  static async sendPushToToken(token: string, payload: FCMNotificationPayload) {
    return FCMService.sendToToken(token, payload)
  }
}
