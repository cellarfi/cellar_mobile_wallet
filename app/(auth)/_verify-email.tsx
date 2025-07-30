import { Keys } from '@/constants/App'
import { userRequests } from '@/libs/api_requests/user.request'
import { Ionicons } from '@expo/vector-icons'
import { useIdentityToken, useLoginWithEmail } from '@privy-io/expo'
import * as Clipboard from 'expo-clipboard'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import React, { useEffect, useRef, useState } from 'react'
import {
  Alert,
  AppState,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function VerifyEmailScreen() {
  const { sendCode, loginWithCode } = useLoginWithEmail()
  const { getIdentityToken } = useIdentityToken()
  const { email } = useLocalSearchParams<{ email: string }>()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [timer, setTimer] = useState(60)
  const inputRefs = useRef<TextInput[]>([])
  const appState = useRef(AppState.currentState)

  // Function to handle pasted text
  const handlePaste = (text: string) => {
    // Remove any non-digit characters
    const digits = text.replace(/\D/g, '')
    // Take only the first 6 digits
    const otpString = digits.slice(0, 6)
    if (otpString.length === 6) {
      const otpArray = otpString.split('')
      setOtp(otpArray)
      handleVerify(otpString)
    }
  }

  // Function to check clipboard for OTP - only if it's a 6-digit code
  const checkClipboardForOTP = async () => {
    try {
      const text = await Clipboard.getStringAsync()
      // Only process if the text is exactly 6 digits
      if (text && /^\d{6}$/.test(text)) {
        handlePaste(text)
      }
    } catch (error) {
      console.log('Error checking clipboard:', error)
    }
  }

  // Handle app state changes - only check clipboard on resume
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Only check clipboard when app resumes from background
        checkClipboardForOTP()
      }
      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => {
      clearInterval(interval)
      setOtp(['', '', '', '', '', ''])
    }
  }, [])

  const handleOtpChange = (value: string, index: number) => {
    // Only allow digits
    const digitOnly = value.replace(/[^0-9]/g, '')

    // If the value is longer than 1 character, it's likely a paste
    if (value.length > 1) {
      handlePaste(value)
      return
    }

    // If not a digit, don't update
    if (digitOnly !== value) {
      return
    }

    const newOtp = [...otp]
    newOtp[index] = digitOnly
    setOtp(newOtp)

    // Auto-focus next input
    if (digitOnly && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto verify when 6th digit is entered
    if (digitOnly && index === 5) {
      const otpString = newOtp.join('')
      if (otpString.length === 6) {
        handleVerify(otpString)
      }
    }
  }

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace - works better on Android
    if (e.nativeEvent.key === 'Backspace') {
      const newOtp = [...otp]

      // If current box is empty and we're not at the first box, go to previous
      if (!otp[index] && index > 0) {
        newOtp[index - 1] = ''
        setOtp(newOtp)
        inputRefs.current[index - 1]?.focus()
      }
      // If current box has content, clear it
      else if (otp[index]) {
        newOtp[index] = ''
        setOtp(newOtp)
      }
    }
  }

  // Additional handler for Android backspace
  const handleTextInput = (value: string, index: number) => {
    // If value is empty (backspace was pressed), handle it
    if (value === '') {
      const newOtp = [...otp]
      newOtp[index] = ''
      setOtp(newOtp)

      // Move to previous input if current is empty and not at first
      if (index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
      return
    }

    // Otherwise, handle normal input
    handleOtpChange(value, index)
  }

  const handleVerify = async (otpString?: string) => {
    const code = otpString || otp.join('')
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter the complete verification code')
      return
    }

    setIsLoading(true)
    try {
      const session = await loginWithCode({
        code,
        email,
      })
      console.log('session', session)

      // Save user to Zustand store for offline access
      if (session) {
        const { setUser, setProfile } =
          require('@/store/authStore').useAuthStore.getState()
        setUser(session)

        // Get and store Privy identity token
        try {
          const token = await getIdentityToken()
          console.log('Privy identity token:', token)
          if (token) {
            await SecureStore.setItemAsync(Keys.PRIVY_IDENTITY_TOKEN, token)
            console.log('Identity token stored successfully')
          }
        } catch (tokenError) {
          console.log('Error getting/storing identity token:', tokenError)
        }

        // Fetch user profile
        try {
          const profileResponse = await userRequests.getProfile()
          console.log('Profile response:', profileResponse)

          if (profileResponse.success && profileResponse.data) {
            // User profile exists, store it and navigate to main app
            setProfile(profileResponse.data)
            console.log('User profile stored successfully')
            router.replace('/(tabs)')
          } else {
            // Check if it's a "User not found" error
            if (profileResponse.message === 'User not found') {
              console.log('User not found, redirecting to profile setup')
              router.replace('/setup-profile')
            } else {
              // Other error, show alert but still navigate to main app
              console.log('Profile fetch failed:', profileResponse.message)
              Alert.alert(
                'Warning',
                'Could not fetch profile data. You can set it up later.'
              )
              router.replace('/(tabs)')
            }
          }
        } catch (profileError) {
          console.log('Error fetching profile:', profileError)
          Alert.alert(
            'Warning',
            'Could not fetch profile data. You can set it up later.'
          )
          router.replace('/(tabs)')
        }
      }
    } catch (error: any) {
      console.log('error', error?.message)
      if (error?.message?.includes('Already logged in'))
        router.replace('/(tabs)')
      else Alert.alert('Error', 'Invalid verification code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      await sendCode({
        email,
      })
      setTimer(60)
      Alert.alert('Success', 'Verification code sent!')
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code. Please try again.')
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-primary-main'>
      <LinearGradient
        colors={['#0a0a0b', '#1a1a1f', '#0a0a0b']}
        style={{ flex: 1 }}
      >
        <View className='flex-1 px-6 py-8'>
          {/* Header */}
          <View className='flex-row items-center justify-between mb-12'>
            <TouchableOpacity
              onPress={() => router.back()}
              className='p-2 -ml-2'
            >
              <Ionicons name='arrow-back' size={24} color='white' />
            </TouchableOpacity>
            <Text className='text-lg font-semibold text-white'>
              Verify Email
            </Text>
            <View className='w-8' />
          </View>

          {/* Icon */}
          <View className='items-center mb-8'>
            <View className='w-24 h-24 bg-primary-500/20 rounded-full justify-center items-center mb-6'>
              <Ionicons name='shield-checkmark' size={48} color='#6366f1' />
            </View>
            <Text className='text-2xl font-bold text-white mb-2 text-center'>
              Verify Your Email
            </Text>
            <Text className='text-gray-400 text-center px-4'>
              We sent a 6-digit verification code to {email}. Please enter it
              below.
            </Text>
          </View>

          {/* OTP Input */}
          <View className='flex-row justify-center gap-3 mb-8'>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  if (ref) inputRefs.current[index] = ref
                }}
                className='w-12 h-14 bg-dark-200 border-2 border-dark-400 rounded-xl text-white text-xl font-bold text-center focus:border-primary-500 leading-6'
                value={digit}
                onChangeText={(value) => handleTextInput(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType='numeric'
                maxLength={6}
                selectTextOnFocus
                autoComplete='one-time-code'
                textContentType='oneTimeCode'
                returnKeyType='next'
                blurOnSubmit={false}
                autoCorrect={false}
                autoCapitalize='none'
                spellCheck={false}
              />
            ))}
          </View>

          {/* Timer and Resend */}
          <View className='items-center mb-12'>
            {timer > 0 ? (
              <Text className='text-gray-400'>Resend code in {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text className='text-primary-400 font-medium'>
                  Resend Code
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            onPress={() => handleVerify()}
            disabled={isLoading || otp.join('').length !== 6}
            className='active:scale-95 mb-6'
          >
            <LinearGradient
              colors={
                otp.join('').length === 6
                  ? ['#6366f1', '#8b5cf6']
                  : ['#2d2d35', '#2d2d35']
              }
              style={{
                borderRadius: 16,
                padding: 16,
              }}
            >
              <Text
                className={`text-center text-lg font-semibold ${
                  otp.join('').length === 6 ? 'text-white' : 'text-gray-500'
                }`}
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Help Text */}
          <Text className='text-gray-500 text-center text-sm'>
            Did not receive the code? Check your spam folder or try again.
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  )
}
