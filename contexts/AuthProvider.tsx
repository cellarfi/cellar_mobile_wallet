import { Keys, TOKEN_REFRESH_INTERVAL_MS } from '@/constants/App'
import { sessionRequests } from '@/libs/api_requests/session.request'
import { userRequests } from '@/libs/api_requests/user.request'
import {
  checkBiometricCapabilities,
  lockApp,
  shouldShowBiometricPrompt,
} from '@/libs/biometric.lib'
import { clearAllNotifications } from '@/libs/notifications.lib'
import { useAuthStore } from '@/store/authStore'
import { useNetworkStore } from '@/store/networkStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useIdentityToken, usePrivy } from '@privy-io/expo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  AppState,
  AppStateStatus,
  InteractionManager,
  Linking,
} from 'react-native'

interface AuthContextType {
  isInitialized: boolean
  isNavigating: boolean
  // Auth state (from combined sources)
  user: any
  isAuthenticated: boolean
  isReady: boolean
  lastSync: number | null
  // Network state
  isOnline: boolean | null
  isOffline: boolean
  connectionType: string | null
  isInternetReachable: boolean | null
  // Combined state
  isLoading: boolean
  canRefresh: boolean
  // Biometric lock state
  appIsLocked: boolean
  unlockApp: () => void
  // Actions
  logout: () => Promise<void>
  // Status helpers
  getStatusText: () => string
}

