import { Colors } from '@/constants/Colors'
import { PostType } from '@/types/posts.interface'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface PostTypeSelectorProps {
  selectedType: PostType
  onTypeChange: (type: PostType) => void
  disabled?: boolean
}

const POST_TYPES = [
  { label: 'Regular', value: 'REGULAR', icon: 'chatbubble-outline' },
  { label: 'Donation', value: 'DONATION', icon: 'gift-outline' },
  { label: 'Token Call', value: 'TOKEN_CALL', icon: 'megaphone-outline' },
] as const

const PostTypeSelector: React.FC<PostTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  disabled = false,
}) => {
  return (
    <View className='flex-row items-center justify-between mb-3'>
      <View className='flex-row flex-1'>
        {POST_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            className={`flex-1 py-2 mx-1 rounded-xl flex-row items-center justify-center ${
              selectedType === type.value ? 'bg-secondary' : 'bg-secondary/20'
            }`}
            onPress={() => onTypeChange(type.value as PostType)}
            disabled={disabled}
            style={{ opacity: disabled ? 0.7 : 1 }}
          >
            <Ionicons
              name={type.icon as any}
              size={18}
              color={
                selectedType === type.value ? '#fff' : Colors.dark.secondary
              }
              style={{ marginRight: 6 }}
            />
            <Text
              className={`text-center font-medium ${
                selectedType === type.value ? 'text-white' : 'text-gray-400'
              }`}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

export default PostTypeSelector
