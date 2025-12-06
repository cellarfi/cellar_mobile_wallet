import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface ProfileHeaderProps {
  isOwnProfile?: boolean
}

export default function ProfileHeader({
  isOwnProfile = true,
}: ProfileHeaderProps) {
  return (
    <View className='flex-row items-center justify-between px-6 py-4'>
      <View className='flex-row items-center gap-2'>
        <TouchableOpacity
          onPress={() => router.back()}
          className='rounded-full p-2'
        >
          <Ionicons name='chevron-back' size={24} color='white' />
        </TouchableOpacity>
        <Text className='text-white text-2xl font-bold'>Profile</Text>
      </View>
      {isOwnProfile ? (
        <View className='flex-row items-center gap-3'>
          <TouchableOpacity
            onPress={() => router.push('/settings' as any)}
            className='w-10 h-10 bg-secondary-light rounded-full justify-center items-center'
          >
            <Ionicons name='settings-outline' size={20} color='white' />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(modals)/qr-code')}
            className='w-10 h-10 bg-secondary-light rounded-full justify-center items-center'
          >
            <Ionicons name='qr-code' size={20} color='white' />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => router.push('/(modals)/share-profile')}
          className='w-10 h-10 bg-secondary-light rounded-full justify-center items-center'
        >
          <Ionicons name='share-outline' size={20} color='white' />
        </TouchableOpacity>
      )}
    </View>
  )
}
