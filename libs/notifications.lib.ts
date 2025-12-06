import * as Application from 'expo-application'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { router } from 'expo-router'

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
})

export interface DeviceInfo {
  deviceId: string
  deviceName: string | null
  deviceModel: string | null
  osVersion: string | null
  platform: 'ios' | 'android' | 'web'
  appVersion: string
}

export interface NotificationData {
  screen?: string
  postId?: string
  commentId?: string
  userId?: string
  notificationId?: string
  type?: string
  [key: string]: any
}

/**
 * Get device information for session registration
 */
export function getDeviceInfo(): DeviceInfo {
  // Generate a unique device ID based on device properties
  // This is synchronous and provides a consistent ID across app restarts
  const deviceId = Device.osInternalBuildId || 
    `${Platform.OS}-${Device.modelId || 'unknown'}-${Device.deviceYearClass || 'unknown'}`
  
  const platform = Platform.OS as 'ios' | 'android' | 'web'

  return {
    deviceId,
    deviceName: Device.deviceName,
    deviceModel: Device.modelName,
    osVersion: Device.osVersion,
    platform,
    appVersion: Constants.expoConfig?.version || '1.0.0',
  }
}

/**
 * Get device information for session registration (async version with Android ID)
 */
export async function getDeviceInfoAsync(): Promise<DeviceInfo> {
  let deviceId = 'unknown'
  
  if (Platform.OS === 'android') {
    try {
      const androidId = await Application.getAndroidId()
      deviceId = androidId || Device.osInternalBuildId || 'android-unknown'
    } catch {
      deviceId = Device.osInternalBuildId || 'android-unknown'
    }
  } else if (Platform.OS === 'ios') {
    // For iOS, we use a combination of device info
    deviceId = Device.osInternalBuildId || `ios-${Device.modelId || 'unknown'}`
  }
  
  const platform = Platform.OS as 'ios' | 'android' | 'web'

  return {
    deviceId,
    deviceName: Device.deviceName,
    deviceModel: Device.modelName,
    osVersion: Device.osVersion,
    platform,
    appVersion: Constants.expoConfig?.version || '1.0.0',
  }
}

/**
 * Request notification permissions and get FCM token
 * Uses expo-notifications which internally uses FCM for Android and APNs for iOS
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Check if we're on a physical device
  if (!Device.isDevice) {
    console.log('[Notifications] Push notifications require a physical device')
    return null
  }

  try {
    // Check existing permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted')
      return null
    }

    // Get the FCM/APNs token
    // For Expo, this returns the native device push token (FCM on Android, APNs on iOS)
    const tokenData = await Notifications.getDevicePushTokenAsync()
    const token = tokenData.data

    console.log('[Notifications] Push token obtained:', token.substring(0, 20) + '...')

    // Set up notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366f1',
        sound: 'default',
      })
    }

    return token
  } catch (error) {
    console.error('[Notifications] Error getting push token:', error)
    return null
  }
}

/**
 * Handle notification navigation based on notification data
 */
export function handleNotificationNavigation(data: NotificationData) {
  const { screen, postId, commentId, userId } = data

  switch (screen) {
    case 'post-details':
      if (postId) {
        router.push({
          pathname: '/(screens)/post-details',
          params: { postId },
        })
      }
      break
    case 'profile':
      if (userId) {
        router.push({
          pathname: '/profile/[tag_name]',
          params: { tag_name: userId },
        })
      }
      break
    default:
      // Default: navigate to notifications tab or home
      router.push('/(tabs)')
  }
}

/**
 * Set up notification listeners
 * Returns a cleanup function to remove listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
): () => void {
  // Listener for notifications received while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('[Notifications] Received:', notification)
      onNotificationReceived?.(notification)
    }
  )

  // Listener for user interaction with notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('[Notifications] Response:', response)
      const data = response.notification.request.content.data as NotificationData
      
      // Handle navigation based on notification data
      handleNotificationNavigation(data)
      
      onNotificationResponse?.(response)
    }
  )

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener)
    Notifications.removeNotificationSubscription(responseListener)
  }
}

/**
 * Get the last notification response (for handling app launch via notification)
 */
export async function getInitialNotification(): Promise<Notifications.NotificationResponse | null> {
  return await Notifications.getLastNotificationResponseAsync()
}

/**
 * Handle initial notification if app was launched from a notification
 */
export async function handleInitialNotification(): Promise<boolean> {
  const response = await getInitialNotification()
  
  if (response) {
    const data = response.notification.request.content.data as NotificationData
    handleNotificationNavigation(data)
    return true
  }
  
  return false
}

/**
 * Get the current badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync()
}

/**
 * Set the badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count)
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync()
  await setBadgeCount(0)
}

/**
 * Schedule a local notification (for testing or local reminders)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: NotificationData,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: trigger || null, // null means immediate
  })
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(
  notificationId: string
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId)
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

