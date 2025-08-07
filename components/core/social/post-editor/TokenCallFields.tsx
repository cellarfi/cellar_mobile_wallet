import { blurHashPlaceholder } from '@/constants/App'
import { BirdEyeSearchTokenResult } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import React from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'

interface TokenCallFieldsProps {
  selectedToken: BirdEyeSearchTokenResult | null
  targetPrice: string
  onTokenSelectorPress: () => void
  onFieldChange: (field: string, value: string) => void
  fieldErrors?: Record<string, string>
  disabled?: boolean
}

// Token Selector Card Component
const TokenSelectorCard = React.memo(
  ({
    selectedToken,
    onPress,
    disabled = false,
  }: {
    selectedToken: BirdEyeSearchTokenResult | null
    onPress: () => void
    disabled?: boolean
  }) => (
    <View className='bg-secondary-light rounded-2xl p-4 mb-2'>
      <View className='flex-row items-center justify-between mb-3'>
        <Text className='text-gray-400 text-sm'>Token Information</Text>
      </View>

      <TouchableOpacity
        className='flex-row items-center bg-secondary-disabled rounded-xl p-3'
        onPress={onPress}
        disabled={disabled}
        style={{
          opacity: disabled ? 0.7 : 1,
        }}
      >
        {selectedToken ? (
          <>
            <View className='w-8 h-8 bg-primary-500/20 rounded-full justify-center items-center mr-2 overflow-hidden'>
              <Image
                source={{ uri: selectedToken.logo_uri || '' }}
                style={{ width: 32, height: 32, borderRadius: 16 }}
                placeholder={{ blurhash: blurHashPlaceholder }}
                contentFit='cover'
              />
            </View>
            <View className='flex-1 mr-2'>
              <Text className='text-white font-semibold'>
                {selectedToken.symbol}
              </Text>
              <Text className='text-gray-400 text-sm'>
                {selectedToken.name}
              </Text>
            </View>
            <Ionicons name='chevron-down' size={16} color='#666672' />
          </>
        ) : (
          <>
            <Text className='text-gray-400 mr-2'>Select Token</Text>
            <Ionicons name='chevron-down' size={16} color='#666672' />
          </>
        )}
      </TouchableOpacity>
    </View>
  )
)

TokenSelectorCard.displayName = 'TokenSelectorCard'

const TokenCallFields: React.FC<TokenCallFieldsProps> = ({
  selectedToken,
  targetPrice,
  onTokenSelectorPress,
  onFieldChange,
  fieldErrors = {},
  disabled = false,
}) => {
  return (
    <View>
      {/* Token Selector Card */}
      <TokenSelectorCard
        selectedToken={selectedToken}
        onPress={onTokenSelectorPress}
        disabled={disabled}
      />

      {/* Target Price Field - Only show if token is selected */}
      {selectedToken && (
        <>
          <TextInput
            className='bg-secondary-light text-white rounded-xl px-4 py-3 mb-2'
            placeholder='Target Price (optional)'
            placeholderTextColor='#888'
            keyboardType='numeric'
            value={targetPrice}
            onChangeText={(v) => onFieldChange('targetPrice', v)}
            editable={!disabled}
            style={{
              borderWidth: fieldErrors?.target_price ? 1 : 0,
              borderColor: fieldErrors?.target_price ? '#ef4444' : undefined,
              opacity: disabled ? 0.7 : 1,
            }}
          />

          {/* Error Messages */}
          {fieldErrors?.target_price && (
            <Text className='text-red-500 mb-2 text-sm'>
              {fieldErrors.target_price}
            </Text>
          )}
        </>
      )}

      {/* Token Selection Error */}
      {fieldErrors?.token_address && (
        <Text className='text-red-500 mb-2 text-sm'>
          {fieldErrors.token_address}
        </Text>
      )}
    </View>
  )
}

export default TokenCallFields
