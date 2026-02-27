import prismaService from '@/service/prismaService'
import { NotificationType } from '../../generated/prisma'

const prisma = prismaService.prisma

export interface CreateNotificationDto {
  user_id: string
  type: NotificationType
  title: string
  body: string
  data?: any
  post_id?: string
  comment_id?: string
  actor_id?: string
  tapestry_content_id?: string
  tapestry_comment_id?: string
}

export interface NotificationQueryDto {
  user_id: string
  is_read?: boolean
  type?: NotificationType
  page?: number
  page_size?: number
}

export class NotificationModel {
  /**
   * Create a new notification
   */
  static async createNotification(dto: CreateNotificationDto) {
    return prisma.notification.create({
      data: {
        user_id: dto.user_id,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        data: dto.data,
        post_id: dto.post_id,
        comment_id: dto.comment_id,
        actor_id: dto.actor_id,
        tapestry_content_id: dto.tapestry_content_id,
        tapestry_comment_id: dto.tapestry_comment_id,
      },
      include: {
        actor: {
          select: {
            id: true,
            display_name: true,
            tag_name: true,
            profile_picture_url: true,
          },
        },
      },
    })
  }

  /**
   * Create multiple notifications at once (e.g., for mentions)
   */
  static async createManyNotifications(
    notifications: CreateNotificationDto[]
  ) {
    return prisma.notification.createMany({
      data: notifications.map((dto) => ({
        user_id: dto.user_id,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        data: dto.data,
        post_id: dto.post_id,
        comment_id: dto.comment_id,
        actor_id: dto.actor_id,
        tapestry_content_id: dto.tapestry_content_id,
        tapestry_comment_id: dto.tapestry_comment_id,
      })),
      skipDuplicates: true,
    })
  }

  /**
   * Get notifications for a user with pagination
   */
  static async getUserNotifications(query: NotificationQueryDto) {
    const page = query.page || 1
    const pageSize = query.page_size || 20
    const skip = (page - 1) * pageSize

    const whereClause: any = {
      user_id: query.user_id,
    }

    if (query.is_read !== undefined) {
      whereClause.is_read = query.is_read
    }

    if (query.type) {
      whereClause.type = query.type
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        include: {
          actor: {
            select: {
              id: true,
              display_name: true,
              tag_name: true,
              profile_picture_url: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.notification.count({ where: whereClause }),
    ])

    return {
      notifications,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  }

  /**
   * Get a single notification by ID
   */
  static async getNotificationById(id: string) {
    return prisma.notification.findUnique({
      where: { id },
      include: {
        actor: {
          select: {
            id: true,
            display_name: true,
            tag_name: true,
            profile_picture_url: true,
          },
        },
      },
    })
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(id: string, user_id: string) {
    return prisma.notification.updateMany({
      where: {
        id,
        user_id, // Ensure user owns the notification
      },
      data: {
        is_read: true,
      },
    })
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(user_id: string) {
    return prisma.notification.updateMany({
      where: {
        user_id,
        is_read: false,
      },
      data: {
        is_read: true,
      },
    })
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(id: string, user_id: string) {
    return prisma.notification.deleteMany({
      where: {
        id,
        user_id, // Ensure user owns the notification
      },
    })
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAllNotifications(user_id: string) {
    return prisma.notification.deleteMany({
      where: {
        user_id,
      },
    })
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(user_id: string) {
    return prisma.notification.count({
      where: {
        user_id,
        is_read: false,
      },
    })
  }

  /**
   * Delete old notifications (older than specified days)
   * Used for cleanup jobs
   */
  static async deleteOldNotifications(days_old: number = 30) {
    const cutoff_date = new Date()
    cutoff_date.setDate(cutoff_date.getDate() - days_old)

    return prisma.notification.deleteMany({
      where: {
        created_at: {
          lt: cutoff_date,
        },
        is_read: true, // Only delete read notifications
      },
    })
  }

  /**
   * Check if a similar notification already exists (to prevent duplicates)
   * Used for rate-limiting notifications
   */
  static async notificationExists(
    user_id: string,
    actor_id: string,
    type: NotificationType,
    post_id?: string,
    comment_id?: string,
    within_minutes: number = 5
  ) {
    const cutoff_date = new Date()
    cutoff_date.setMinutes(cutoff_date.getMinutes() - within_minutes)

    const whereClause: any = {
      user_id,
      actor_id,
      type,
      created_at: {
        gte: cutoff_date,
      },
    }

    if (post_id) {
      whereClause.post_id = post_id
    }

    if (comment_id) {
      whereClause.comment_id = comment_id
    }

    const existing = await prisma.notification.findFirst({
      where: whereClause,
    })

    return !!existing
  }
}


