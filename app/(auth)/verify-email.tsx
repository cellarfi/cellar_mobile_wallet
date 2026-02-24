import CustomButton from '@/components/ui/CustomButton'
import { Keys } from '@/constants/App'
import { Colors } from '@/constants/Colors'
import { ipInfoRequests } from '@/libs/api_requests/ipinfo.request'
import { sessionRequests } from '@/libs/api_requests/session.request'
import { userRequests } from '@/libs/api_requests/user.request'
import {
    getDeviceInfoAsync,
    registerForPushNotifications,
} from '@/libs/notifications.lib'
import { Ionicons } from '@expo/vector-icons'
import { useIdentityToken, useLoginWithEmail } from '@privy-io/expo'
import * as Clipboard from 'expo-clipboard'
import { router, useLocalSearchParams } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
    Alert,
    AppState,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
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
  const isVerifying = useRef(false)
  const hasNavigated = useRef(false)

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
  const checkClipboardForOTP = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync()
      // Only process if the text is exactly 6 digits
      if (text && /^\d{6}$/.test(text)) {
        handlePaste(text)
      }
    } catch (error) {
      console.log('Error checking clipboard:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  }, [checkClipboardForOTP])

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
    // Prevent multiple simultaneous verification attempts
    if (isVerifying.current) {
      console.log('Verification already in progress, skipping duplicate call')
      return
    }

    const code = otpString || otp.join('')
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter the complete verification code')
      return
    }

    isVerifying.current = true
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

        // Register device session for push notifications
        try {
          const pushToken = await registerForPushNotifications()
          console.log('Push token:', pushToken)
          if (pushToken) {
            const deviceInfo = await getDeviceInfoAsync()

            // Fetch IP info for location data
            const ipInfo = await ipInfoRequests.getIPInfo()

            // Store device ID and push token for later use
            await SecureStore.setItemAsync(Keys.DEVICE_ID, deviceInfo.deviceId)
            await SecureStore.setItemAsync(Keys.PUSH_TOKEN, pushToken)

            const sessionResponse = await sessionRequests.createSession({
              device_id: deviceInfo.deviceId,
              push_token: pushToken,
              platform: deviceInfo.platform,
              device_name: deviceInfo.deviceName || undefined,
              device_model: deviceInfo.deviceModel || undefined,
              os_version: deviceInfo.osVersion || undefined,
              app_version: deviceInfo.appVersion,
              ip_address: ipInfo.data?.ip,
              country: ipInfo.data?.country,
              city: ipInfo.data?.city,
              status: 'ACTIVE',
            })

            if (sessionResponse.success) {
              console.log('Device session registered successfully')
              // Store session ID for later use
              if (sessionResponse.data?.id) {
                await SecureStore.setItemAsync(
                  Keys.DEVICE_SESSION_ID,
                  sessionResponse.data.id
                )
              }
            } else {
              console.log(
                'Failed to register device session:',
                sessionResponse.message
              )
            }
          } else {
            console.log(
              'No push token available, skipping session registration'
            )
          }
        } catch (sessionError) {
          console.log('Error registering device session:', sessionError)
          // Don't block login if session registration fails
        }

        // Fetch user profile and determine navigation
        let shouldNavigateToProfileSetup = false
        let shouldShowWarning = false

        try {
          const profileResponse = await userRequests.getProfile()
          console.log('Profile response:', profileResponse)

          if (profileResponse.success && profileResponse.data) {
            // User profile exists, store it
            setProfile(profileResponse.data)
            console.log('User profile stored successfully')
          } else if (profileResponse.message === 'User not found') {
            // User needs to set up profile
            console.log('User not found, redirecting to profile setup')
            shouldNavigateToProfileSetup = true
          } else {
            // Other error, show warning but continue
            console.log('Profile fetch failed:', profileResponse.message)
            shouldShowWarning = true
          }
        } catch (profileError) {
          console.log('Error fetching profile:', profileError)
          shouldShowWarning = true
        }

        // Show warning if needed
        if (shouldShowWarning) {
          Alert.alert(
            'Warning',
            'Could not fetch profile data. You can set it up later.'
          )
        }

        // Navigate based on the outcome - ensure we only navigate once
        if (hasNavigated.current) {
          console.log(
            'Navigation already triggered, skipping duplicate navigation'
          )
          return
        }

        hasNavigated.current = true

        if (shouldNavigateToProfileSetup) {
          router.replace('/setup-profile')
        } else {
          // Navigate to tabs - AuthProvider will handle biometric setup prompt
          // router.replace('/(tabs)')
          // FIX: Do NOT navigate manually here. AuthProvider detects the auth state change
          // and handles navigation to /(tabs). This prevents race conditions where
          // both this component and AuthProvider try to navigate or show modals.
          console.log('Login successful, waiting for AuthProvider to navigate...')
        }
      }
    } catch (error: any) {
      console.log('error', error?.message)
      if (error?.message?.includes('Already logged in')) {
        if (!hasNavigated.current) {
          hasNavigated.current = true
          // router.replace('/(tabs)')
          console.log('Already logged in, waiting for AuthProvider to navigate...')
        }
      } else {
        Alert.alert('Error', 'Invalid verification code. Please try again.')
      }
    } finally {
      isVerifying.current = false
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
    } catch {
      Alert.alert('Error', 'Failed to resend code. Please try again.')
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-primary-main'>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className='flex-1 px-6'
          showsVerticalScrollIndicator={false}
        >
          <View className='flex-1 px-6 py-8'>
            {/* Header */}
            <View className='flex-row items-center justify-between mb-12'>
              <TouchableOpacity
                onPress={() => router.back()}
                className='p-2 -ml-2'
              >
                <Ionicons
                  name='chevron-back'
                  size={24}
                  color={Colors.dark.secondary}
                />
              </TouchableOpacity>
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
                  className='w-12 h-14 bg-secondary-light rounded-[8px] text-white text-xl font-bold text-center focus:border-primary-500 leading-6'
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
            <CustomButton
              text={isLoading ? 'Verifying...' : 'Verify'}
              onPress={() => handleVerify()}
              disabled={isLoading || otp.join('').length !== 6}
              className=' mb-6'
              type='primary'
            />
            {/* <TouchableOpacity
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
            </TouchableOpacity> */}

            {/* Help Text */}
            <Text className='text-text-light text-center text-sm'>
              Did not receive the code? Check your spam folder or try again.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
