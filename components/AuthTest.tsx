import { useAuthContext } from '@/contexts/AuthProvider'
import React from 'react'
import { Text, View } from 'react-native'

export const AuthTest = () => {
  const {
    isInitialized,
    isNavigating,
    user,
    isAuthenticated,
    isReady,
    isLoading,
    isOnline,
    isOffline,
    getStatusText,
  } = useAuthContext()

  return (
    <View className='p-4 bg-dark-200 rounded-lg m-4'>
      <Text className='text-white text-lg font-bold mb-2'>
        Auth State Debug
      </Text>
      <Text className='text-gray-300'>Status: {getStatusText()}</Text>
      <Text className='text-gray-300'>
        Initialized: {isInitialized.toString()}
      </Text>
      <Text className='text-gray-300'>
        Navigating: {isNavigating.toString()}
      </Text>
      <Text className='text-gray-300'>Loading: {isLoading.toString()}</Text>
      <Text className='text-gray-300'>Ready: {isReady.toString()}</Text>
      <Text className='text-gray-300'>
        Authenticated: {isAuthenticated.toString()}
      </Text>
      <Text className='text-gray-300'>User: {user ? user.id : 'none'}</Text>
      <Text className='text-gray-300'>
        Network: {isOnline ? 'Online' : isOffline ? 'Offline' : 'Unknown'}
      </Text>
    </View>
  )
}
