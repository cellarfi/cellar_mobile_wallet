import CustomButton from '@/components/ui/CustomButton'
import CustomTextInput from '@/components/ui/CustomTextInput'
import { Colors } from '@/constants/Colors'
import { Images } from '@/constants/Images'
import { Ionicons } from '@expo/vector-icons'
import { useLoginWithEmail } from '@privy-io/expo'
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
    <SafeAreaView className='flex-1 bg-primary-main'>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className='flex-1 px-6'
          showsVerticalScrollIndicator={false}
          contentContainerClassName='grow'
        >
          <View className=''>
            {/* Header */}
            <View className='flex-row items-center justify-between pt-4 mb-8'>
              <TouchableOpacity
                onPress={() => router.replace('/(auth)')}
                className='p-2 -ml-2'
              >
                <Ionicons
                  name='chevron-back'
                  size={20}
                  color={Colors.dark.secondary}
                />
              </TouchableOpacity>
              <View className='w-8' />
            </View>

            {/* Welcome */}
            <View className='mt-10 mb-10'>
              <Text className='text-[24px] font-bold text-white mb-2'>
                Sign in
              </Text>
              <Text className='text-[14px] text-[#ABA7B5]'>
                Login into your account to continue trading
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
          </View>

          {/* Sign In Button */}
          <CustomButton
            text={isLoading ? 'Sending Code...' : 'Continue'}
            // text={isLoading ? 'Sending Code...' : 'Continue with Email'}
            onPress={handleLogin}
            type='primary'
            className='mt-6 mb-3'
            disabled={!z.string().email().safeParse(email).success}
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
    </SafeAreaView>
  )
}
