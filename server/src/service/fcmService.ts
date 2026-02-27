import { SessionModel } from '@/models/session.model'
import * as admin from 'firebase-admin'

// Initialize Firebase Admin SDK
const serviceAccount = require('../../firebase-admin.json')

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

export interface FCMNotificationPayload {
  title: string
  body: string
  data?: Record<string, string>
  imageUrl?: string
}

export interface FCMSendResult {
  success: boolean
  successCount: number
  failureCount: number
  results: Array<{
    token: string
    success: boolean
    messageId?: string
    error?: string
  }>
}

/**
 * Service for sending Firebase Cloud Messaging notifications
 */
export class FCMService {
  /**
   * Send notification to a single device token
   */
  static async sendToToken(
    token: string,
    payload: FCMNotificationPayload
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: payload.data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            priority: 'high',
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              contentAvailable: true,
            },
          },
        },
      }

      const messageId = await admin.messaging().send(message)
      console.log(`[FCMService] Successfully sent message: ${messageId}`)
      return { success: true, messageId }
    } catch (error: any) {
      console.error('[FCMService] Error sending message:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send notification to multiple device tokens
   */
  static async sendToTokens(
    tokens: string[],
    payload: FCMNotificationPayload
  ): Promise<FCMSendResult> {
    if (tokens.length === 0) {
      return {
        success: true,
        successCount: 0,
        failureCount: 0,
        results: [],
      }
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: payload.data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            priority: 'high',
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              contentAvailable: true,
            },
          },
        },
      }

      const response = await admin.messaging().sendEachForMulticast(message)

      const results = response.responses.map((resp, idx) => ({
        token: tokens[idx],
        success: resp.success,
        messageId: resp.messageId,
        error: resp.error?.message,
      }))

      console.log(
        `[FCMService] Sent to ${tokens.length} tokens: ${response.successCount} success, ${response.failureCount} failures`
      )

      return {
        success: response.failureCount === 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        results,
      }
    } catch (error: any) {
      console.error('[FCMService] Error sending multicast message:', error)
      return {
        success: false,
        successCount: 0,
        failureCount: tokens.length,
        results: tokens.map((token) => ({
          token,
          success: false,
          error: error.message,
        })),
      }
    }
  }

  /**
   * Send notification to a specific user (all their active devices)
   */
  static async sendToUser(
    userId: string,
    payload: FCMNotificationPayload
  ): Promise<FCMSendResult> {
    try {
      // Get all active sessions for the user
      const sessions = await SessionModel.getUserSessions({
        user_id: userId,
        status: 'ACTIVE',
      })

      if (sessions.length === 0) {
        console.log(`[FCMService] No active sessions found for user ${userId}`)
        return {
          success: true,
          successCount: 0,
          failureCount: 0,
          results: [],
        }
      }

      // Extract push tokens
      const tokens = sessions
        .map((session: any) => session.push_token)
        .filter(Boolean)

      if (tokens.length === 0) {
        console.log(`[FCMService] No push tokens found for user ${userId}`)
        return {
          success: true,
          successCount: 0,
          failureCount: 0,
          results: [],
        }
      }

      return await this.sendToTokens(tokens, payload)
    } catch (error: any) {
      console.error(`[FCMService] Error sending to user ${userId}:`, error)
      return {
        success: false,
        successCount: 0,
        failureCount: 0,
        results: [],
      }
    }
  }

  /**
   * Send notification to multiple users
   */
  static async sendToUsers(
    userIds: string[],
    payload: FCMNotificationPayload
  ): Promise<FCMSendResult> {
    try {
      const allTokens: string[] = []

      // Gather all tokens for all users
      for (const userId of userIds) {
        const sessions = await SessionModel.getUserSessions({
          user_id: userId,
          status: 'ACTIVE',
        })
        const tokens = sessions
          .map((session: any) => session.push_token)
          .filter(Boolean)
        allTokens.push(...tokens)
      }

      if (allTokens.length === 0) {
        return {
          success: true,
          successCount: 0,
          failureCount: 0,
          results: [],
        }
      }

      return await this.sendToTokens(allTokens, payload)
    } catch (error: any) {
      console.error('[FCMService] Error sending to multiple users:', error)
      return {
        success: false,
        successCount: 0,
        failureCount: 0,
        results: [],
      }
    }
  }

  /**
   * Send a data-only notification (silent push)
   * Useful for triggering background updates
   */
  static async sendDataMessage(
    token: string,
    data: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const message: admin.messaging.Message = {
        token,
        data,
        android: {
          priority: 'high',
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
            },
          },
        },
      }

      const messageId = await admin.messaging().send(message)
      return { success: true, messageId }
    } catch (error: any) {
      console.error('[FCMService] Error sending data message:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Subscribe a token to a topic
   */
  static async subscribeToTopic(
    token: string,
    topic: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await admin.messaging().subscribeToTopic([token], topic)
      return { success: true }
    } catch (error: any) {
      console.error('[FCMService] Error subscribing to topic:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Unsubscribe a token from a topic
   */
  static async unsubscribeFromTopic(
    token: string,
    topic: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await admin.messaging().unsubscribeFromTopic([token], topic)
      return { success: true }
    } catch (error: any) {
      console.error('[FCMService] Error unsubscribing from topic:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send notification to a topic
   */
  static async sendToTopic(
    topic: string,
    payload: FCMNotificationPayload
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: payload.data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            priority: 'high',
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      }

      const messageId = await admin.messaging().send(message)
      console.log(
        `[FCMService] Successfully sent to topic ${topic}: ${messageId}`
      )
      return { success: true, messageId }
    } catch (error: any) {
      console.error('[FCMService] Error sending to topic:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Validate an FCM token
   */
  static async validateToken(token: string): Promise<boolean> {
    try {
      // Send a dry-run message to validate the token
      await admin.messaging().send(
        {
          token,
          notification: {
            title: 'Test',
            body: 'Test',
          },
        },
        true // dry run
      )
      return true
    } catch (error: any) {
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        return false
      }
      // For other errors, we assume the token might still be valid
      console.error('[FCMService] Token validation error:', error)
      return true
    }
  }
}
