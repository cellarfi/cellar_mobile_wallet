import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface SocialPost {
  id: number
  user: string
  content: string
  likes: number
  tips: number
  timeAgo: string
}

interface SocialCardProps {
  post: SocialPost
  onLike?: () => void
  onTip?: () => void
}

export function SocialCard({ post, onLike, onTip }: SocialCardProps) {
  return (
    <View className='bg-dark-200 rounded-2xl p-4 mb-3'>
      <View className='flex-row items-center justify-between mb-3'>
        <Text className='text-primary-400 font-medium'>{post.user}</Text>
        <Text className='text-gray-500 text-sm'>{post.timeAgo}</Text>
      </View>
      <Text className='text-white leading-5 mb-3'>{post.content}</Text>
      <View className='flex-row items-center gap-4'>
        <TouchableOpacity className='flex-row items-center' onPress={onLike}>
          <Ionicons name='heart-outline' size={18} color='#666672' />
          <Text className='text-gray-400 text-sm ml-1'>{post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity className='flex-row items-center' onPress={onTip}>
          <Ionicons name='cash-outline' size={18} color='#10b981' />
          <Text className='text-gray-400 text-sm ml-1'>{post.tips}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
