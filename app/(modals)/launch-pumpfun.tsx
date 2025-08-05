import { pumpFunRequests } from '@/libs/api_requests/pumpfun.request'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { z } from 'zod'

// Zod schema for validation
const pumpFunSchema = z.object({
  tokenName: z
    .string()
    .min(1, 'Token name is required')
    .max(50, 'Token name must be 50 characters or less')
    .regex(/^[a-zA-Z0-9\s]+$/, 'Only letters, numbers, and spaces allowed'),
  tokenSymbol: z
    .string()
    .min(1, 'Token symbol is required')
    .max(10, 'Token symbol must be 10 characters or less')
    .regex(/^[A-Z0-9]+$/, 'Only uppercase letters and numbers allowed'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less'),
  initialSolToBuy: z
    .number()
    .min(0.001, 'Minimum 0.001 SOL required')
    .max(1000, 'Maximum 1000 SOL allowed'),
  tokenImage: z.string().optional(),
  twitter: z.string().url().optional().or(z.literal('')),
  telegram: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
})

type PumpFunFormData = z.infer<typeof pumpFunSchema>

export default function LaunchPumpFunModal() {
  const [formData, setFormData] = useState<PumpFunFormData>({
    tokenName: '',
    tokenSymbol: '',
    description: '',
    initialSolToBuy: 0.001,
    tokenImage: '',
    twitter: '',
    telegram: '',
    website: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showSocials, setShowSocials] = useState(false)

  const updateFormData = (
    field: keyof PumpFunFormData,
    value: string | number
  ) => {
    // Handle numeric conversion for initialSolToBuy
    const processedValue =
      field === 'initialSolToBuy' ? parseFloat(value.toString()) || 0 : value

    setFormData((prev) => ({ ...prev, [field]: processedValue }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    try {
      pumpFunSchema.parse(formData)
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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        updateFormData('tokenImage', result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors above')
      return
    }

    setIsLoading(true)
    try {
      const response = await pumpFunRequests.createToken(formData)

      if (response.success) {
        Alert.alert(
          'Success',
          'Token creation request submitted successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.dismiss(),
            },
          ]
        )
      } else {
        Alert.alert('Error', response.message || 'Failed to create token')
      }
    } catch (error: any) {
      console.error('Error creating token:', error)
      Alert.alert('Error', error?.message || 'Failed to create token')
    } finally {
      setIsLoading(false)
    }
  }

  const renderInput = (
    label: string,
    field: keyof PumpFunFormData,
    placeholder: string,
    options?: {
      multiline?: boolean
      keyboardType?: 'default' | 'numeric' | 'email-address' | 'url'
      maxLength?: number
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
    }
  ) => (
    <View className='mb-4'>
      <Text className='text-white text-sm mb-2 ml-1'>{label}</Text>
      <View className='bg-secondary-light rounded-2xl'>
        <TextInput
          className='text-white p-4'
          placeholder={placeholder}
          placeholderTextColor='#6b7280'
          value={formData[field]?.toString() || ''}
          onChangeText={(text) => updateFormData(field, text)}
          multiline={options?.multiline}
          keyboardType={options?.keyboardType || 'default'}
          maxLength={options?.maxLength}
          autoCapitalize={options?.autoCapitalize || 'sentences'}
        />
      </View>
      {errors[field] && (
        <Text className='text-red-400 text-sm mt-1 ml-1'>{errors[field]}</Text>
      )}
    </View>
  )

  return (
    <SafeAreaView className='flex-1 bg-primary-main'>
      <View className='flex-row items-center p-4 border-b border-dark-300'>
        <TouchableOpacity onPress={() => router.dismiss()} className='mr-4'>
          <Ionicons name='chevron-back' size={24} color='white' />
        </TouchableOpacity>
        <Text className='text-white text-xl font-semibold flex-1'>
          Create a new coin
        </Text>
      </View>

      <ScrollView className='flex-1 p-4' showsVerticalScrollIndicator={false}>
        {/* Token Name */}
        {renderInput('Token Name', 'tokenName', '...', { maxLength: 50 })}

        {/* Token Symbol */}
        {renderInput('Token Symbol', 'tokenSymbol', '...', {
          maxLength: 10,
          autoCapitalize: 'characters',
        })}

        {/* Description */}
        {renderInput('Description', 'description', '...', {
          multiline: true,
          maxLength: 500,
        })}

        {/* Initial SOL to Buy */}
        {renderInput('Initial SOL to Buy', 'initialSolToBuy', '0.001', {
          keyboardType: 'numeric',
        })}

        {/* Token Image */}
        <View className='mb-4'>
          <Text className='text-white text-sm mb-2 ml-1'>Token Image</Text>
          <TouchableOpacity
            className='bg-secondary-light rounded-2xl border-2 border-dashed border-gray-500 p-8 items-center justify-center'
            onPress={pickImage}
          >
            {formData.tokenImage ? (
              <View className='items-center'>
                <Image
                  source={{ uri: formData.tokenImage }}
                  className='w-24 h-24 rounded-xl mb-3'
                  resizeMode='cover'
                />
                <Text className='text-white text-sm mt-2'>Image selected</Text>
                <Text className='text-gray-400 text-xs mt-1'>
                  Tap to change
                </Text>
              </View>
            ) : (
              <View className='items-center'>
                <Ionicons name='cloud-upload' size={48} color='#6366f1' />
                <Text className='text-white text-sm mt-2'>
                  drag and drop an image or video
                </Text>
                <TouchableOpacity
                  className='bg-primary-500 px-4 py-2 rounded-xl mt-3'
                  disabled
                >
                  <Text className='text-white font-medium'>select file</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Socials Section */}
        <TouchableOpacity
          className='mb-4'
          onPress={() => setShowSocials(!showSocials)}
        >
          <Text className='text-primary-500 text-sm font-medium'>
            add socials (optional) {showSocials ? '↑' : '↓'}
          </Text>
        </TouchableOpacity>

        {showSocials && (
          <View className='mb-4'>
            {renderInput('Twitter (optional)', 'twitter', '...', {
              keyboardType: 'url',
              autoCapitalize: 'none',
            })}
            {renderInput('Telegram (optional)', 'telegram', '...', {
              keyboardType: 'url',
              autoCapitalize: 'none',
            })}
            {renderInput('Website (optional)', 'website', '...', {
              keyboardType: 'url',
              autoCapitalize: 'none',
            })}
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          className='bg-primary-500 rounded-2xl py-4 items-center mt-6 mb-8'
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color='white' />
          ) : (
            <Text className='text-white font-semibold text-lg'>Go Live!</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
