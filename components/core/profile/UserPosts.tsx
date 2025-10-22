import PostCard from '@/components/core/social/PostCard'
import { PostsRequests } from '@/libs/api_requests/posts.request'
import { userRequests } from '@/libs/api_requests/user.request'
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

  const fetchUserPosts = useCallback(async () => {
    if (!tagName) return

    setLoading(true)
    setError(null)
    try {
      const response = await userRequests.getUserProfile(tagName)
      if (response.success) {
        const userProfile = response.data as UserProfile
        const simplePosts = userProfile?.user?.post || []

        // Fetch full post details for each post
        if (simplePosts.length > 0) {
          const fullPostsPromises = simplePosts.map(async (simplePost) => {
            const postResponse = await PostsRequests.getPost(simplePost.id, '0')
            return postResponse.success ? postResponse.data : null
          })

          const fullPosts = await Promise.all(fullPostsPromises)
          setPosts(fullPosts.filter((post): post is Post => post !== null))
        } else {
          setPosts([])
        }
      } else {
        setError(response.message || 'Failed to fetch posts')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch posts')
    } finally {
      setLoading(false)
    }
  }, [tagName])

  useEffect(() => {
    fetchUserPosts()
  }, [fetchUserPosts])

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

  if (loading) {
    return (
      <View className='px-6 py-8 items-center'>
        <ActivityIndicator color='#6366f1' size='large' />
        <Text className='text-gray-400 mt-4'>Loading posts...</Text>
      </View>
    )
  }

  if (error) {
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
        />
      )}
    </View>
  )
}
