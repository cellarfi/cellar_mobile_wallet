import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  onPress: () => void
  gradient?: boolean
}

export function ActionButton({
  icon,
  title,
  onPress,
  gradient = false,
}: ActionButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} className='flex-1 active:scale-95'>
      {gradient ? (
        <LinearGradient
          colors={['#122C41', '#1A2741']}
          style={{
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
          }}
        >
          <Ionicons name={icon} size={24} color='white' />
          <Text className='text-white font-medium text-sm'>{title}</Text>
        </LinearGradient>
      ) : (
        <View className='bg-secondary-light rounded-2xl p-4 items-center gap-2'>
          <Ionicons name={icon} size={24} color={Colors.dark.text} />
          <Text className='text-white font-medium text-sm'>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}
