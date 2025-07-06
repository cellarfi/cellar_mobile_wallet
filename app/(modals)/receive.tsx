import CustomButton from '@/components/ui/CustomButton'
import { Images } from '@/constants/Images'
import { Ionicons } from '@expo/vector-icons'
import { getUserEmbeddedSolanaWallet, usePrivy } from '@privy-io/expo'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
  Alert,
  Animated,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import QRCodeStyled from 'react-native-qrcode-styled'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ReceiveScreen() {
  const { user } = usePrivy()
  const [copied, setCopied] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(1))

  // Get the embedded wallet from Privy
  const account = getUserEmbeddedSolanaWallet(user)

  // For demo purposes, we'll use a mock Solana address if no Ethereum wallet is found
  // In a real app, you'd want to get the actual Solana wallet address
  const walletAddress =
    account?.address || '7xKXtg2CWNfnN5p8RJ6N9W8BeFhJ4A2sP9dQvH3KwXhM'

  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(walletAddress)
      setCopied(true)

      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      // Scale animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start()

      // Fade in animation for copied indicator
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start()

      // Reset after 2 seconds
      setTimeout(() => {
        setCopied(false)
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start()
      }, 2000)
    } catch (error) {
      Alert.alert('Error', 'Failed to copy address to clipboard')
    }
  }

  const shareAddress = async () => {
    try {
      await Share.share({
        message: `My wallet address: ${walletAddress}`,
        title: 'Wallet Address',
      })
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address
    return `${address.slice(0, 6)}...${address.slice(-6)}`
  }

  return (
    <SafeAreaView className='flex-1 bg-dark-50'>
      <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className='flex-row items-center justify-between px-6 py-4'>
          <TouchableOpacity
            onPress={() => router.back()}
            className='w-10 h-10 bg-dark-200 rounded-full justify-center items-center'
          >
            <Ionicons name='arrow-back' size={20} color='white' />
          </TouchableOpacity>
          <Text className='text-white text-lg font-semibold'>Receive</Text>
          <TouchableOpacity
            onPress={shareAddress}
            className='w-10 h-10 bg-dark-200 rounded-full justify-center items-center'
          >
            <Ionicons name='share-outline' size={20} color='white' />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className='flex-1 px-6'>
          {/* QR Code Section */}
          <View className='items-center mb-8'>
            <Text className='text-white text-2xl font-bold mb-2'>
              Scan to Send
            </Text>
            <Text className='text-gray-400 text-center mb-8 leading-6'>
              Share this QR code or wallet address to receive payments
            </Text>

            {/* QR Code Container */}
            <View className='bg-white rounded-3xl p-6 mb-6 shadow-lg'>
              <QRCodeStyled
                data={walletAddress}
                style={{ backgroundColor: 'white' }}
                pieceSize={8}
                pieceBorderRadius={2}
                isPiecesGlued={false}
                color='#0a0a0b'
                innerEyesOptions={{
                  borderRadius: 8,
                  color: '#6366f1',
                }}
                outerEyesOptions={{
                  borderRadius: 8,
                  color: '#0a0a0b',
                }}
                logo={{
                  // href: require('@/assets/images/icon.png'),
                  href: Images.appLogo,
                  padding: 4,
                  hidePieces: false,
                }}
              />
            </View>

            {/* Wallet Type Badge */}
            {/* <View className='bg-primary-500/20 rounded-full px-4 py-2 mb-4'>
              <Text className='text-primary-400 font-medium text-sm'>
                {account ? 'Privy Wallet' : 'Demo Wallet'}
              </Text>
            </View> */}
          </View>

          {/* Address Section */}
          <View className='bg-dark-200 rounded-3xl p-6 mb-6'>
            <View className='flex-row items-center justify-between mb-4'>
              <Text className='text-white font-semibold text-lg'>
                Wallet Address
              </Text>
              <View className='flex-row gap-2'>
                <TouchableOpacity
                  onPress={() => router.push('/(modals)/qr-scanner')}
                  className='w-10 h-10 bg-dark-300 rounded-full justify-center items-center'
                >
                  <Ionicons name='scan' size={18} color='#6366f1' />
                </TouchableOpacity>
              </View>
            </View>

            {/* Address Display */}
            <View className='bg-dark-50 rounded-2xl p-4 mb-4'>
              <Text className='text-white font-mono text-sm leading-6 text-center'>
                {walletAddress}
              </Text>
            </View>

            {/* Copy Button */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <CustomButton
                text={copied ? 'Copied!' : 'Copy Address'}
                onPress={copyToClipboard}
                disabled={copied}
              >
                <Animated.View
                  style={{
                    opacity: fadeAnim,
                    position: 'absolute',
                    top: -10,
                    right: -10,
                  }}
                  className='bg-success-500 rounded-full w-8 h-8 justify-center items-center'
                >
                  <Ionicons name='checkmark' size={16} color='white' />
                </Animated.View>
              </CustomButton>
              {/* <TouchableOpacity
                onPress={copyToClipboard}
                className='active:scale-95'
                disabled={copied}
              >
                <LinearGradient
                  colors={
                    copied ? ['#10b981', '#059669'] : ['#6366f1', '#8b5cf6']
                  }
                  className='py-4 rounded-2xl relative'
                >
                  <View className='flex-row items-center justify-center'>
                    <Ionicons
                      name={copied ? 'checkmark' : 'copy'}
                      size={20}
                      color='white'
                    />
                    <Text className='text-white text-center text-lg font-semibold ml-2'>
                      {copied ? 'Copied!' : 'Copy Address'}
                    </Text>
                  </View>

                  <Animated.View
                    style={{
                      opacity: fadeAnim,
                      position: 'absolute',
                      top: -10,
                      right: -10,
                    }}
                    className='bg-success-500 rounded-full w-8 h-8 justify-center items-center'
                  >
                    <Ionicons name='checkmark' size={16} color='white' />
                  </Animated.View>
                </LinearGradient>
              </TouchableOpacity> */}
            </Animated.View>
          </View>

          {/* Info Section */}
          <View className='bg-dark-200 rounded-3xl p-6 mb-6'>
            <View className='flex-row items-center mb-4'>
              <View className='w-8 h-8 bg-primary-500/20 rounded-full justify-center items-center mr-3'>
                <Ionicons name='information-circle' size={16} color='#6366f1' />
              </View>
              <Text className='text-white font-semibold text-lg'>
                How to Receive
              </Text>
            </View>

            <View className='gap-4'>
              <View className='flex-row items-start'>
                <View className='w-6 h-6 bg-primary-500/20 rounded-full justify-center items-center mr-3 mt-0.5'>
                  <Text className='text-primary-400 font-bold text-xs'>1</Text>
                </View>
                <Text className='text-gray-300 flex-1 leading-6'>
                  Share your wallet address or QR code with the sender
                </Text>
              </View>

              <View className='flex-row items-start'>
                <View className='w-6 h-6 bg-primary-500/20 rounded-full justify-center items-center mr-3 mt-0.5'>
                  <Text className='text-primary-400 font-bold text-xs'>2</Text>
                </View>
                <Text className='text-gray-300 flex-1 leading-6'>
                  Wait for the transaction to be confirmed on the blockchain
                </Text>
              </View>

              <View className='flex-row items-start'>
                <View className='w-6 h-6 bg-primary-500/20 rounded-full justify-center items-center mr-3 mt-0.5'>
                  <Text className='text-primary-400 font-bold text-xs'>3</Text>
                </View>
                <Text className='text-gray-300 flex-1 leading-6'>
                  Your balance will be updated automatically
                </Text>
              </View>
            </View>
          </View>

          {/* Warning */}
          <View className='bg-warning-500/10 border border-warning-500/20 rounded-2xl p-4 mb-6'>
            <View className='flex-row items-start'>
              <Ionicons name='warning' size={20} color='#f59e0b' />
              <View className='flex-1 ml-3'>
                <Text className='text-warning-400 font-medium mb-1'>
                  Important
                </Text>
                <Text className='text-sm text-gray-400 leading-5'>
                  Only send compatible tokens to this address. Sending
                  incompatible tokens may result in permanent loss.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
