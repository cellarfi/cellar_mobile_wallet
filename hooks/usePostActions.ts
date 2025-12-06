import { PostsRequests } from '@/libs/api_requests/posts.request'
import { Post } from '@/types/posts.interface'
import { useCallback } from 'react'

interface UsePostActionsProps {
  posts: Post[]
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>
}

interface UsePostActionsReturn {
  handleLike: (postId: string) => Promise<void>
  handleDelete: (postId: string) => Promise<boolean>
  updatePost: (postId: string, updates: Partial<Post>) => void
}

/**
 * Centralized hook for common post actions (like, delete, etc.)
 * Use this hook instead of duplicating post action logic across components
 */
export function usePostActions({
  posts,
  setPosts,
}: UsePostActionsProps): UsePostActionsReturn {
  /**
   * Handle like/unlike with optimistic updates and error revert
   */
  const handleLike = useCallback(
    async (postId: string) => {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      const wasLiked = post.like?.status
      const previousLikeCount = post._count?.like || 0

      // Optimistic update
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                like: {
                  ...p.like,
                  status: !wasLiked,
                },
                _count: {
                  ...p._count,
                  like: wasLiked
                    ? Math.max(previousLikeCount - 1, 0)
                    : previousLikeCount + 1,
                },
              }
            : p
        )
      )

      try {
        if (wasLiked) {
          // Unlike the post
          const response = await PostsRequests.unlikePost(
            post.like?.id || '',
            postId
          )
          if (!response.success) {
            throw new Error('Failed to unlike post')
          }
        } else {
          // Like the post
          const response = await PostsRequests.likePost(postId)
          if (!response.success) {
            throw new Error('Failed to like post')
          }

          // Update the like id with the response data
          setPosts((prevPosts) =>
            prevPosts.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    like: { ...p.like, id: response.data.id },
                  }
                : p
            )
          )
        }
        // Note: Don't call triggerRefresh() here as optimistic updates already handle UI
        // and triggering refresh would replace all paginated posts with just page 1
      } catch (error) {
        console.error('Failed to update like status:', error)

        // Revert the optimistic update
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  like: {
                    ...p.like,
                    status: wasLiked,
                  },
                  _count: {
                    ...p._count,
                    like: previousLikeCount,
                  },
                }
              : p
          )
        )

        // You can customize error handling (toast, alert, etc.)
        throw error
      }
    },
    [posts, setPosts]
  )

  /**
   * Handle post deletion with confirmation
   */
  const handleDelete = useCallback(
    async (postId: string): Promise<boolean> => {
      try {
        const response = await PostsRequests.deletePost(postId)
        if (response.success) {
          // Remove from local state - no need to triggerRefresh() as that would
          // replace all paginated posts with just page 1, causing posts to disappear
          setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId))
          return true
        }
        return false
      } catch (error) {
        console.error('Failed to delete post:', error)
        return false
      }
    },
    [setPosts]
  )

  /**
   * Update a single post in the list
   */
  const updatePost = useCallback(
    (postId: string, updates: Partial<Post>) => {
      setPosts((prevPosts) =>
        prevPosts.map((p) => (p.id === postId ? { ...p, ...updates } : p))
      )
    },
    [setPosts]
  )

  return {
    handleLike,
    handleDelete,
    updatePost,
  }
}

/**
 * Multi-list hook for scenarios with multiple post arrays (like tabs)
 * Automatically finds the post in the correct list and updates it
 */
interface UseMultiPostActionsProps {
  postLists: {
    posts: Post[]
    setPosts: React.Dispatch<React.SetStateAction<Post[]>>
  }[]
}

export function useMultiPostActions({ postLists }: UseMultiPostActionsProps) {
  const handleLike = useCallback(
    async (postId: string) => {
      // Find which list contains the post
      let targetList: (typeof postLists)[0] | null = null
      let post: Post | null = null

      for (const list of postLists) {
        const found = list.posts.find((p) => p.id === postId)
        if (found) {
          targetList = list
          post = found
          break
        }
      }

      if (!targetList || !post) return

      const wasLiked = post.like?.status
      const previousLikeCount = post._count?.like || 0

      // Optimistic update on all lists (post might exist in multiple)
      const updateFn = (prevPosts: Post[]) =>
        prevPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                like: { ...p.like, status: !wasLiked },
                _count: {
                  ...p._count,
                  like: wasLiked
                    ? Math.max(previousLikeCount - 1, 0)
                    : previousLikeCount + 1,
                },
              }
            : p
        )

      postLists.forEach((list) => list.setPosts(updateFn))

      try {
        if (wasLiked) {
          const response = await PostsRequests.unlikePost(
            post.like?.id || '',
            postId
          )
          if (!response.success) throw new Error('Failed to unlike post')
        } else {
          const response = await PostsRequests.likePost(postId)
          if (!response.success) throw new Error('Failed to like post')

          // Update with new like id
          const updateLikeId = (prevPosts: Post[]) =>
            prevPosts.map((p) =>
              p.id === postId
                ? { ...p, like: { ...p.like, id: response.data.id } }
                : p
            )
          postLists.forEach((list) => list.setPosts(updateLikeId))
        }
        // Note: Don't call triggerRefresh() here as optimistic updates already handle UI
        // and triggering refresh would replace all paginated posts with just page 1
      } catch (error) {
        console.error('Failed to update like status:', error)
        // Revert all lists
        const revertFn = (prevPosts: Post[]) =>
          prevPosts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  like: { ...p.like, status: wasLiked },
                  _count: { ...p._count, like: previousLikeCount },
                }
              : p
          )
        postLists.forEach((list) => list.setPosts(revertFn))
        throw error
      }
    },
    [postLists]
  )

  return { handleLike }
}

/**
 * Standalone like function for single post scenarios (like post-details)
 * Returns updated post state
 */
export async function likePost(
  post: Post,
  onUpdate: (updatedPost: Post) => void
): Promise<void> {
  const wasLiked = post.like?.status
  const previousLikeCount = post._count?.like || 0

  // Optimistic update
  const optimisticPost: Post = {
    ...post,
    like: {
      ...post.like,
      status: !wasLiked,
    },
    _count: {
      ...post._count,
      like: wasLiked
        ? Math.max(previousLikeCount - 1, 0)
        : previousLikeCount + 1,
    },
  }
  onUpdate(optimisticPost)

  try {
    if (wasLiked) {
      const response = await PostsRequests.unlikePost(
        post.like?.id || '',
        post.id
      )
      if (!response.success) {
        throw new Error('Failed to unlike post')
      }
    } else {
      const response = await PostsRequests.likePost(post.id)
      if (!response.success) {
        throw new Error('Failed to like post')
      }

      // Update with the new like id
      onUpdate({
        ...optimisticPost,
        like: { ...optimisticPost.like, id: response.data.id },
      })
    }
  } catch (error) {
    // Revert to original state
    onUpdate(post)
    throw error
  }
}

export default usePostActions
