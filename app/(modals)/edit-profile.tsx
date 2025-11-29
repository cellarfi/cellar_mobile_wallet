import CustomButton from '@/components/ui/CustomButton'
import CustomTextInput from '@/components/ui/CustomTextInput'
import { TAG_NAME_UPDATE_RATE_LIMIT } from '@/constants/App'
import { useDebouncedCallback } from '@/hooks/useDebounce'
import { userRequests } from '@/libs/api_requests/user.request'
import { useAuthStore } from '@/store/authStore'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
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

const editProfileSchema = z.object({
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
  about: z.string().max(160, 'Bio must be 160 characters or less').optional(),
})

const EditProfileModal = () => {
  const { profile, setProfile } = useAuthStore()
  const [formData, setFormData] = useState({
    display_name: '',
    tag_name: '',
    about: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingTag, setIsCheckingTag] = useState(false)
  const [tagNameAvailable, setTagNameAvailable] = useState<boolean | null>(null)

  // State for tag name update rate limiting
  const [isTagNameRateLimited, setIsTagNameRateLimited] = useState(false)
  const [tagNameUpdateAvailableDate, setTagNameUpdateAvailableDate] =
    useState<Date | null>(null)

  // Format date to display to user
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Check if tag name updates are rate limited
  const checkTagNameRateLimit = useCallback(() => {
    if (!profile || !profile.tag_name_updated_at) return

    // Get the date of the last tag name update
    const lastUpdateDate = new Date(profile.tag_name_updated_at)

    // Calculate the date when tag name updates will be allowed again
    const availableDate = new Date(lastUpdateDate)
    availableDate.setDate(availableDate.getDate() + TAG_NAME_UPDATE_RATE_LIMIT)

    // Get current date for comparison
    const currentDate = new Date()

    // Check if we're still within the rate limit period
    const isLimited = currentDate < availableDate

    setIsTagNameRateLimited(isLimited)
    setTagNameUpdateAvailableDate(isLimited ? availableDate : null)
  }, [profile])

  // Initialize form with current profile data and check rate limiting
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        tag_name: profile.tag_name || '',
        about: profile.about || '',
      })

      // Check if tag name updates are rate limited
      checkTagNameRateLimit()
    }
  }, [profile, checkTagNameRateLimit])

  // Debounced tag name check
  const debouncedCheckTagName = useDebouncedCallback(
    async (tagName: string) => {
      await checkTagName(tagName)
    },
    500
  )

  const updateFormData = (field: string, value: string) => {
    const newValue = field === 'tag_name' ? value.toLowerCase() : value

    setFormData((prev) => ({
      ...prev,
      [field]: newValue,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }))
    }

    // Handle tag name validation
    if (field === 'tag_name') {
      setTagNameAvailable(null)
      debouncedCheckTagName(newValue)
    }
  }

  const validateForm = () => {
    try {
      if (tagNameAvailable === false) {
        setErrors((prev) => ({
          ...prev,
          tag_name:
            'This tag name is already taken. Please choose another one.',
        }))
        return false
      }

      editProfileSchema.parse(formData)

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

    setIsLoading(true)
    try {
      const updateData: any = {}

      console.log('formData', formData)

      // Only include fields that have changed
      if (formData.display_name !== profile?.display_name) {
        updateData.display_name = formData.display_name.trim()
      }

      if (formData.tag_name !== profile?.tag_name) {
        updateData.tag_name = formData.tag_name.trim().toLowerCase()
      }

      if (formData.about !== profile?.about && formData.about) {
        updateData.about = formData.about.trim() || ''
      }

      console.log('updateData', updateData)

      // If no changes, just close the modal
      if (Object.keys(updateData).length === 0) {
        router.back()
        return
      }

      const response = await userRequests.updateProfile(updateData)

      if (response.success && response.data) {
        setProfile(response.data)
        router.back()
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile')
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      Alert.alert(
        'Error',
        error?.message || 'An unexpected error occurred. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const checkTagName = async (tagName: string) => {
    // Skip check if tag name is invalid
    if (tagName.length < 3) {
      setTagNameAvailable(null)
      return
    }

    // Skip check if the tag name hasn't changed
    if (profile?.tag_name?.toLowerCase() === tagName.toLowerCase()) {
      setTagNameAvailable(true)
      return
    }

    try {
      setIsCheckingTag(true)
      const response = await userRequests.checkTagNameExists(tagName)
      const isAvailable = !response.data?.exists
      setTagNameAvailable(isAvailable)

      if (!response.data?.exists) {
        // Clear the error if the tag name becomes available
        const { tag_name, ...rest } = errors
        setErrors(rest)
      }
      return isAvailable
    } catch (error) {
      console.error('Error checking tag name:', error)
      // On error, we'll assume the tag is available to avoid blocking the user
      setTagNameAvailable(true)
      return true
    } finally {
      setIsCheckingTag(false)
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-primary-main' edges={['top']}>
      {/* <LinearGradient
        colors={['#0a0a0b', '#1a1a1f', '#0a0a0b']}
        style={{ flex: 1 }}
      > */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className='flex-row items-center justify-between p-4 border-b border-dark-200'>
          <TouchableOpacity onPress={() => router.dismiss()} className='p-2'>
            <Ionicons name='close' size={24} color='#9ca3af' />
          </TouchableOpacity>
          <Text className='text-white text-lg font-semibold'>Edit Profile</Text>
          <View className='w-10' />
        </View>

        <ScrollView
          className='flex-1 px-6 pt-6'
          showsVerticalScrollIndicator={false}
        >
          <View className='gap-6'>
            {/* Display Name Input */}
            <View className='mb-6'>
              <CustomTextInput
                label='Display Name'
                icon='person-outline'
                placeholder='Enter your display name'
                value={formData.display_name}
                onChangeText={(text) => updateFormData('display_name', text)}
                autoCapitalize='words'
                returnKeyType='next'
                maxLength={50}
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
                returnKeyType='done'
                maxLength={20}
                editable={!isTagNameRateLimited}
              />
              {!isTagNameRateLimited && (
                <View className='flex-row items-center justify-between mt-1'>
                  <Text className='text-gray-500 text-xs'>
                    This will be your unique identifier (like @
                    {formData.tag_name || 'tag_name'})
                  </Text>
                  {isCheckingTag ? (
                    <Text className='text-yellow-500 text-xs'>Checking...</Text>
                  ) : tagNameAvailable === true ? (
                    <Text className='text-green-500 text-xs'>Available!</Text>
                  ) : tagNameAvailable === false ? (
                    <Text className='text-red-500 text-xs'>Not available</Text>
                  ) : null}
                </View>
              )}
              {isTagNameRateLimited && tagNameUpdateAvailableDate && (
                <Text className='text-gray-500 text-xs mt-1'>
                  Tag name can only be updated every{' '}
                  {TAG_NAME_UPDATE_RATE_LIMIT} days. Available again on{' '}
                  {formatDate(tagNameUpdateAvailableDate)}
                </Text>
              )}
              {errors.tag_name && (
                <Text className='text-red-500 text-sm mt-1'>
                  {errors.tag_name}
                </Text>
              )}
            </View>

            {/* Bio Input */}
            <View className='mb-6'>
              <CustomTextInput
                label='Bio (Optional)'
                icon='pencil-outline'
                placeholder='Tell us about yourself...'
                value={formData.about}
                onChangeText={(text) => updateFormData('about', text)}
                multiline
                numberOfLines={3}
                maxLength={160}
                returnKeyType='next'
              />
              {errors.about && (
                <Text className='text-red-500 text-sm mt-1'>
                  {errors.about}
                </Text>
              )}
            </View>
          </View>

          <CustomButton
            text={isLoading ? 'Saving...' : 'Save Changes'}
            onPress={handleSubmit}
            type='primary'
            className='mt-8 mb-6'
            disabled={isLoading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      {/* </LinearGradient> */}
    </SafeAreaView>
  )
}

export default EditProfileModal
