import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface WebViewErrorProps {
  message?: string
  onRetry?: () => void
}

export default function WebViewError({ message = 'Failed to load page', onRetry }: WebViewErrorProps) {
  return (
    <View className='flex-1 justify-center items-center bg-dark-50 px-8'>
      <Ionicons name='alert-circle-outline' size={64} color='#ef4444' />
      <Text className='text-red-400 text-lg mt-4 text-center font-bold'>
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className='mt-6 bg-primary-500 px-6 py-3 rounded-2xl'
        >
          <Text className='text-white font-medium'>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  )
} 