import { useAuthNavigation } from '@/hooks/auth/useAuthNavigation'
import { useBiometricLock } from '@/hooks/auth/useBiometricLock'
import { useDeepLinks } from '@/hooks/auth/useDeepLinks'
import { useSessionManager } from '@/hooks/auth/useSessionManager'
import { useUserProfile } from '@/hooks/auth/useUserProfile'
import { useNotifications, usePushTokenRefresh } from '@/hooks/useNotifications'
import { useAuthStore } from '@/store/authStore'
import { useNetworkStore } from '@/store/networkStore'
import { usePrivy } from '@privy-io/expo'
import React, { createContext, useContext, useEffect, useState } from 'react'

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
  // Privy hooks
  const { isReady: privyIsReady } = usePrivy()

  // Zustand stores
  const { user, isAuthenticated, isReady: authReady, lastSync } = useAuthStore()
  const { isOnline, connectionType, isInternetReachable } = useNetworkStore()

  // Local state
  const [isInitialized, setIsInitialized] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [privyInitTimeout, setPrivyInitTimeout] = useState(false)
  const [pendingDeepLink, setPendingDeepLink] = useState<{
    type: 'post' | 'token' | 'browser'
    id: string
    params?: Record<string, string>
  } | null>(null)

  // send token manually
  // const { sendTransaction } = useSendManualTransaction()
  // useEffect(() => {
  //   // Call manually with your parameters
  //   const sendTx = async () => {
  //     const result = await sendTransaction({
  //     token: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  //     recipientAddress: '5SEZmBS8s41cJ8g3gmLS1BexujHcNZHe5qznPJMdVUsh',
  //     amount: 100,
  //     walletAddress: 'HpfNcsSEDZQ8bi9mrPezsSQTEafuJwsWEcdyMG6G1z1q',
  //     isSOLToken: false
  //     })
  //     console.log('result', result)
  //   }
  //   console.log('sending tx .......')
  //   sendTx()
  // }, [privyIsReady])

  // Timeout for Privy initialization
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!privyIsReady) {
        console.log(
          'AuthProvider: Privy initialization timeout, proceeding to auth',
        )
        setPrivyInitTimeout(true)
      }
    }, 10000) // 10 second timeout

    if (privyIsReady) {
      clearTimeout(timeout)
    }

    return () => clearTimeout(timeout)
  }, [privyIsReady])

  // Computed auth state
  const isOffline = isOnline === false
  // Loading if no ready state and no cached user, unless Privy timed out
  const isLoading = !authReady && !user && !privyInitTimeout

  // Custom Hooks
  const { refreshTokenIfNeeded, logout } = useSessionManager(isAuthenticated)

  // Deep Links Hook
  useDeepLinks(
    isAuthenticated,
    user,
    isNavigating,
    isInitialized,
    pendingDeepLink,
    setPendingDeepLink,
  )

  // Notification Hooks
  useNotifications()
  usePushTokenRefresh()

  // Auth Navigation Hook
  useAuthNavigation(
    isAuthenticated,
    user,
    isLoading,
    authReady,
    privyInitTimeout,
    pendingDeepLink,
    setPendingDeepLink,
    setIsNavigating,
    setIsInitialized,
  )

  // Biometric Lock Hook
  const { appIsLocked, unlockApp } = useBiometricLock(
    isAuthenticated,
    isInitialized,
    isNavigating,
    refreshTokenIfNeeded,
  )

  // User Profile Hook
  useUserProfile(isAuthenticated, isNavigating, isInitialized)

  // Status helper function
  const getStatusText = (): string => {
    if (isLoading) return 'Loading...'
    if (isOffline) {
      if (isAuthenticated) return 'Offline - Using cached data'
      return 'Offline - Limited functionality'
    }
    return 'Online'
  }

  return (
    <AuthContext.Provider
      value={{
        isInitialized,
        isNavigating,
        user,
        isAuthenticated,
        isReady: authReady,
        lastSync,
        isOnline,
        isOffline,
        connectionType,
        isInternetReachable,
        isLoading,
        canRefresh: isOnline === true,
        appIsLocked,
        unlockApp,
        logout,
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
