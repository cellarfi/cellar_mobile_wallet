import CustomButton from '@/components/ui/CustomButton'
import PinInput from '@/components/ui/PinInput'
import {
  authenticateWithBiometrics,
  BiometricCapabilities,
  checkBiometricCapabilities,
  getBiometricTypeName,
  unlockApp,
  verifyPin,
} from '@/libs/biometric.lib'
import { useSettingsStore } from '@/store/settingsStore'
import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface BiometricLockScreenProps {
  onUnlock: () => void
}

export default function BiometricLockScreen({
  onUnlock,
}: BiometricLockScreenProps) {
  const { settings } = useSettingsStore()
  const [capabilities, setCapabilities] =
    useState<BiometricCapabilities | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [showPinInput, setShowPinInput] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [failedAttempts, setFailedAttempts] = useState(0)

  useEffect(() => {
    loadCapabilities()
  }, [])

  useEffect(() => {
    // Auto-trigger biometric authentication on mount if not showing PIN
    if (capabilities?.isAvailable && !showPinInput) {
      setTimeout(() => {
        handleBiometricAuth()
      }, 500)
    }
  }, [capabilities, showPinInput])

  const loadCapabilities = async () => {
    const caps = await checkBiometricCapabilities()
    setCapabilities(caps)
  }

  const handleBiometricAuth = async () => {
    if (!capabilities?.isAvailable) {
      setShowPinInput(true)
      return
    }

    setIsAuthenticating(true)
    const result = await authenticateWithBiometrics(
      `Unlock with ${getBiometricTypeName(capabilities.biometricType)}`
    )
    setIsAuthenticating(false)

    if (result.success) {
      await unlockApp()
      onUnlock()
    } else {
      // Show error and allow PIN as fallback
      Alert.alert(
        'Authentication Failed',
        result.error || 'Unable to authenticate. Please use your PIN.',
        [{ text: 'Use PIN', onPress: () => setShowPinInput(true) }]
      )
    }
  }

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      setPinError('Please enter your 4-digit PIN')
      return
    }

    if (!settings.biometricPinHash) {
      setPinError('PIN not configured')
      return
    }

    const isValid = await verifyPin(pin, settings.biometricPinHash)

    if (isValid) {
      setPinError('')
      await unlockApp()
      onUnlock()
    } else {
      const newFailedAttempts = failedAttempts + 1
      setFailedAttempts(newFailedAttempts)
      setPinError('Incorrect PIN')
      setPin('')

      if (newFailedAttempts >= 5) {
        Alert.alert(
          'Too Many Failed Attempts',
          'Please try again later or use biometric authentication.',
          [
            {
              text: 'Use Biometric',
              onPress: () => {
                setShowPinInput(false)
                setFailedAttempts(0)
                handleBiometricAuth()
              },
            },
          ]
        )
      }
    }
  }

  if (!capabilities) {
    return (
      <SafeAreaView className='flex-1 bg-primary-main items-center justify-center'>
        <ActivityIndicator size='large' color='#00C2CB' />
        <Text className='text-white mt-4'>Loading...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className='flex-1 bg-primary-main'>
      <KeyboardAvoidingView
        className='flex-1'
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className='flex-1 px-6 py-8 justify-center'>
          {/* Logo/Icon */}
          <View className='items-center mb-12'>
            <View className='w-24 h-24 bg-secondary/20 rounded-full justify-center items-center mb-6'>
              <Ionicons
                name={
                  showPinInput
                    ? 'lock-closed'
                    : capabilities.biometricType === 'FaceID'
                      ? 'scan'
                      : 'finger-print'
                }
                size={48}
                color='#00C2CB'
              />
            </View>
            <Text className='text-3xl font-bold text-white mb-2'>
              {showPinInput ? 'Enter PIN' : 'Unlock Cellar'}
            </Text>
            <Text className='text-gray-400 text-center'>
              {showPinInput
                ? 'Enter your 4-digit PIN to continue'
                : `Use ${getBiometricTypeName(capabilities.biometricType)} to unlock`}
            </Text>
          </View>

          {/* Content */}
          {showPinInput ? (
            <View>
              <PinInput
                value={pin}
                onChange={setPin}
                error={pinError}
                autoFocus
              />

              <View className='mt-8 gap-3'>
                <CustomButton
                  text='Unlock'
                  onPress={handlePinSubmit}
                  type='primary'
                  disabled={pin.length !== 4 || failedAttempts >= 5}
                />

                {capabilities.isAvailable && (
                  <CustomButton
                    text={`Use ${getBiometricTypeName(capabilities.biometricType)}`}
                    onPress={() => {
                      setShowPinInput(false)
                      setPin('')
                      setPinError('')
                      setTimeout(() => handleBiometricAuth(), 300)
                    }}
                    type='secondary'
                    icon={
                      capabilities.biometricType === 'FaceID'
                        ? 'scan'
                        : 'finger-print'
                    }
                  />
                )}
              </View>

              {failedAttempts > 0 && (
                <Text className='text-red-400 text-center text-sm mt-4'>
                  {failedAttempts >= 5
                    ? 'Too many failed attempts'
                    : `${5 - failedAttempts} attempts remaining`}
                </Text>
              )}
            </View>
          ) : (
            <View>
              {isAuthenticating ? (
                <View className='items-center'>
                  <ActivityIndicator size='large' color='#00C2CB' />
                  <Text className='text-white mt-4'>Authenticating...</Text>
                </View>
              ) : (
                <View className='gap-3'>
                  <CustomButton
                    text={`Unlock with ${getBiometricTypeName(capabilities.biometricType)}`}
                    onPress={handleBiometricAuth}
                    type='primary'
                    icon={
                      capabilities.biometricType === 'FaceID'
                        ? 'scan'
                        : 'finger-print'
                    }
                  />

                  {settings.biometricPinHash && (
                    <CustomButton
                      text='Use PIN Instead'
                      onPress={() => setShowPinInput(true)}
                      type='secondary'
                      icon='keypad'
                    />
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
