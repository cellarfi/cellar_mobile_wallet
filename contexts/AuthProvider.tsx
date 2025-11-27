import { Keys } from '@/constants/App'
import { userRequests } from '@/libs/api_requests/user.request'
import {
  checkBiometricCapabilities,
  lockApp,
  shouldShowBiometricPrompt,
} from '@/libs/biometric.lib'
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
import { AppState, AppStateStatus, InteractionManager } from 'react-native'

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
  } = useAuthStore()
  const { isOnline, connectionType, isInternetReachable } = useNetworkStore()
  const { settings } = useSettingsStore()

  // Local state
  const [isInitialized, setIsInitialized] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [appIsLocked, setAppIsLocked] = useState(false)
  const [pendingDeepLink, setPendingDeepLink] = useState<{
    url: string
    pathname: string
  } | null>(null)
  const lastNavigationStateRef = useRef<{
    isAuthenticated: boolean
    userId: string | null
  } | null>(null)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)

  // Handle deep link changes
  // useEffect(() => {
  //   if (url && pathname.includes('/browser')) {
  //     // console.log('AuthProvider: Deep link detected:', { url, pathname })
  //     setPendingDeepLink({ url, pathname })
  //   }
  // }, [url, pathname])

  // // Handle deep link navigation when user is already authenticated
  // useEffect(() => {
  //   if (pendingDeepLink && isAuthenticated && user && !isNavigating) {
  //     // console.log(
  //     //   'AuthProvider: Processing pending deep link:',
  //     //   pendingDeepLink
  //     // )
  //     router.replace({
  //       pathname: '/(modals)/browser',
  //       params: {
  //         url: pendingDeepLink.url,
  //       },
  //     })
  //     setPendingDeepLink(null)
  //   }
  // }, [pendingDeepLink, isAuthenticated, user, isNavigating])

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
      }, 0)
    }
  }, [
    settings.lastBiometricPromptDate,
    settings.biometricPromptSkipCount,
    settings.biometricSetupCompleted,
  ])

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

      // Check if we should prompt for biometric setup when app becomes active
      if (
        isAuthenticated &&
        !settings.enableBiometricAuth &&
        previousAppState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        checkAndPromptBiometricSetup()
      }
    },
    [
      isAuthenticated,
      settings.enableBiometricAuth,
      settings.autoLockEnabled,
      settings.autoLockTimeout,
      checkAndPromptBiometricSetup,
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

  // Suggest biometric setup immediately after user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && !settings.enableBiometricAuth) {
      // slight delay to avoid racing navigation transitions
      const t = setTimeout(() => {
        checkAndPromptBiometricSetup()
      }, 300)
      return () => clearTimeout(t)
    }
  }, [
    isAuthenticated,
    settings.enableBiometricAuth,
    checkAndPromptBiometricSetup,
  ])

  // Get Privy access token
  const getPrivyIdentityToken = useCallback(async () => {
    console.log('Getting Privy access token...', privyIsReady, !!privyUser)
    if (privyIsReady && privyUser && getIdentityToken) {
      const token = await getIdentityToken()
      console.log('Privy identity token:', token)
      if (token) {
        console.log('Setting Privy identity token:', token)
        await SecureStore.setItemAsync(Keys.PRIVY_IDENTITY_TOKEN, token)
      }
    }
  }, [privyIsReady, privyUser, getIdentityToken])

  // Enhanced logout function that clears both Privy and local state
  const enhancedLogout = async () => {
    try {
      console.log('Starting logout process...')

      // 1. Clear Zustand store state
      storeLogout()

      // 2. Clear only user-specific AsyncStorage data (not app settings)
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

      await AsyncStorage.multiRemove(userDataKeys)

      // 3. Clear SecureStore items
      await SecureStore.deleteItemAsync(Keys.PRIVY_IDENTITY_TOKEN)
      // Clear biometric-related secure flags
      await SecureStore.deleteItemAsync(Keys.BIOMETRIC_ENABLED)
      await SecureStore.deleteItemAsync(Keys.APP_LOCKED)

      // 3b. Reset biometric-related settings (PIN and flags)
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
      // 4. Then try to logout from Privy if online
      // if (privyIsReady && privyUser) {
      if (privyIsReady) {
        await privyLogout()
      }

      console.log('Logout process completed successfully')
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
    getPrivyIdentityToken()
  }, [privyUser, privyIsReady, updateFromPrivy, getPrivyIdentityToken])

  // Computed auth state
  const isOffline = isOnline === false
  const isLoading = !authReady && !user // Loading if no ready state and no cached user

  // Handle navigation based on auth state
  useEffect(() => {
    console.log('AuthProvider: Auth state changed:', {
      user: !!user,
      isAuthenticated,
      isReady: authReady,
      isLoading,
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
        lastNavigationStateRef.current.userId !== currentState.userId

      if (shouldNavigate) {
        setIsNavigating(true)
        lastNavigationStateRef.current = currentState

        // Use InteractionManager to ensure navigation happens after the component is fully mounted
        InteractionManager.runAfterInteractions(() => {
          if (isAuthenticated && user) {
            // User is authenticated (either from Privy or cached), go to main app

            // Check if we have a pending deep link
            if (pendingDeepLink) {
              router.replace({
                pathname: '/(screens)/browser',
                params: {
                  url: pendingDeepLink.url,
                },
              })
              setPendingDeepLink(null) // Clear the pending deep link
            } else {
              router.replace('/(tabs)')
            }
          } else {
            // User is not authenticated, go to auth flow
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

  useEffect(() => {
    const getUser = async () => {
      const { data, message, success } = await userRequests.getProfile()

      if (!success) {
        if (message === 'User not found') {
          router.replace('/setup-profile')
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
  }, [isAuthenticated, setProfile])

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
