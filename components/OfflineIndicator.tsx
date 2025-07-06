import { useNetworkStore } from '@/store/networkStore'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Text, View } from 'react-native'

export function OfflineIndicator() {
  const { isOnline } = useNetworkStore()

  if (isOnline !== false) return null

  return (
    <View className='bg-orange-500/90 px-4 py-2 mx-6 rounded-xl mb-4 flex-row items-center'>
      <Ionicons name='cloud-offline-outline' size={16} color='white' />
      <Text className='text-white text-sm font-medium ml-2'>
        Using cached data - You're offline
      </Text>
    </View>
  )
}
