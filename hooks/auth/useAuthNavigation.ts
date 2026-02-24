import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';

export const useAuthNavigation = (
  isAuthenticated: boolean,
  user: any,
  isLoading: boolean,
  authReady: boolean,
  privyInitTimeout: boolean,
  pendingDeepLink: { type: string; id: string } | null,
  setPendingDeepLink: (link: any) => void,
  setIsNavigating: (isNavigating: boolean) => void,
  setIsInitialized: (isInitialized: boolean) => void
) => {
  // Internal state removed, using props instead
  // const [isInitialized, setIsInitialized] = useState(false)
  // const [isNavigating, setIsNavigating] = useState(false)
  
  // We need to track isNavigating locally to prevent duplicate calls in the effect dependency?
  // No, the parent component manages the state.
  // But we need to know the CURRENT value of isNavigating to check `!isNavigating`.
  // So we need to accept `isNavigating` as a prop too?
  // Yes, let's add it.
  
  // Wait, if I change the signature here, I need to update AuthProvider too.
  // AuthProvider passes (..., setIsNavigating, setIsInitialized).
  // It doesn't pass `isNavigating` value.
  // I should add `isNavigating` value to the props.
  
  const lastNavigationStateRef = useRef<{
    isAuthenticated: boolean
    userId: string | null
  } | null>(null)
  
  // We need a ref to track if we are currently navigating to avoid dependency loops if we pass isNavigating as prop
  const isNavigatingRef = useRef(false)

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
    if (!isLoading && !isNavigatingRef.current) {
      const currentState = { isAuthenticated, userId: user?.id || null }

      // Check if this is a meaningful auth state change that requires navigation
      const shouldNavigate =
        !lastNavigationStateRef.current ||
        lastNavigationStateRef.current.isAuthenticated !==
          currentState.isAuthenticated ||
        lastNavigationStateRef.current.userId !== currentState.userId ||
        privyInitTimeout // Also navigate if Privy timed out

      if (shouldNavigate) {
        isNavigatingRef.current = true
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
          isNavigatingRef.current = false
        })
      }
    }
  }, [
    user,
    isAuthenticated,
    isLoading,
    authReady,
    pendingDeepLink,
    privyInitTimeout,
    setPendingDeepLink,
    setIsNavigating,
    setIsInitialized
  ])
}
