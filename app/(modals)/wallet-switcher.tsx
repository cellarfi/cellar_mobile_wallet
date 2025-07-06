import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function WalletSwitcherScreen() {
  return (
    <SafeAreaView className='flex-1 bg-dark-50'>
      <View className='flex-1'>
        {/* Header */}
        <View className='flex-row items-center justify-between px-6 py-4'>
          <TouchableOpacity
            onPress={() => router.back()}
            className='w-10 h-10 bg-dark-200 rounded-full justify-center items-center'
          >
            <Ionicons name='arrow-back' size={20} color='white' />
          </TouchableOpacity>
          <Text className='text-white text-lg font-semibold'>
            Switch Wallet
          </Text>
          <View className='w-10' />
        </View>

        <View className='flex-1 justify-center items-center px-6'>
          <Text className='text-white text-xl font-semibold mb-4'>
            Wallet Switcher Modal
          </Text>
          <Text className='text-gray-400 text-center'>
            This modal is coming soon!
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}
