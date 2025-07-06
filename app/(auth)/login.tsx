import AppLogo from '@/components/ui/AppLogo'
import CustomButton from '@/components/ui/CustomButton'
import CustomTextInput from '@/components/ui/CustomTextInput'
import { Images } from '@/constants/Images'
import { Ionicons } from '@expo/vector-icons'
import { useLoginWithEmail } from '@privy-io/expo'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { z } from 'zod'

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { sendCode } = useLoginWithEmail()

  const handleLogin = async () => {
    try {
      // Validate email using Zod
      emailSchema.parse({ email })
      setError(null)

      setIsLoading(true)
      await sendCode({
        email,
      })
      router.push({
        pathname: '/(auth)/verify-email',
        params: { email },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message)
      } else {
        console.log('login error', error)
        Alert.alert(
          'Error',
          'Failed to send verification code. Please try again.'
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-dark-50'>
      <LinearGradient
        colors={['#0a0a0b', '#1a1a1f', '#0a0a0b']}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            className='flex-1 px-6'
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className='flex-row items-center justify-between pt-4 mb-8'>
              <TouchableOpacity
                onPress={() => router.back()}
                className='p-2 -ml-2'
              >
                <Ionicons name='arrow-back' size={24} color='white' />
              </TouchableOpacity>
              <Text className='text-lg font-semibold text-white'>Sign In</Text>
              <View className='w-8' />
            </View>
            {/* Logo */}
            <View className='items-center mb-8'>
              <View className='mb-6 shadow-glow'>
                <AppLogo size={64} />
              </View>
              <Text className='text-2xl font-bold text-white mb-2'>
                Welcome Back
              </Text>
              <Text className='text-gray-400 text-center'>
                Sign in to your Cellar account
              </Text>
            </View>
            {/* Form */}
            <View className='gap-6'>
              {/* Email Input */}
              <View>
                <CustomTextInput
                  label='Email Address'
                  icon='mail-outline'
                  placeholder='Enter your email'
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text)
                    setError(null)
                  }}
                  keyboardType='email-address'
                  autoCapitalize='none'
                  returnKeyType='done'
                />
                {error && (
                  <Text className='text-red-500 text-sm mt-1'>{error}</Text>
                )}
              </View>
            </View>
            {/* Sign In Button */}
            <CustomButton
              text={isLoading ? 'Sending Code...' : 'Continue with Email'}
              onPress={handleLogin}
              type='primary'
              className='mt-6 mb-6'
            />

            {/* Sign Up Link */}
            <View className='flex-row justify-center items-center mb-8'>
              <Text className='text-gray-400'>Protected by </Text>
              <TouchableOpacity
                className='flex-row items-center'
                onPress={() => Linking.openURL('https://privy.io')}
              >
                <Image
                  source={Images.privyLogo}
                  className='w-12 h-12'
                  resizeMode='contain'
                />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  )
}
