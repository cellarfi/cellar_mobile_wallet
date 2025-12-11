import PostCard from '@/components/core/social/PostCard'
import { usePostActions } from '@/hooks/usePostActions'
import { PostsRequests } from '@/libs/api_requests/posts.request'
import { usePostDeleteStore } from '@/store/socialEventsStore'
import { Post } from '@/types/posts.interface'
import { Ionicons } from '@expo/vector-icons'
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Text, View } from 'react-native'

interface UserPostsProps {
  tagName: string
  isOwnProfile?: boolean
  refreshTrigger?: number
}

export default function UserPosts({
  tagName,
  isOwnProfile = true,
  refreshTrigger = 0,
}: UserPostsProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMorePages, setHasMorePages] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Listen for post deletions
  const pendingDeleteId = usePostDeleteStore((state) => state.pendingDeleteId)
  const clearPendingDelete = usePostDeleteStore(
    (state) => state.clearPendingDelete
  )

  // Handle post deletions
  useEffect(() => {
    if (pendingDeleteId) {
      setPosts((prev) => prev.filter((post) => post.id !== pendingDeleteId))
      clearPendingDelete()
    }
  }, [pendingDeleteId, clearPendingDelete])

  const fetchUserPosts = useCallback(
    async (page = 1, append = false) => {
      if (!tagName) return

      if (page === 1) {
        // Only show full loading state if we have no posts (initial load)
        // For refresh (posts exist), we rely on parent's RefreshControl
        if (posts.length === 0) {
          setLoading(true)
        }
        setError(null)
      } else {
        setIsLoadingMore(true)
      }

      try {
        // Use the new paginated getUserPosts endpoint for all users
        const response = await PostsRequests.getUserPosts(
          tagName,
          String(page),
          '10'
        )

        if (response.success) {
          const newPosts = response.data as Post[]

          if (append) {
            setPosts((prev) => [...prev, ...newPosts])
          } else {
            setPosts(newPosts)
          }

          // Check pagination
          if (response.pagination) {
            setHasMorePages(page < response.pagination.totalPages)
          } else {
            setHasMorePages(false)
          }
        } else {
          if (!append) {
            setPosts([])
          }
          setError(response.message || 'Failed to fetch posts')
          setHasMorePages(false)
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch posts')
        setHasMorePages(false)
      } finally {
        setLoading(false)
        setIsLoadingMore(false)
      }
    },
    [tagName]
  )

  useEffect(() => {
    setCurrentPage(1)
    setHasMorePages(true)
    fetchUserPosts(1, false)
  }, [fetchUserPosts, refreshTrigger])

  const handleEndReached = useCallback(() => {
    // Enable infinite scroll for all users with pagination
    if (hasMorePages && !isLoadingMore && !loading) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      fetchUserPosts(nextPage, true)
    }
  }, [hasMorePages, isLoadingMore, loading, currentPage, fetchUserPosts])

  // Use centralized post actions hook
  const { handleLike } = usePostActions({ posts, setPosts })

  // Handle post deletion
  const handleDelete = useCallback((postId: string) => {
    usePostDeleteStore.getState().deletePost(postId)
  }, [])

  const renderFooter = () => {
    if (!isLoadingMore) return null

    return (
      <View className='py-4 items-center'>
        <ActivityIndicator color='#6366f1' />
      </View>
    )
  }

  if (loading && posts.length === 0) {
    return (
      <View className='px-6 py-8 items-center'>
        <ActivityIndicator color='#6366f1' size='large' />
        <Text className='text-gray-400 mt-4'>Loading posts...</Text>
      </View>
    )
  }

  if (error && posts.length === 0) {
    return (
      <View className='px-6 py-8 items-center'>
        <Ionicons name='alert-circle-outline' size={48} color='#ef4444' />
        <Text className='text-red-400 mt-4'>{error}</Text>
      </View>
    )
  }

  return (
    <View className='px-6 mb-6'>
      <Text className='text-white text-lg font-semibold mb-4'>
        {isOwnProfile ? 'My Posts' : 'Posts'}
      </Text>
      {posts.length === 0 ? (
        <View className='py-8 items-center'>
          <Ionicons
            name='chatbubble-outline'
            size={48}
            color='#6366f1'
            style={{ opacity: 0.5 }}
          />
          <Text className='text-gray-400 mt-4 text-lg'>No posts yet</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard post={item} onLike={handleLike} onDelete={handleDelete} />
          )}
          scrollEnabled={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
        />
      )}
    </View>
  )
}
