import AppLogo from '@/components/ui/AppLogo'
import CustomButton from '@/components/ui/CustomButton'
import CustomTextInput from '@/components/ui/CustomTextInput'
import { CreateUserDto } from '@/dto/users.dto'
import { userRequests } from '@/libs/api_requests/user.request'
import { useAuthStore } from '@/store/authStore'
import { usePrivy } from '@privy-io/expo'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { z } from 'zod'

const setupProfileSchema = z.object({
  display_name: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be 50 characters or less')
    .regex(
      /^[a-zA-Z0-9\s._-]+$/,
      'Only letters, numbers, spaces, dots, underscores, and hyphens allowed'
    ),
  tag_name: z
    .string()
    .min(3, 'Tag name must be at least 3 characters')
    .max(20, 'Tag name must be 20 characters or less')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Only letters, numbers, underscores, and hyphens allowed'
    )
    .refine((val) => !val.startsWith('_') && !val.endsWith('_'), {
      message: 'Tag name cannot start or end with underscore',
    }),
  referral_code: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 3, {
      message: 'Referral code must be at least 3 characters if provided',
    }),
})

const SetupProfile = () => {
  const { user: privyUser } = usePrivy()
  const { setProfile } = useAuthStore()

  const [formData, setFormData] = useState({
    display_name: '',
    tag_name: '',
    referral_code: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    try {
      setupProfileSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(fieldErrors)
      }
      return false
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    // Get email from linked accounts
    const emailAccount = privyUser?.linked_accounts?.find(
      (account: any) => account.type === 'email'
    ) as { type: 'email'; address: string } | undefined

    if (!privyUser?.id || !emailAccount?.address) {
      Alert.alert(
        'Error',
        'User information not available. Please try logging in again.'
      )
      return
    }

    setIsLoading(true)
    try {
      const createUserData: CreateUserDto = {
        id: privyUser.id,
        email: emailAccount.address,
        display_name: formData.display_name.trim(),
        tag_name: formData.tag_name.trim().toLowerCase(),
        referral_code: formData.referral_code.trim() || undefined,
      }

      const response = await userRequests.createUser(createUserData)

      if (response.success && response.data) {
        // Update profile in store
        setProfile(response.data)

        // Show success message
        Alert.alert('Success!', 'Your profile has been created successfully.', [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)'),
          },
        ])
      } else {
        Alert.alert(
          'Error',
          response.message || 'Failed to create profile. Please try again.'
        )
      }
    } catch (error: any) {
      console.error('Error creating profile:', error)
      Alert.alert(
        'Error',
        error?.message || 'An unexpected error occurred. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    Alert.alert(
      'Skip Profile Setup',
      'You can set up your profile later in the settings. Continue to the app?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => router.replace('/(tabs)'),
        },
      ]
    )
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
              <View className='w-8' />
              <Text className='text-lg font-semibold text-white'>
                Setup Profile
              </Text>
              <TouchableOpacity onPress={handleSkip} className='p-2'>
                <Text className='text-gray-400 font-medium'>Skip</Text>
              </TouchableOpacity>
            </View>

            {/* Logo */}
            <View className='items-center mb-8'>
              <View className='mb-6 shadow-glow'>
                <AppLogo size={64} />
              </View>
              <Text className='text-2xl font-bold text-white mb-2'>
                Complete Your Profile
              </Text>
              <Text className='text-gray-400 text-center px-4'>
                Set up your profile to get started with Cellar
              </Text>
            </View>

            {/* Form */}
            <View className='gap-6'>
              {/* Display Name Input */}
              <View>
                <CustomTextInput
                  label='Display Name'
                  icon='person-outline'
                  placeholder='Enter your display name'
                  value={formData.display_name}
                  onChangeText={(text) => updateFormData('display_name', text)}
                  autoCapitalize='words'
                  returnKeyType='next'
                />
                {errors.display_name && (
                  <Text className='text-red-500 text-sm mt-1'>
                    {errors.display_name}
                  </Text>
                )}
              </View>

              {/* Tag Name Input */}
              <View>
                <CustomTextInput
                  label='Tag Name'
                  icon='at-outline'
                  placeholder='Enter your tag name'
                  value={formData.tag_name}
                  onChangeText={(text) => updateFormData('tag_name', text)}
                  autoCapitalize='none'
                  returnKeyType='next'
                />
                <Text className='text-gray-500 text-xs mt-1'>
                  This will be your unique identifier (like @
                  {formData.tag_name || 'username'})
                </Text>
                {errors.tag_name && (
                  <Text className='text-red-500 text-sm mt-1'>
                    {errors.tag_name}
                  </Text>
                )}
              </View>

              {/* Referral Code Input */}
              <View>
                <CustomTextInput
                  label='Referral Code (Optional)'
                  icon='gift-outline'
                  placeholder='Enter referral code'
                  value={formData.referral_code}
                  onChangeText={(text) => updateFormData('referral_code', text)}
                  autoCapitalize='none'
                  returnKeyType='done'
                />
                <Text className='text-gray-500 text-xs mt-1'>
                  Have a referral code? Enter it here for special rewards
                </Text>
                {errors.referral_code && (
                  <Text className='text-red-500 text-sm mt-1'>
                    {errors.referral_code}
                  </Text>
                )}
              </View>
            </View>

            {/* Create Profile Button */}
            <CustomButton
              text={isLoading ? 'Creating Profile...' : 'Create Profile'}
              onPress={handleSubmit}
              type='primary'
              className='mt-8 mb-6'
              disabled={isLoading}
            />

            {/* Help Text */}
            <Text className='text-gray-500 text-center text-sm mb-8'>
              By creating your profile, you agree to our Terms of Service and
              Privacy Policy
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  )
}

export default SetupProfile
