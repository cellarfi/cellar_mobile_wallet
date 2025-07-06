import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface QuickActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  onPress: () => void
  gradient?: boolean
}

export function QuickActionButton({
  icon,
  title,
  onPress,
  gradient = false,
}: QuickActionButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} className='flex-1 active:scale-95'>
      {gradient ? (
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
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
        <View className='bg-dark-200 rounded-2xl p-4 items-center gap-2'>
          <Ionicons name={icon} size={24} color='#6366f1' />
          <Text className='text-white font-medium text-sm'>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}
