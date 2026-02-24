import { Keys, TOKEN_REFRESH_INTERVAL_MS } from '@/constants/App'
import { sessionRequests } from '@/libs/api_requests/session.request'
import { clearAllNotifications } from '@/libs/notifications.lib'
import { useAssetsStore } from '@/store/assetsStore'
import { useAuthStore } from '@/store/authStore'
import { usePointsStore } from '@/store/pointsStore'
import { usePortfolioStore } from '@/store/portfolioStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useIdentityToken, usePrivy } from '@privy-io/expo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { useCallback, useEffect } from 'react'

export const useSessionManager = (isAuthenticated: boolean) => {
  const { getIdentityToken } = useIdentityToken()
  const {
    user: privyUser,
    isReady: privyIsReady,
    logout: privyLogout,
  } = usePrivy()
  const { updateFromPrivy, logout: storeLogout, clearStore } = useAuthStore()
  const { updateSettings } = useSettingsStore()
  const { clearPortfolio } = usePortfolioStore()
  const { clearAssets } = useAssetsStore()
  const { clearPoints } = usePointsStore()
  // Add other stores if needed (transactions, tokens, etc.)

  // Check if token needs refresh (older than 1 hour)
  const isTokenStale = useCallback(async (): Promise<boolean> => {
    try {
      const timestampStr = await SecureStore.getItemAsync(
        Keys.PRIVY_TOKEN_TIMESTAMP
      )
      if (!timestampStr) return true // No timestamp means we need to refresh

      const timestamp = parseInt(timestampStr, 10)
      const now = Date.now()
      const tokenAge = now - timestamp

      console.log(
        `Token age: ${Math.round(tokenAge / 1000 / 60)} minutes (max: ${TOKEN_REFRESH_INTERVAL_MS / 1000 / 60} minutes)`
      )

      return tokenAge > TOKEN_REFRESH_INTERVAL_MS
    } catch (error) {
      console.error('Error checking token age:', error)
      return true // Refresh on error to be safe
    }
  }, [])

  // Get Privy access token (with automatic refresh if stale)
  const getPrivyIdentityToken = useCallback(
    async (forceRefresh = false) => {
      console.log('Getting Privy access token...', privyIsReady, !!privyUser)

      if (!privyIsReady || !getIdentityToken) {
        console.log('Privy not ready or getIdentityToken not available')
        return
      }

      // Check if we need to refresh (token is stale or forced)
      const needsRefresh = forceRefresh || (await isTokenStale())

      if (!needsRefresh) {
        console.log('Token is still fresh, skipping refresh')
        return
      }

      console.log('Token is stale or refresh forced, getting new token...')

      try {
        const token = await getIdentityToken()
        console.log('Privy identity token received:', !!token)

        if (token) {
          // Store both the token and the timestamp
          await SecureStore.setItemAsync(Keys.PRIVY_IDENTITY_TOKEN, token)
          await SecureStore.setItemAsync(
            Keys.PRIVY_TOKEN_TIMESTAMP,
            Date.now().toString()
          )
          console.log('Privy identity token and timestamp saved')
        }
      } catch (error) {
        console.error('Error getting Privy identity token:', error)
      }
    },
    [privyIsReady, privyUser, getIdentityToken, isTokenStale]
  )

  // Refresh token when app becomes active (checks staleness internally)
  const refreshTokenIfNeeded = useCallback(async () => {
    if (isAuthenticated && privyIsReady) {
      await getPrivyIdentityToken(false) // Will only refresh if stale
    }
  }, [isAuthenticated, privyIsReady, getPrivyIdentityToken])

  // Sync Privy state with Zustand store whenever Privy state changes
  useEffect(() => {
    console.log('AuthProvider: Privy state changed:', {
      privyUser: !!privyUser,
      privyIsReady,
      userId: privyUser?.id,
    })

    updateFromPrivy(privyUser, privyIsReady)

    // Force refresh token on login/Privy state change to ensure we have a fresh token
    if (privyUser && privyIsReady) {
      getPrivyIdentityToken(true) // Force refresh on login
    }
  }, [privyUser, privyIsReady, updateFromPrivy, getPrivyIdentityToken])

  // Periodic token refresh check (every 5 minutes)
  useEffect(() => {
    if (!isAuthenticated || !privyIsReady) return

    console.log('Setting up periodic token refresh check')
    const intervalId = setInterval(
      () => {
        console.log('Periodic token refresh check triggered')
        refreshTokenIfNeeded()
      },
      5 * 60 * 1000
    ) // Check every 5 minutes

    return () => {
      console.log('Clearing periodic token refresh check')
      clearInterval(intervalId)
    }
  }, [isAuthenticated, privyIsReady, refreshTokenIfNeeded])

  // Enhanced logout function that clears both Privy and local state
  const logout = async () => {
    try {
      console.log('Starting logout process...')

      // 1. Sign out device session on server
      try {
        const sessionId = await SecureStore.getItemAsync(Keys.DEVICE_SESSION_ID)
        if (sessionId) {
          await sessionRequests.signOutSession(sessionId)
          console.log('Device session signed out on server')
        }
      } catch (sessionError) {
        console.log('Error signing out session:', sessionError)
        // Continue with local logout even if server call fails
      }

      // 2. Clear Zustand store state
      storeLogout()
      clearPortfolio()
      clearAssets()
      clearPoints()
      // Clear other stores...

      // 3. Clear only user-specific AsyncStorage data (not app settings)
      // Note: settings-storage is intentionally excluded to preserve user preferences
      const userDataKeys = [
        'auth-storage', // authStore.ts
        'portfolio-storage', // portfolioStore.ts
        'assets-storage', // assetsStore.ts
        'points-storage', // pointsStore.ts
        'transactions-storage', // transactionsStore.ts
        'token-storage', // tokenStore.ts
        'trending-storage', // trendingStore.ts
        'address-storage', // addressStore.ts
        'address-book-storage', // addressBookStore.ts
        'settings-storage', // - preferences should persist
      ]

      await clearStore()

      await AsyncStorage.multiRemove(userDataKeys)

      // 4. Clear SecureStore items
      await SecureStore.deleteItemAsync(Keys.PRIVY_IDENTITY_TOKEN)
      await SecureStore.deleteItemAsync(Keys.PRIVY_TOKEN_TIMESTAMP)
      await SecureStore.deleteItemAsync(Keys.DEVICE_SESSION_ID)
      await SecureStore.deleteItemAsync(Keys.PUSH_TOKEN)
      // Note: DEVICE_ID is kept as it identifies the device, not the user session
      // Clear biometric-related secure flags
      await SecureStore.deleteItemAsync(Keys.BIOMETRIC_ENABLED)
      await SecureStore.deleteItemAsync(Keys.APP_LOCKED)
      await SecureStore.deleteItemAsync(Keys.DEVICE_ID)

      // 5. Clear notifications badge
      try {
        await clearAllNotifications()
      } catch (notifError) {
        console.log('Error clearing notifications:', notifError)
      }

      // 5b. Reset biometric-related settings (PIN and flags)
      try {
        updateSettings({
          enableBiometricAuth: false,
          biometricSetupCompleted: false,
          biometricPinHash: null,
          lastBiometricPromptDate: null,
          biometricPromptSkipCount: 0,
        })
      } catch (e) {
        console.log('Error resetting biometric settings during logout:', e)
      }
      // 6. Then try to logout from Privy if online
      if (privyIsReady) {
        await privyLogout()
      }

      console.log('Logout process completed successfully')

      // router.replace('/(auth)')
    } catch (error) {
      console.error('Error during logout:', error)
      // Even if Privy logout fails, we've cleared local state
    }
  }

  return {
    refreshTokenIfNeeded,
    getPrivyIdentityToken,
    logout,
  }
}
