import { useAuthStore } from '@/store/authStore'
import { usePrivy } from '@privy-io/expo'
import { useMemo } from 'react'

export function useAuth() {
  const { user: privyUser, isReady, logout: privyLogout } = usePrivy()
  const { user: cachedUser, isAuthenticated: cachedAuth } = useAuthStore()

  const authState = useMemo(() => {
    // If Privy is ready, use Privy's state
    if (isReady) {
      return {
        isLoading: false,
        isAuthenticated: !!privyUser,
        user: privyUser,
      }
    }

    // If Privy is not ready but we have cached auth data, use it for offline mode
    if (cachedUser && cachedAuth) {
      return {
        isLoading: false,
        isAuthenticated: true,
        user: cachedUser,
      }
    }

    // No cached data and Privy not ready - still loading
    return {
      isLoading: true,
      isAuthenticated: false,
      user: null,
    }
  }, [privyUser, isReady, cachedUser, cachedAuth])

  return {
    ...authState,
    logout: privyLogout,
    isReady,
  }
}
