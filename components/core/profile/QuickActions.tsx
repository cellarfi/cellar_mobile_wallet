import { User } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface QuickActionsProps {
  isOwnProfile?: boolean
  userProfile?: User | null
}

export default function QuickActions({
  isOwnProfile = true,
  userProfile,
}: QuickActionsProps) {
  if (!isOwnProfile) {
    const handleTip = () => {
      // Find Solana wallet address
      const solanaWallet = userProfile?.wallets?.find(
        (w) => w.chain_type === 'solana'
      )

      router.push({
        pathname: '/(modals)/tip-user',
        params: {
          recipientStart: solanaWallet?.address,
          recipientImage: userProfile?.profile_picture_url,
          recipientName: userProfile?.display_name || userProfile?.tag_name,
          recipientTagName: userProfile?.tag_name,
        },
      })
    }

    // Show different quick actions for other users
    return (
      <View className='px-6 mb-6'>
        <Text className='text-white text-lg font-semibold mb-4'>
          Quick Actions
        </Text>
        <View className='flex-row gap-3'>
          <TouchableOpacity
            onPress={() => router.push('/(modals)/send')}
            className='flex-1 bg-secondary-light rounded-2xl p-4 items-center'
          >
            <Ionicons name='send-outline' size={24} color='#6366f1' />
            <Text className='text-white font-medium text-sm mt-2'>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleTip}
            className='flex-1 bg-secondary-light rounded-2xl p-4 items-center'
          >
            <Ionicons name='gift-outline' size={24} color='#6366f1' />
            <Text className='text-white font-medium text-sm mt-2'>Tip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(modals)/share-profile')}
            className='flex-1 bg-secondary-light rounded-2xl p-4 items-center'
          >
            <Ionicons name='share-outline' size={24} color='#6366f1' />
            <Text className='text-white font-medium text-sm mt-2'>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // Show actions for own profile
  return (
    <View className='px-6 mb-6'>
      <Text className='text-white text-lg font-semibold mb-4'>
        Quick Actions
      </Text>
      <View className='flex-row gap-3'>
        <TouchableOpacity
          onPress={() => router.push('/(modals)/edit-profile')}
          className='flex-1 bg-secondary-light rounded-2xl p-4 items-center'
        >
          <Ionicons name='create-outline' size={24} color='#6366f1' />
          <Text className='text-white font-medium text-sm mt-2'>
            Edit Profile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/(modals)/qr-code')}
          className='flex-1 bg-secondary-light rounded-2xl p-4 items-center'
        >
          <Ionicons name='qr-code-outline' size={24} color='#6366f1' />
          <Text className='text-white font-medium text-sm mt-2'>My QR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/(modals)/share-profile')}
          className='flex-1 bg-secondary-light rounded-2xl p-4 items-center'
        >
          <Ionicons name='share-outline' size={24} color='#6366f1' />
          <Text className='text-white font-medium text-sm mt-2'>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
