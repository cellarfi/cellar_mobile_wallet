import { SocialFiRequests } from '@/libs/api_requests/socialfi.request'
import { Post } from '@/types/posts.interface'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function HashtagPostsModal() {
  const { hashtag } = useLocalSearchParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await SocialFiRequests.getPostsByHashtag(String(hashtag))
        if (res.success) {
          setPosts(res.data || [])
        } else {
          setError(res.message || 'Failed to fetch posts')
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch posts')
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [hashtag])

  // Full-featured PostCard (copied and adapted from social tab)
  const PostCard = ({ post }: { post: Post }) => {
    const handlePostDetail = (postId: string) => {
      router.push({ pathname: '/(screens)/post-details', params: { postId } })
    }
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handlePostDetail(post.id)}
        className='bg-dark-200 rounded-2xl p-4 mb-4'
      >
        {/* User Header */}
        <View className='flex-row items-center justify-between mb-3'>
          <View className='flex-row items-center flex-1'>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/profile/[tag_name]',
                  params: { userId: post.user.id },
                })
              }
              className='w-12 h-12 bg-primary-500/20 rounded-full justify-center items-center mr-3'
            >
              {post.user.profile_picture_url ? (
                <Image
                  source={{ uri: post.user.profile_picture_url }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                  resizeMode='cover'
                />
              ) : (
                <Text className='text-lg text-white'>
                  {post.user?.display_name?.[0]?.toUpperCase() ?? '?'}
                </Text>
              )}
            </TouchableOpacity>
            <View className='flex-1'>
              <View className='flex-row items-center'>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/profile/[tag_name]',
                      params: { tag_name: post.user.tag_name },
                    })
                  }
                >
                  <Text className='text-white font-semibold mr-2'>
                    {post.user?.display_name ?? ''}
                  </Text>
                </TouchableOpacity>
                <Ionicons name='checkmark-circle' size={16} color='#6366f1' />
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/profile/[tag_name]',
                    params: { tag_name: post.user.tag_name },
                  })
                }
              >
                <Text className='text-gray-400 text-sm'>
                  @{post.user?.tag_name ?? ''} •{' '}
                  {post.created_at
                    ? new Date(post.created_at).toLocaleString()
                    : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity className='p-2'>
            <Ionicons name='ellipsis-horizontal' size={20} color='#666672' />
          </TouchableOpacity>
        </View>
        {/* Content */}
        <Text className='text-white leading-6 mb-3'>{post.content ?? ''}</Text>
        {/* Engagement Stats (disabled actions) */}
        <View className='flex-row items-center justify-between py-3 border-t border-dark-300'>
          <View className='flex-row items-center gap-6'>
            <View className='flex-row items-center'>
              <Ionicons
                name={post.like?.status ? 'heart' : 'heart-outline'}
                size={22}
                color={post.like?.status ? '#ef4444' : '#666672'}
              />
              <Text className='text-gray-400 text-sm ml-2'>
                {post._count?.like || 0}
              </Text>
            </View>
            <View className='flex-row items-center'>
              <Ionicons name='chatbubble-outline' size={20} color='#666672' />
              <Text className='text-gray-400 text-sm ml-2'>
                {post._count?.comment || 0}
              </Text>
            </View>
            <View className='flex-row items-center'>
              <Ionicons name='arrow-redo-outline' size={20} color='#666672' />
              <Text className='text-gray-400 text-sm ml-2'>Share</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView className='flex-1 bg-dark-50 px-0'>
      <View className='flex-row items-center justify-between px-6 py-4 bg-dark-50 border-b border-dark-200'>
        <View className='flex-row items-center gap-2'>
          <Ionicons name='pricetag' size={28} color='#6366f1' />
          <Text className='text-primary-400 text-2xl font-bold ml-2'>
            #{hashtag}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name='close' size={24} color='#fff' />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} className='px-6'>
        {loading ? (
          <View className='flex-1 justify-center items-center mt-16'>
            <ActivityIndicator color='#6366f1' />
            <Text className='text-white mt-2'>Loading posts...</Text>
          </View>
        ) : error ? (
          <View className='flex-1 justify-center items-center mt-16'>
            <Text className='text-red-500'>{error}</Text>
          </View>
        ) : posts.length === 0 ? (
          <View className='flex-1 justify-center items-center mt-16'>
            <Text className='text-gray-400'>
              No posts for this hashtag yet.
            </Text>
          </View>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
