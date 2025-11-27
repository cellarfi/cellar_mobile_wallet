import CustomButton from '@/components/ui/CustomButton'
import { isValidSolanaAddress } from '@/libs/solana.lib'
import { Ionicons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useState } from 'react'
import {
  Alert,
  Dimensions,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width, height } = Dimensions.get('window')

export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [scanAttempts, setScanAttempts] = useState(0)
  const [lastScanTime, setLastScanTime] = useState(0)

  // Get navigation parameters
  const {
    returnTo,
    returnParam,
    currentRecipient,
    currentAmount,
    currentMemo,
    currentIsUsdMode,
  } = useLocalSearchParams<{
    returnTo?: string
    returnParam?: string
    currentRecipient?: string
    currentAmount?: string
    currentMemo?: string
    currentIsUsdMode?: string
  }>()

  // Debug navigation parameters
  console.log('QR Scanner received parameters:', {
    returnTo,
    returnParam,
    currentRecipient,
    currentAmount,
    currentMemo,
    currentIsUsdMode,
  })

  const handleBarCodeScanned = ({ type, data }: any) => {
    if (scanned) return

    // Throttle scanning to avoid duplicate scans
    const now = Date.now()
    if (now - lastScanTime < 2000) {
      // 2 second throttle
      return
    }
    setLastScanTime(now)

    console.log('QR Code scanned:', { type, data })

    // Don't set scanned immediately - allow for retries
    Vibration.vibrate(100)

    // Basic validation for Solana wallet address
    if (data && typeof data === 'string') {
      const trimmedData = data.trim()

      // Try to extract address from various formats
      let addressToValidate = trimmedData

      // Handle potential URI schemes (solana:, phantom:, etc.)
      if (trimmedData.includes(':')) {
        const parts = trimmedData.split(':')
        if (parts.length >= 2) {
          addressToValidate = parts[1]
        }
      }

      // Handle potential query parameters
      if (addressToValidate.includes('?')) {
        addressToValidate = addressToValidate.split('?')[0]
      }

      // Clean up any remaining whitespace or special characters but keep alphanumeric
      addressToValidate = addressToValidate.replace(/[^a-zA-Z0-9]/g, '')

      console.log('Attempting to validate address:', addressToValidate)

      // Validate using proper Solana address validation
      if (isValidSolanaAddress(addressToValidate)) {
        console.log('Valid Solana address detected:', addressToValidate)
        console.log('Return parameters:', { returnTo, returnParam })

        // Now set scanned to true since we found a valid address
        setScanned(true)

        // For better UX, directly use the address if coming from send screen
        if (returnTo && returnTo === 'send') {
          // Vibrate to confirm scan and immediately navigate
          Vibration.vibrate([100, 50, 100]) // Double vibration for success
          console.log('QR Scanner: Navigating back to send screen')
          handleUseAddress(addressToValidate)
        } else {
          // Show alert for other use cases or if no return info
          console.log('QR Scanner: Showing alert for address selection')
          Alert.alert(
            'QR Code Scanned',
            `Wallet Address: ${addressToValidate}`,
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => setScanned(false),
              },
              {
                text: 'Use Address',
                onPress: () => {
                  handleUseAddress(addressToValidate)
                },
              },
            ]
          )
        }
      } else {
        console.log('Invalid address format:', addressToValidate)
        // Reset throttle for retry
        setLastScanTime(0)
        // Don't set scanned = true, allow retry
        setTimeout(() => {
          Alert.alert(
            'Invalid QR Code',
            "This doesn't appear to be a valid wallet address. Please try again.",
            [
              {
                text: 'Try Again',
                onPress: () => {
                  // Allow scanning again
                  setScanned(false)
                },
              },
            ]
          )
        }, 500)
      }
    } else {
      console.log('No valid data in QR code')
      // Reset throttle for retry
      setLastScanTime(0)
      setTimeout(() => {
        Alert.alert('Invalid QR Code', 'Could not read the QR code data.', [
          {
            text: 'Try Again',
            onPress: () => {
              setScanned(false)
            },
          },
        ])
      }, 500)
    }
  }

  const handleUseAddress = (address: string) => {
    console.log('Using scanned address:', address)
    console.log('Navigation params:', { returnTo, returnParam })

    if (returnTo === 'send') {
      // Check if we have current form data (meaning we came from send screen)
      const hasFormData =
        currentRecipient || currentAmount || currentMemo || currentIsUsdMode

      if (hasFormData) {
        // We came from send screen, so go back and restore state
        console.log('Returning to send screen with preserved form data...')
        router.back()

        setTimeout(() => {
          router.setParams({
            scannedAddress: address,
            currentRecipient,
            currentAmount,
            currentMemo,
            currentIsUsdMode,
          })
        }, 200)
      } else {
        // We came from another screen (index/wallet), navigate to send screen
        console.log('Navigating to send screen from other screen...')
        router.replace({
          pathname: '/(modals)/send' as any,
          params: {
            scannedAddress: address,
          },
        })
      }
    } else {
      // Fallback: just go back
      console.log('Fallback: going back')
      router.back()
    }
  }

  if (!permission) {
    // Camera permissions are still loading
    return (
      <SafeAreaView className='flex-1 bg-dark-50'>
        <View className='flex-1 justify-center items-center px-6'>
          <View className='w-16 h-16 bg-primary-500/20 rounded-full justify-center items-center mb-6'>
            <Ionicons name='camera' size={32} color='#6366f1' />
          </View>
          <Text className='text-white text-xl font-semibold mb-2'>
            Loading Camera
          </Text>
          <Text className='text-gray-400 text-center'>
            Please wait while we prepare the camera...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <SafeAreaView className='flex-1 bg-primary-main'>
        <View className='flex-1 items-center px-6'>
          {/* Header */}
          <View className='flex-row items-center justify-between w-full mb-8'>
            <TouchableOpacity
              onPress={() => router.back()}
              className='w-10 h-10 bg-dark-200 rounded-full justify-center items-center'
            >
              <Ionicons name='arrow-back' size={20} color='white' />
            </TouchableOpacity>
            <Text className='text-white text-lg font-semibold'>QR Scanner</Text>
            <View className='w-10' />
          </View>

          <View className='flex-1 justify-center items-center'>
            <View className='w-16 h-16 bg-primary-500/20 rounded-full justify-center items-center mb-6'>
              <Ionicons name='camera' size={32} color='#6366f1' />
            </View>
            <Text className='text-white text-xl font-semibold mb-4'>
              Camera Permission Required
            </Text>
            <Text className='text-gray-400 text-center mb-8 leading-6'>
              We need access to your camera to scan QR codes for wallet
              addresses.
            </Text>

            <CustomButton
              text='Grant Camera Access'
              onPress={requestPermission}
              type='primary'
            />
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className='flex-1 bg-dark-50'>
      <View className='flex-1'>
        {/* Header */}
        <View className='flex-row items-center justify-between px-6 py-4 z-10'>
          <TouchableOpacity
            onPress={() => router.back()}
            className='w-10 h-10 bg-dark-900/80 rounded-full justify-center items-center'
          >
            <Ionicons name='arrow-back' size={20} color='white' />
          </TouchableOpacity>
          <Text className='text-white text-lg font-semibold'>Scan QR Code</Text>
          <TouchableOpacity
            onPress={() => setFlashEnabled(!flashEnabled)}
            className='w-10 h-10 bg-dark-900/80 rounded-full justify-center items-center'
          >
            <Ionicons
              name={flashEnabled ? 'flash' : 'flash-off'}
              size={20}
              color={flashEnabled ? '#6366f1' : 'white'}
            />
          </TouchableOpacity>
        </View>

        {/* Camera View */}
        <View className='flex-1 relative'>
          <CameraView
            style={{ flex: 1 }}
            facing='back'
            enableTorch={flashEnabled}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            autofocus='on'
          />

          {/* Overlay */}
          <View className='absolute inset-0 justify-center items-center'>
            {/* Top overlay */}
            <View className='absolute top-0 left-0 right-0 h-32 bg-black/50' />

            {/* Scanning frame */}
            <View className='relative'>
              <View className='w-64 h-64 border-2 border-primary-400 rounded-3xl bg-transparent' />

              {/* Corner accents */}
              <View className='absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-3xl' />
              <View className='absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-3xl' />
              <View className='absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-3xl' />
              <View className='absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-3xl' />

              {/* Scanning line animation could go here */}
              {!scanned && (
                <LinearGradient
                  colors={['transparent', '#6366f1', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: 2,
                  }}
                />
              )}
            </View>

            {/* Bottom overlay */}
            <View className='absolute bottom-0 left-0 right-0 h-32 bg-black/50' />
          </View>
        </View>

        {/* Instructions */}
        <View className='px-6 py-6 bg-dark-50'>
          <View className='flex-row items-center justify-center mb-4'>
            <View className='w-8 h-8 bg-primary-500/20 rounded-full justify-center items-center mr-3'>
              <Ionicons name='qr-code' size={16} color='#6366f1' />
            </View>
            <Text className='text-white text-lg font-semibold'>
              Position QR code in frame
            </Text>
          </View>
          <Text className='text-gray-400 text-center leading-6 mb-4'>
            Point your camera at a QR code containing a Solana wallet address.
            The code will be scanned automatically.
          </Text>

          {/* Tips for QR codes with logos */}
          <View className='bg-dark-200 rounded-2xl p-4 mb-4'>
            <View className='flex-row items-center mb-2'>
              <Ionicons name='bulb-outline' size={16} color='#F9A826' />
              <Text className='text-yellow-400 font-medium ml-2'>
                Scanning Tips
              </Text>
            </View>
            <Text className='text-gray-400 text-sm leading-5'>
              • Try adjusting distance from QR code{'\n'}• Use the flash in low
              light{'\n'}• Keep camera steady for 2-3 seconds{'\n'}• For QR
              codes with logos, try different angles
            </Text>
          </View>

          {/* Action buttons */}
          <View className='flex-row gap-3'>
            {/* Manual input option */}
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Manual Entry',
                  'Would you like to manually enter the wallet address?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Enter Manually',
                      onPress: () => {
                        router.replace({
                          pathname: '/(modals)/send' as any,
                          params: { manualEntry: 'true' },
                        })
                      },
                    },
                  ]
                )
              }}
              className='flex-1 bg-dark-300 rounded-2xl px-4 py-3'
            >
              <Text className='text-white font-medium text-center'>
                Manual Entry
              </Text>
            </TouchableOpacity>

            {/* Reset scanner */}
            <TouchableOpacity
              onPress={() => {
                setScanned(false)
                setScanAttempts(0)
                setLastScanTime(0)
              }}
              className='flex-1 bg-primary-500/20 rounded-2xl px-4 py-3'
            >
              <Text className='text-primary-400 font-medium text-center'>
                Reset Scanner
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}
