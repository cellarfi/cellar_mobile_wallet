import PostCard from '@/components/core/social/PostCard'
import { PostsRequests } from '@/libs/api_requests/posts.request'
import { userRequests } from '@/libs/api_requests/user.request'
import { useAuthStore } from '@/store/authStore'
import { Post } from '@/types/posts.interface'
import { UserProfile } from '@/types/user.interface'
import { Ionicons } from '@expo/vector-icons'
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Text, View } from 'react-native'

interface UserPostsProps {
  tagName: string
  isOwnProfile?: boolean
}

export default function UserPosts({
  tagName,
  isOwnProfile = true,
}: UserPostsProps) {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMorePages, setHasMorePages] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const { profile: currentUserProfile } = useAuthStore()

  const fetchUserPosts = useCallback(
    async (page = 1, append = false) => {
      if (!tagName) return

      if (page === 1) {
        setLoading(true)
        setError(null)
      } else {
        setIsLoadingMore(true)
      }

      try {
        // For own profile, the backend might restrict getUserProfile endpoint
        // so we fetch all posts and filter by current user
        if (isOwnProfile && currentUserProfile) {
          // Fetch user's posts from the general posts endpoint and filter
          const response = await PostsRequests.getPosts(String(page))
          if (response.success) {
            const allPosts = response.data as Post[]
            // Filter posts by current user
            const userPosts = allPosts.filter(
              (post) => post.user?.tag_name === currentUserProfile.tag_name
            )

            if (append) {
              setPosts((prev) => [...prev, ...userPosts])
            } else {
              setPosts(userPosts)
            }

            // Check pagination
            if (response.data.pagination) {
              setHasMorePages(page < response.data.pagination.totalPages)
            } else {
              setHasMorePages(false)
            }
          } else {
            // Fallback: show empty posts
            if (!append) {
              setPosts([])
            }
            setHasMorePages(false)
          }
        } else {
          // For other users, use getUserProfile endpoint (only supports page 1)
          if (page === 1) {
            const response = await userRequests.getUserProfile(tagName)

            if (response.success) {
              const userProfile = response.data as UserProfile
              const simplePosts = userProfile?.user?.post || []

              // Fetch full post details for each post
              if (simplePosts.length > 0) {
                const fullPostsPromises = simplePosts.map(
                  async (simplePost) => {
                    const postResponse = await PostsRequests.getPost(
                      simplePost.id,
                      '0'
                    )
                    return postResponse.success ? postResponse.data : null
                  }
                )

                const fullPosts = await Promise.all(fullPostsPromises)
                const validPosts = fullPosts.filter(
                  (post): post is Post => post !== null
                )
                setPosts(validPosts)
              } else {
                setPosts([])
              }
            } else {
              setError(response.message || 'Failed to fetch posts')
            }
          }
          // Note: getUserProfile doesn't support pagination
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
    [tagName, isOwnProfile, currentUserProfile]
  )

  useEffect(() => {
    setCurrentPage(1)
    setHasMorePages(true)
    fetchUserPosts(1, false)
  }, [fetchUserPosts])

  const handleEndReached = useCallback(() => {
    // Only enable infinite scroll for own profile (uses getPosts endpoint with pagination)
    if (isOwnProfile && hasMorePages && !isLoadingMore && !loading) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      fetchUserPosts(nextPage, true)
    }
  }, [
    isOwnProfile,
    hasMorePages,
    isLoadingMore,
    loading,
    currentPage,
    fetchUserPosts,
  ])

  const handleLike = async (postId: string) => {
    try {
      const response = await PostsRequests.likePost(postId)
      if (response.success) {
        // Update the post in the list
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  like: {
                    ...post.like,
                    status: !post.like?.status,
                    count: post.like?.status
                      ? (post.like?.count || 1) - 1
                      : (post.like?.count || 0) + 1,
                  },
                }
              : post
          )
        )
      }
    } catch (err: any) {
      console.error('Failed to like post:', err)
    }
  }

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
            <PostCard post={item} onLike={handleLike} />
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
