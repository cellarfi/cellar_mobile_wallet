import { userRequests } from '@/libs/api_requests/user.request'
import { useAuthStore } from '@/store/authStore'
import { useEffect, useRef } from 'react'
import { InteractionManager } from 'react-native'

export const useUserProfile = (
  isAuthenticated: boolean,
  isNavigating: boolean,
  isInitialized: boolean
) => {
  const { setProfile } = useAuthStore()
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
}
