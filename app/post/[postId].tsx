import { Redirect, useLocalSearchParams } from 'expo-router'

/**
 * Deep link handler for https://cellar.so/post/{postId}
 * Redirects to the post-details screen with the postId param
 */
export default function PostDeepLink() {
  const { postId } = useLocalSearchParams<{ postId: string }>()

  return (
    <Redirect
      href={{
        pathname: '/(screens)/post-details',
        params: { postId },
      }}
    />
  )
}
