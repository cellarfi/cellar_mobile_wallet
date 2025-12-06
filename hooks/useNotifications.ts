import { Keys } from '@/constants/App'
import { notificationRequests } from '@/libs/api_requests/notification.request'
import { sessionRequests } from '@/libs/api_requests/session.request'
import {
  handleInitialNotification,
  setBadgeCount,
  setupNotificationListeners,
} from '@/libs/notifications.lib'
import { useAuthStore } from '@/store/authStore'
import * as Notifications from 'expo-notifications'
import * as SecureStore from 'expo-secure-store'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseNotificationsReturn {
  unreadCount: number
  isLoading: boolean
  error: string | null
  refreshUnreadCount: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  clearBadge: () => Promise<void>
}

export function useNotifications(): UseNotificationsReturn {
  const { isAuthenticated } = useAuthStore()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  // Refresh unread count from server
  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      setIsLoading(true)
      const response = await notificationRequests.getUnreadCount()
      if (response.success) {
        const count = response.data?.count || 0
        setUnreadCount(count)
        await setBadgeCount(count)
      }
    } catch (err) {
      console.error('[useNotifications] Error fetching unread count:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // Mark a notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const response = await notificationRequests.markAsRead(notificationId)
        if (response.success) {
          await refreshUnreadCount()
        }
      } catch (err) {
        console.error('[useNotifications] Error marking as read:', err)
      }
    },
    [refreshUnreadCount]
  )

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationRequests.markAllAsRead()
      if (response.success) {
        setUnreadCount(0)
        await setBadgeCount(0)
      }
    } catch (err) {
      console.error('[useNotifications] Error marking all as read:', err)
    }
  }, [])

  // Clear badge
  const clearBadge = useCallback(async () => {
    await setBadgeCount(0)
  }, [])

  // Set up notification listeners
  useEffect(() => {
    if (!isAuthenticated) return

    // Set up listeners
    cleanupRef.current = setupNotificationListeners(
      // When notification received while app is in foreground
      (notification) => {
        console.log('[useNotifications] Received notification:', notification)
        // Refresh unread count
        refreshUnreadCount()
      },
      // When user taps on notification
      (response) => {
        console.log('[useNotifications] Notification response:', response)
        // Refresh unread count after interaction
        refreshUnreadCount()
      }
    )

    // Handle initial notification (if app was launched from notification)
    handleInitialNotification().then((handled) => {
      if (handled) {
        console.log('[useNotifications] Handled initial notification')
        refreshUnreadCount()
      }
    })

    // Initial fetch of unread count
    refreshUnreadCount()

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [isAuthenticated, refreshUnreadCount])

  return {
    unreadCount,
    isLoading,
    error,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
    clearBadge,
  }
}

/**
 * Hook to check if device session is still active (for remote logout detection)
 */
export function useSessionStatus(
  checkInterval: number = 60000 // Default: check every minute
) {
  const { isAuthenticated, logout } = useAuthStore()
  const [isActive, setIsActive] = useState(true)
  const [isChecking, setIsChecking] = useState(false)

  const checkSessionStatus = useCallback(async () => {
    if (!isAuthenticated || isChecking) return

    try {
      setIsChecking(true)
      const deviceId = await SecureStore.getItemAsync(Keys.DEVICE_ID)
      if (!deviceId) return

      const response = await sessionRequests.checkSessionStatus(deviceId)
      if (response.success) {
        const active = response.data?.is_active
        setIsActive(active)

        // If session is no longer active, log out the user
        if (!active) {
          console.log('[useSessionStatus] Session revoked, logging out')
          // Note: You might want to show an alert before logging out
          // await logout()
        }
      }
    } catch (err) {
      console.error('[useSessionStatus] Error checking session status:', err)
    } finally {
      setIsChecking(false)
    }
  }, [isAuthenticated, isChecking])

  // Check session status on interval
  useEffect(() => {
    if (!isAuthenticated) return

    // Initial check
    checkSessionStatus()

    // Set up interval
    const intervalId = setInterval(checkSessionStatus, checkInterval)

    return () => {
      clearInterval(intervalId)
    }
  }, [isAuthenticated, checkInterval, checkSessionStatus])

  return {
    isActive,
    isChecking,
    checkSessionStatus,
  }
}

/**
 * Hook to update push token when it changes
 */
export function usePushTokenRefresh() {
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) return

    // Listen for token refresh
    const subscription = Notifications.addPushTokenListener(async (token) => {
      console.log(
        '[usePushTokenRefresh] Token refreshed:',
        token.data.substring(0, 20) + '...'
      )

      try {
        const sessionId = await SecureStore.getItemAsync(Keys.DEVICE_SESSION_ID)
        if (sessionId) {
          // Update the session with new push token
          await sessionRequests.updateSession(sessionId, {
            push_token: token.data,
          })

          // Store the new token
          await SecureStore.setItemAsync(Keys.PUSH_TOKEN, token.data)

          console.log('[usePushTokenRefresh] Session updated with new token')
        }
      } catch (err) {
        console.error('[usePushTokenRefresh] Error updating push token:', err)
      }
    })

    return () => {
      subscription.remove()
    }
  }, [isAuthenticated])
}
