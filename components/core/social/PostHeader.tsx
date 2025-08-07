import { useAuthStore } from '@/store/authStore'
import { Post } from '@/types/posts.interface'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { Modal, Text, TouchableOpacity, View } from 'react-native'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

interface PostHeaderProps {
  post: Post
  onEdit?: () => void
}

const PostHeader = React.memo(({ post, onEdit }: PostHeaderProps) => {
  const { profile } = useAuthStore()
  const [showMenu, setShowMenu] = useState(false)
  const translateY = useSharedValue(300)
  const opacity = useSharedValue(0)
  const isOwner = profile?.id === post.user_id

  const handleMenu = () => {
    setShowMenu(true)
    translateY.value = withSpring(0, { damping: 20, stiffness: 100 })
    opacity.value = withSpring(1)
  }

  const closeMenu = () => {
    translateY.value = withSpring(300, { damping: 20, stiffness: 100 })
    opacity.value = withSpring(0)
    setTimeout(() => setShowMenu(false), 200)
  }

  const gesture = Gesture.Pan()
    .onStart(() => {
      // Store initial position
    })
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY)
    })
    .onEnd((event) => {
      if (event.translationY > 50 || event.velocityY > 500) {
        translateY.value = withSpring(300, { damping: 20, stiffness: 100 })
        opacity.value = withSpring(0)
        runOnJS(setTimeout)(() => runOnJS(setShowMenu)(false), 200)
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 100 })
      }
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const handleEdit = () => {
    closeMenu()
    onEdit?.()
  }

  const handleViewProfile = () => {
    closeMenu()
    router.push({
      pathname: '/(modals)/user-profile',
      params: { tagName: post.user.tag_name },
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    return `${Math.floor(diffInSeconds / 86400)}d`
  }

  return (
    <View className='flex-row items-center mb-3'>
      {/* Profile Picture */}
      <TouchableOpacity onPress={handleViewProfile}>
        <View className='w-11 h-11 bg-gray-700 rounded-full justify-center items-center mr-3 overflow-hidden'>
          {post.user?.profile_picture_url ? (
            <Image
              source={{ uri: post.user.profile_picture_url }}
              style={{ width: 44, height: 44, borderRadius: 22 }}
            />
          ) : (
            <Text className='text-white text-base font-bold'>
              {post.user?.display_name?.[0]?.toUpperCase() || '?'}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* User Info */}
      <View className='flex-1'>
        <TouchableOpacity onPress={handleViewProfile}>
          <View className='flex-row items-center'>
            <Text className='text-gray-100 font-bold text-base mr-1.5'>
              {post.user?.display_name || 'Unknown User'}
            </Text>
            {/* Verified badge - removed since not in type */}
          </View>
          <View className='flex-row items-center'>
            <Text className='text-gray-400 text-sm'>
              @{post.user?.tag_name || 'unknown'}
            </Text>
            <Text className='text-gray-500 text-sm ml-2'>
              · {formatTimeAgo(post.created_at)}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Menu Button */}
      <TouchableOpacity
        onPress={handleMenu}
        className='w-8 h-8 rounded-full justify-center items-center'
      >
        <Ionicons name='ellipsis-horizontal' size={20} color='#9ca3af' />
      </TouchableOpacity>

      {/* Bottom Sheet Modal */}
      <Modal visible={showMenu} transparent animationType='none'>
        <GestureHandlerRootView className='flex-1'>
          <Animated.View className='flex-1' style={backdropStyle}>
            <TouchableOpacity
              className='flex-1 bg-black/50'
              onPress={closeMenu}
              activeOpacity={1}
            />
            <GestureDetector gesture={gesture}>
              <Animated.View
                className='bg-primary-main rounded-t-3xl border-t border-zinc-800'
                style={[animatedStyle, { paddingBottom: 20 }]}
              >
                {/* Handle bar */}
                <View className='w-12 h-1 bg-zinc-600 rounded-full self-center mt-3 mb-4' />

                {/* Menu Items */}
                <View className='px-6'>
                  {isOwner && (
                    <TouchableOpacity
                      onPress={handleEdit}
                      className='flex-row items-center py-4 border-b border-zinc-800'
                    >
                      <View className='w-10 h-10 bg-blue-500/20 rounded-full items-center justify-center mr-4'>
                        <Ionicons name='pencil' size={18} color='#3b82f6' />
                      </View>
                      <Text className='text-gray-100 text-lg font-medium'>
                        Edit Post
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={handleViewProfile}
                    className='flex-row items-center py-4'
                  >
                    <View className='w-10 h-10 bg-green-500/20 rounded-full items-center justify-center mr-4'>
                      <Ionicons name='person' size={18} color='#10b981' />
                    </View>
                    <Text className='text-gray-100 text-lg font-medium'>
                      View Profile
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </GestureDetector>
          </Animated.View>
        </GestureHandlerRootView>
      </Modal>
    </View>
  )
})

PostHeader.displayName = 'PostHeader'

export default PostHeader