const AuthContext = createContext<AuthContextType>({
  isInitialized: false,
  isNavigating: false,
  user: null,
  isAuthenticated: false,
  isReady: false,
  lastSync: null,
  isOnline: null,
  isOffline: false,
  connectionType: null,
  isInternetReachable: null,
  isLoading: true,
  canRefresh: false,
  appIsLocked: false,
  unlockApp: () => {},
  logout: async () => {},
  getStatusText: () => 'Loading...',
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // const pathname = usePathname()
  // const { url } = useGlobalSearchParams<{ url: string }>()

  // Privy hooks
  const {
    user: privyUser,
    isReady: privyIsReady,
    logout: privyLogout,
  } = usePrivy()
  const { getIdentityToken } = useIdentityToken()

  // Zustand stores
  const {
    user,
    isAuthenticated,
    isReady: authReady,
    lastSync,
    updateFromPrivy,
    logout: storeLogout,
    setProfile,
    clearStore,
  } = useAuthStore()
  const { isOnline, connectionType, isInternetReachable } = useNetworkStore()
  const { settings } = useSettingsStore()

  // Local state
  const [isInitialized, setIsInitialized] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [appIsLocked, setAppIsLocked] = useState(false)
  const [privyInitTimeout, setPrivyInitTimeout] = useState(false)
  const [pendingDeepLink, setPendingDeepLink] = useState<{
    type: 'post' | 'token' | 'browser'
    id: string
    params?: Record<string, string>
  } | null>(null)
  const lastNavigationStateRef = useRef<{
    isAuthenticated: boolean
    userId: string | null
  } | null>(null)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)

  // Timeout for Privy initialization - if it doesn't initialize within 10 seconds,
  // we should still navigate to auth flow
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!privyIsReady) {
        console.log(
          'AuthProvider: Privy initialization timeout, proceeding to auth'
        )
        setPrivyInitTimeout(true)
      }
    }, 10000) // 10 second timeout

    // Clear timeout if Privy becomes ready
    if (privyIsReady) {
      clearTimeout(timeout)
    }

    return () => clearTimeout(timeout)
  }, [privyIsReady])

  // Parse deep link URL to extract type and ID
  const parseDeepLink = useCallback((url: string) => {
    try {
      const urlObj = new URL(url)

      // Handle https://cellar.so/post/{postId}
      const postMatch = urlObj.pathname.match(/^\/post\/([^/]+)$/)
      if (postMatch) {
        return { type: 'post' as const, id: postMatch[1] }
      }

      // Handle https://cellar.so/token/{tokenAddress}
      const tokenMatch = urlObj.pathname.match(/^\/token\/([^/]+)$/)
      if (tokenMatch) {
        const network = urlObj.searchParams.get('network') || 'solana'
        return {
          type: 'token' as const,
          id: tokenMatch[1],
          params: { network },
        }
      }

      return null
    } catch (error) {
      console.log('Error parsing deep link:', error)
      return null
    }
  }, [])

  // Handle incoming deep link URLs
  const handleDeepLink = useCallback(
    (url: string | null) => {
      if (!url) return

      console.log('AuthProvider: Deep link received:', url)

      const parsed = parseDeepLink(url)
      if (parsed) {
        console.log('AuthProvider: Parsed deep link:', parsed)
        setPendingDeepLink(parsed)
      }
    },
    [parseDeepLink]
  )

  // Listen for deep links
  useEffect(() => {
    // Handle initial URL when app opens
    Linking.getInitialURL().then(handleDeepLink)

    // Listen for URL changes while app is open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url)
    })

    return () => subscription.remove()
  }, [handleDeepLink])

  // Handle deep links when user is already authenticated
  useEffect(() => {
    if (
      pendingDeepLink &&
      isAuthenticated &&
      user &&
      !isNavigating &&
      isInitialized
    ) {
      console.log(
        'AuthProvider: Processing deep link for authenticated user:',
        pendingDeepLink
      )

      if (pendingDeepLink.type === 'post') {
        router.push({
          pathname: '/(screens)/post-details',
          params: { postId: pendingDeepLink.id },
        })
      } else if (pendingDeepLink.type === 'token') {
        router.push({
          pathname: '/(screens)/token-detail',
          params: { tokenAddress: pendingDeepLink.id },
        })
      } else if (pendingDeepLink.type === 'browser') {
        router.push({
          pathname: '/(screens)/browser',
          params: { url: pendingDeepLink.id },
        })
      }

      setPendingDeepLink(null)
    }
  }, [pendingDeepLink, isAuthenticated, user, isNavigating, isInitialized])

  const checkAppLockStatus = useCallback(async () => {
    if (isAuthenticated && settings.enableBiometricAuth) {
      // On app mount, if biometric is enabled, lock the app
      await lockApp()
      setAppIsLocked(true)
    }
  }, [isAuthenticated, settings.enableBiometricAuth])

  const checkAndPromptBiometricSetup = useCallback(async () => {
    // Check if biometric hardware is available
    const capabilities = await checkBiometricCapabilities()
    if (!capabilities.isAvailable) {
      return
    }

    // Check if we should show the prompt
    const shouldPrompt = shouldShowBiometricPrompt(
      settings.lastBiometricPromptDate,
      settings.biometricPromptSkipCount,
      settings.biometricSetupCompleted
    )

    if (shouldPrompt) {
      // Wait a bit before showing the modal to avoid jarring UX
      setTimeout(() => {
        router.push('/(modals)/setup-biometric')
      }, 1000)
    }
  }, [
    settings.lastBiometricPromptDate,
    settings.biometricPromptSkipCount,
    settings.biometricSetupCompleted,
  ])

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
    if (isAuthenticated && privyIsReady && privyUser) {
      await getPrivyIdentityToken(false) // Will only refresh if stale
    }
  }, [isAuthenticated, privyIsReady, privyUser, getPrivyIdentityToken])

  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      const previousAppState = appStateRef.current
      appStateRef.current = nextAppState

      // Lock the app when going to background
      if (
        isAuthenticated &&
        settings.enableBiometricAuth &&
        settings.autoLockEnabled &&
        previousAppState === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // If immediate lock, lock right away
        if (settings.autoLockTimeout === 0) {
          await lockApp()
          setAppIsLocked(true)
        } else {
          // Otherwise, set a timeout to lock after specified duration
          setTimeout(async () => {
            await lockApp()
            setAppIsLocked(true)
          }, settings.autoLockTimeout)
        }
      }

      // When app becomes active
      if (
        previousAppState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Check if we should prompt for biometric setup
        if (isAuthenticated && !settings.enableBiometricAuth) {
          checkAndPromptBiometricSetup()
        }

        // Refresh token if it's stale (older than 1 hour)
        refreshTokenIfNeeded()
      }
    },
    [
      isAuthenticated,
      settings.enableBiometricAuth,
      settings.autoLockEnabled,
      settings.autoLockTimeout,
      checkAndPromptBiometricSetup,
      refreshTokenIfNeeded,
    ]
  )

  // Check if app is locked on mount
  useEffect(() => {
    checkAppLockStatus()
  }, [checkAppLockStatus])

  // Handle app state changes for biometric lock
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    )
    return () => subscription.remove()
  }, [handleAppStateChange])

  // Suggest biometric setup after user is fully authenticated AND navigation is complete
  // This prevents the biometric modal from being overridden by navigation to tabs
  useEffect(() => {
    if (
      isAuthenticated &&
      !settings.enableBiometricAuth &&
      isInitialized &&
      !isNavigating
    ) {
      // Wait for navigation to fully complete before showing biometric prompt
      const t = setTimeout(() => {
        checkAndPromptBiometricSetup()
      }, 1500) // Longer delay to ensure tabs screen is fully loaded
      return () => clearTimeout(t)
    }
  }, [
    isAuthenticated,
    settings.enableBiometricAuth,
    checkAndPromptBiometricSetup,
    isInitialized,
    isNavigating,
  ])

  // Enhanced logout function that clears both Privy and local state
  const enhancedLogout = async () => {
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
      await AsyncStorage.clear()

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
        const { updateSettings } =
          require('@/store/settingsStore').useSettingsStore.getState()
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
      // if (privyIsReady && privyUser) {
      if (privyIsReady) {
        await privyLogout()
      }

      console.log('Logout process completed successfully')

      router.replace('/(auth)')
    } catch (error) {
      console.error('Error during logout:', error)
      // Even if Privy logout fails, we've cleared local state
    }
  }

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

  // Computed auth state
  const isOffline = isOnline === false
  // Loading if no ready state and no cached user, unless Privy timed out
  const isLoading = !authReady && !user && !privyInitTimeout

  // Handle navigation based on auth state
  useEffect(() => {
    console.log('AuthProvider: Auth state changed:', {
      user: !!user,
      isAuthenticated,
      isReady: authReady,
      isLoading,
      privyInitTimeout,
      userId: user?.id,
    })

    // Only navigate when we're not loading and not already navigating
    if (!isLoading && !isNavigating) {
      const currentState = { isAuthenticated, userId: user?.id || null }

      // Check if this is a meaningful auth state change that requires navigation
      const shouldNavigate =
        !lastNavigationStateRef.current ||
        lastNavigationStateRef.current.isAuthenticated !==
          currentState.isAuthenticated ||
        lastNavigationStateRef.current.userId !== currentState.userId ||
        privyInitTimeout // Also navigate if Privy timed out

      if (shouldNavigate) {
        setIsNavigating(true)
        lastNavigationStateRef.current = currentState

        // Use InteractionManager to ensure navigation happens after the component is fully mounted
        InteractionManager.runAfterInteractions(() => {
          if (isAuthenticated && user) {
            console.log('AuthProvider: Navigating to main app (authenticated)')
            // User is authenticated (either from Privy or cached), go to main app

            // Check if we have a pending deep link
            if (pendingDeepLink) {
              console.log(
                'AuthProvider: Navigating to deep link:',
                pendingDeepLink
              )

              if (pendingDeepLink.type === 'post') {
                router.replace({
                  pathname: '/(screens)/post-details',
                  params: { postId: pendingDeepLink.id },
                })
              } else if (pendingDeepLink.type === 'token') {
                router.replace({
                  pathname: '/(screens)/token-detail',
                  params: { tokenAddress: pendingDeepLink.id },
                })
              } else if (pendingDeepLink.type === 'browser') {
                router.replace({
                  pathname: '/(screens)/browser',
                  params: { url: pendingDeepLink.id },
                })
              }

              setPendingDeepLink(null) // Clear the pending deep link
            } else {
              router.replace('/(tabs)')
            }
          } else {
            // User is not authenticated, go to auth flow
            console.log(
              'AuthProvider: Navigating to auth flow (not authenticated)'
            )
            router.replace('/(auth)')
          }

          // Mark as initialized after first navigation
          setIsInitialized(true)
          setIsNavigating(false)
        })
      }
    }
  }, [
    user,
    isAuthenticated,
    isLoading,
    authReady,
    pendingDeepLink,
    isNavigating,
    privyInitTimeout,
  ])

  // Status helper function
  const getStatusText = (): string => {
    if (isLoading) return 'Loading...'
    if (isOffline) {
      if (isAuthenticated) return 'Offline - Using cached data'
      return 'Offline - Limited functionality'
    }
    return 'Online'
  }

  // Track if profile has been checked this session to avoid duplicate redirects
  const profileCheckedRef = useRef(false)

  useEffect(() => {
    // Reset profile checked flag when user logs out
    if (!isAuthenticated) {
      profileCheckedRef.current = false
      return
    }

    // Skip if still navigating (let verify-email.tsx handle the initial redirect)
    if (isNavigating || !isInitialized) {
      return
    }

    // Skip if we already checked profile this session
    if (profileCheckedRef.current) {
      return
    }

    const getUser = async () => {
      const { data, message, success } = await userRequests.getProfile()
      console.log('getUser() data', data)

      profileCheckedRef.current = true

      if (!success) {
        if (message === 'User not found') {
          // Only redirect if we're not already on setup-profile
          // verify-email.tsx handles the initial redirect after login
          console.log(
            'AuthProvider: User not found, but letting login flow handle redirect'
          )
        } else {
          console.log('AuthProvider: Error getting user:', message)
        }
        return
      }

      if (data) setProfile(data)

      console.log('AuthProvider: User data:', data)
    }
    InteractionManager.runAfterInteractions(() => {
      getUser()
    })
  }, [isAuthenticated, isNavigating, isInitialized, setProfile])

  const handleUnlockApp = () => {
    setAppIsLocked(false)
  }

  return (
    <AuthContext.Provider
      value={{
        isInitialized,
        isNavigating,
        // Auth state
        user,
        isAuthenticated,
        isReady: authReady,
        lastSync,
        // Network state
        isOnline,
        isOffline,
        connectionType,
        isInternetReachable,
        // Combined state
        isLoading,
        canRefresh: isOnline === true,
        // Biometric lock state
        appIsLocked,
        unlockApp: handleUnlockApp,
        // Actions
        logout: enhancedLogout,
        // Status helpers
        getStatusText,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
