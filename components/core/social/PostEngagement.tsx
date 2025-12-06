import { cn } from '@/libs/utils'
import { Post } from '@/types/posts.interface'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface PostEngagementProps {
  post: Post
  onLike?: (postId: string) => void
  onComment?: () => void
  onShare?: () => void
  onTip?: () => void
  showTip?: boolean
  variant?: 'compact' | 'default'
}

const PostEngagement = React.memo(
  ({
    post,
    onLike,
    onComment,
    onShare,
    onTip,
    showTip = false,
    variant = 'default',
  }: PostEngagementProps) => {
    const handleLikePress = () => {
      onLike?.(post.id)
    }

    const handleCommentPress = () => {
      onComment?.()
    }

    const handleSharePress = () => {
      onShare?.()
    }

    const handleTipPress = () => {
      onTip?.()
    }

    const containerClass =
      variant === 'compact' ? 'mt-2 mb-4' : 'mt-3 pt-3 border-t border-zinc-800'

    return (
      <View
        className={cn('flex-row items-center justify-between ', containerClass)}
      >
        <View className='flex-1 flex-row items-center justify-between'>
          {/* Like Button */}
          <TouchableOpacity
            className='flex-row items-center mr-4'
            onPress={handleLikePress}
          >
            <Ionicons
              name={post.like?.status ? 'heart' : 'heart-outline'}
              size={variant === 'compact' ? 22 : 20}
              color={post.like?.status ? '#ef4444' : '#64748b'}
            />
            <Text
              className={`text-sm ml-1 ${
                post.like?.status
                  ? 'text-red-400 font-bold'
                  : 'text-gray-400 font-normal'
              }`}
            >
              {post._count?.like || 0}
            </Text>
          </TouchableOpacity>

          {/* Comment Button */}
          <TouchableOpacity
            className='flex-row items-center mr-4'
            onPress={handleCommentPress}
          >
            <Ionicons
              name='chatbubble-outline'
              size={variant === 'compact' ? 20 : 20}
              color='#64748b'
            />
            <Text className='text-gray-400 text-sm ml-1'>
              {post._count?.comment || 0}
            </Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            className='flex-row items-center'
            onPress={handleSharePress}
          >
            <Ionicons name='arrow-redo-outline' size={20} color='#64748b' />
            <Text className='text-gray-400 text-sm ml-1'>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Tip Button */}
        {showTip && (
          <TouchableOpacity
            className='flex-row items-center'
            onPress={handleTipPress}
          >
            <Ionicons name='cash-outline' size={20} color='#64748b' />
          </TouchableOpacity>
        )}
      </View>
    )
  }
)

PostEngagement.displayName = 'PostEngagement'

export default PostEngagement
