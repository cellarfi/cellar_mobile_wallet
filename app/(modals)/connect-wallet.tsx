import { eventEmitter } from '@/libs/EventEmitter.lib'
import { ConnectionModalAction } from '@/types/app.interface'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useRef } from 'react'
import {
  Animated,
  PanResponder,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const PERMISSIONS = [
  'See your balances and activities',
  'Request approval for transactions',
]

export default function ConnectWalletModal() {
  // Accept params from navigation (all as string)
  const { logoUrl, websiteName, domain, isVerified } = useLocalSearchParams<{
    logoUrl: string
    websiteName: string
    domain: string
    isVerified: string
  }>()

  const translateY = useRef(new Animated.Value(0)).current

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward swipes
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If swiped down more than 100px, dismiss the modal
        if (gestureState.dy > 100) {
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            handleClose('reject')
          })
        } else {
          // Spring back to original position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start()
        }
      },
    })
  ).current

  const handleClose = (action: ConnectionModalAction) => {
    // Emit event with action payload
    eventEmitter.emit('wallet-connection-modal-closed', action)
    // Navigate back to previous screen (browser)
    router.back()
  }

  return (
    <View className='flex-1 justify-end' pointerEvents='box-none'>
      {/* Transparent backdrop - allows seeing browser behind */}
      <TouchableOpacity
        className='absolute inset-0 bg-transparent'
        activeOpacity={1}
        onPress={() => handleClose('reject')}
      />
      <SafeAreaView
        edges={['bottom']}
        style={{ justifyContent: 'flex-end' }}
        pointerEvents='box-none'
      >
        <Animated.View
          style={{
            transform: [{ translateY }],
          }}
          {...panResponder.panHandlers}
        >
          <View className='bg-primary-main rounded-t-3xl px-6 pt-6 pb-8 shadow-2xl border-t border-dark-300'>
            {/* Drag handle */}
            <View className='w-12 h-1.5 bg-dark-300 rounded-full self-center mb-4' />

            {/* Dapp Info */}
            <View className='flex-row items-center mb-4'>
              <View className='w-14 h-14 bg-dark-200 rounded-2xl justify-center items-center mr-4 overflow-hidden'>
                {logoUrl ? (
                  <Image
                    source={{ uri: logoUrl }}
                    style={{ width: 44, height: 44, borderRadius: 16 }}
                    resizeMode='contain'
                  />
                ) : (
                  <Ionicons name='globe-outline' size={32} color='#6366f1' />
                )}
              </View>
              <View className='flex-1'>
                <Text
                  className='text-white text-lg font-semibold'
                  numberOfLines={1}
                >
                  {websiteName}
                </Text>
                <View className='flex-row items-center mt-1'>
                  <Text
                    className='text-gray-400 text-xs mr-2'
                    numberOfLines={1}
                  >
                    {domain}
                  </Text>
                  {isVerified ? (
                    <View className='flex-row items-center bg-success-500/20 px-2 py-0.5 rounded-full ml-1'>
                      <Ionicons
                        name='checkmark-circle'
                        size={14}
                        color='#22c55e'
                      />
                      <Text className='text-success-500 text-xs font-medium ml-1'>
                        Verified
                      </Text>
                    </View>
                  ) : (
                    <View className='flex-row items-center bg-warning-500/20 px-2 py-0.5 rounded-full ml-1'>
                      <Ionicons name='alert-circle' size={14} color='#f59e42' />
                      <Text className='text-warning-500 text-xs font-medium ml-1'>
                        Unverified
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Warning for unverified dapp */}
            {!isVerified && (
              <View className='bg-warning-500/10 border border-warning-500/20 rounded-xl p-3 mb-4 flex-row items-center'>
                <Ionicons
                  name='warning'
                  size={18}
                  color='#f59e42'
                  style={{ marginRight: 8 }}
                />
                <Text className='text-warning-400 text-xs flex-1'>
                  This dapp is not verified. Only connect if you trust this
                  website.
                </Text>
              </View>
            )}

            {/* Permissions Section */}
            <View className='mb-6'>
              <Text className='text-white text-base font-semibold mb-2'>
                Permissions
              </Text>
              {PERMISSIONS.map((perm) => (
                <View key={perm} className='flex-row items-center mb-2'>
                  <Ionicons
                    name='checkmark-circle'
                    size={18}
                    color='#6366f1'
                    style={{ marginRight: 8 }}
                  />
                  <Text className='text-gray-200 text-sm'>{perm}</Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View className='flex-row gap-3'>
              <TouchableOpacity
                className='flex-1 bg-dark-200 rounded-xl py-4 items-center border border-dark-300'
                onPress={() => handleClose('reject')}
              >
                <Text className='text-white font-medium'>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className='flex-1 bg-primary-500 rounded-xl py-4 items-center'
                onPress={() => handleClose('accept')}
              >
                <Text className='text-white font-semibold'>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  )
}
