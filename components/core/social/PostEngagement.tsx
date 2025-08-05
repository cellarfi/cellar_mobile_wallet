import { Post } from '@/types/posts.interface'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface PostEngagementProps {
  post: Post
  onLike?: (postId: string) => void
  onComment?: () => void
  onShare?: () => void
}

const PostEngagement = React.memo(
  ({ post, onLike, onComment, onShare }: PostEngagementProps) => {
    const handleLikePress = () => {
      onLike?.(post.id)
    }

    const handleCommentPress = () => {
      onComment?.()
    }

    const handleSharePress = () => {
      onShare?.()
    }

    return (
      <View className='flex-row items-center justify-between mt-3 pt-3 border-t border-zinc-800'>
        {/* Like Button */}
        <TouchableOpacity
          className='flex-row items-center'
          onPress={handleLikePress}
        >
          <Ionicons
            name={post.like?.status ? 'heart' : 'heart-outline'}
            size={20}
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
          className='flex-row items-center'
          onPress={handleCommentPress}
        >
          <Ionicons name='chatbubble-outline' size={20} color='#64748b' />
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
    )
  }
)

PostEngagement.displayName = 'PostEngagement'

export default PostEngagement
