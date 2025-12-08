import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Linking } from 'react-native';

export const useDeepLinks = (
  isAuthenticated: boolean,
  user: any,
  isNavigating: boolean,
  isInitialized: boolean,
  pendingDeepLink: { type: string; id: string; params?: Record<string, string> } | null,
  setPendingDeepLink: (link: any) => void
) => {
  // Internal state removed, using props instead
  // const [pendingDeepLink, setPendingDeepLink] = useState<{
  //   type: 'post' | 'token' | 'browser'
  //   id: string
  //   params?: Record<string, string>
  // } | null>(null)

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
    [parseDeepLink, setPendingDeepLink]
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
  }, [pendingDeepLink, isAuthenticated, user, isNavigating, isInitialized, setPendingDeepLink])
}
