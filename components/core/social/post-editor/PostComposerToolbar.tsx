import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface PostComposerToolbarProps {
  contentLength: number
  maxLength?: number
  onEmojiPress: () => void
  onGifPress: () => void
  onAttachPress: () => void
  disabled?: boolean
  mediaCount?: number
  maxAttachments?: number
}

const PostComposerToolbar: React.FC<PostComposerToolbarProps> = ({
  contentLength,
  maxLength = 1000,
  onEmojiPress,
  onGifPress,
  onAttachPress,
  disabled = false,
  mediaCount = 0,
  maxAttachments = 5,
}) => {
  const isAttachDisabled = disabled || mediaCount >= maxAttachments

  return (
    <View className='bg-secondary-light border-t border-zinc-700 rounded-b-xl px-4 py-3'>
      <View className='flex-row items-center justify-between'>
        <View className='flex-row items-center space-x-1'>
          {/* Emoji Button */}
          <TouchableOpacity
            onPress={onEmojiPress}
            className='p-2 rounded-lg bg-zinc-700/50'
            disabled={disabled}
            style={{ opacity: disabled ? 0.7 : 1 }}
          >
            <Ionicons name='happy-outline' size={20} color={Colors.dark.text} />
          </TouchableOpacity>

          {/* GIF Button */}
          <TouchableOpacity
            onPress={onGifPress}
            className='p-2 rounded-lg bg-zinc-700/50 ml-2'
            disabled={isAttachDisabled}
            style={{ opacity: isAttachDisabled ? 0.7 : 1 }}
          >
            <Ionicons
              name='gift-outline'
              size={20}
              color={
                isAttachDisabled ? Colors.dark.text + '80' : Colors.dark.text
              }
            />
          </TouchableOpacity>

          {/* Attach Media Button */}
          <TouchableOpacity
            onPress={onAttachPress}
            className='p-2 rounded-lg bg-zinc-700/50 ml-2'
            disabled={isAttachDisabled}
            style={{ opacity: isAttachDisabled ? 0.7 : 1 }}
          >
            <Ionicons
              name='attach'
              size={20}
              color={
                isAttachDisabled ? Colors.dark.text + '80' : Colors.dark.text
              }
            />
          </TouchableOpacity>
        </View>

        {/* Character Counter */}
        <View className='bg-zinc-700/50 px-3 py-1 rounded-lg'>
          <Text
            className={`text-sm font-medium ${
              contentLength > maxLength - 50
                ? 'text-orange-400'
                : contentLength > maxLength - 20
                  ? 'text-yellow-400'
                  : 'text-gray-400'
            }`}
          >
            {contentLength}/{maxLength}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default PostComposerToolbar
