import { Keys } from '@/constants/App'
import { userRequests } from '@/libs/api_requests/user.request'
import { useAuthStore } from '@/store/authStore'
import { useNetworkStore } from '@/store/networkStore'
import { useIdentityToken, usePrivy } from '@privy-io/expo'
import { router, useGlobalSearchParams, usePathname } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { InteractionManager } from 'react-native'

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
  logout: async () => {},
  getStatusText: () => 'Loading...',
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname()
  const { url } = useGlobalSearchParams<{ url: string }>()

  console.log('AuthProvider: pathname:', pathname)
  console.log('AuthProvider: url:', url)

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

  // Local state
  const [isInitialized, setIsInitialized] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [pendingDeepLink, setPendingDeepLink] = useState<{
    url: string
    pathname: string
  } | null>(null)
  const lastNavigationStateRef = useRef<{
    isAuthenticated: boolean
    userId: string | null
  } | null>(null)

  // Handle deep link changes
  useEffect(() => {
    if (url && pathname.includes('/browser')) {
      console.log('AuthProvider: Deep link detected:', { url, pathname })
      setPendingDeepLink({ url, pathname })
    }
  }, [url, pathname])

  // Handle deep link navigation when user is already authenticated
  useEffect(() => {
    if (pendingDeepLink && isAuthenticated && user && !isNavigating) {
      console.log(
        'AuthProvider: Processing pending deep link:',
        pendingDeepLink
      )
      router.replace({
        pathname: '/(modals)/browser',
        params: {
          url: pendingDeepLink.url,
        },
      })
      setPendingDeepLink(null)
    }
  }, [pendingDeepLink, isAuthenticated, user, isNavigating])

  // Get Privy access token
  const getPrivyIdentityToken = async () => {
    console.log('Getting Privy access token...', privyIsReady, !!privyUser)
    if (privyIsReady && privyUser && getIdentityToken) {
      const token = await getIdentityToken()
      console.log('Privy identity token:', token)
      if (token) {
        console.log('Setting Privy identity token:', token)
        await SecureStore.setItemAsync(Keys.PRIVY_IDENTITY_TOKEN, token)
      }
    }
  }

  // Enhanced logout function that clears both Privy and local state
  const enhancedLogout = async () => {
    try {
      // First clear local state
      storeLogout()

      // Then try to logout from Privy if online
      if (privyIsReady && privyUser) {
        await privyLogout()
        await SecureStore.deleteItemAsync(Keys.PRIVY_IDENTITY_TOKEN)
      }
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
  }, [privyUser, privyIsReady, updateFromPrivy])

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
            console.log(
              'AuthProvider: User authenticated, navigating to main app'
            )

            // Check if we have a pending deep link
            if (pendingDeepLink) {
              console.log(
                'AuthProvider: Navigating to browser with deep link:',
                pendingDeepLink
              )
              router.replace({
                pathname: '/(modals)/browser',
                params: {
                  url: pendingDeepLink.url,
                },
              })
              setPendingDeepLink(null) // Clear the pending deep link
            } else {
              console.log('AuthProvider: Navigating to tabs (no deep link)')
              router.replace('/(tabs)')
            }
          } else {
            // User is not authenticated, go to auth flow
            console.log(
              'AuthProvider: User not authenticated, navigating to auth flow'
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
  }, [isAuthenticated])

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
