import { blurHashPlaceholder } from '@/constants/App'
import { formatPriceChange, formatValue } from '@/libs/string.helpers'
import { cn } from '@/libs/utils'
import { BirdEyeTokenItem } from '@/types'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface TokenCardProps {
  token: BirdEyeTokenItem
  showBalance?: boolean
  onPress?: () => void
  className?: string
  mc?: boolean
}

export function TokenCard({
  token,
  showBalance = true,
  mc = false,
  onPress,
  className,
}: TokenCardProps) {
  const [imageError, setImageError] = useState(false)

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else {
      // Pass token data as params when navigating
      router.push({
        pathname: '/(modals)/token-detail',
        params: {
          tokenAddress: token.address,
          symbol: token.symbol,
          name: token.name,
        },
      })
    }
  }

  // const imageUri = token.logoURI || token.icon
  const imageUri = token.logoURI
  const showImage = imageUri && !imageError
  return (
    <TouchableOpacity
      onPress={handlePress}
      className={cn(
        'bg-dark-200 rounded-2xl p-4 mb-3 active:scale-98',
        className
      )}
    >
      <View className='flex-row items-center justify-between'>
        <View className='flex-row items-center flex-1'>
          <View className='w-12 h-12 bg-primary-500/20 rounded-full justify-center items-center mr-3 overflow-hidden'>
            {showImage ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: 48, height: 48, borderRadius: 24 }}
                onError={() => setImageError(true)}
                // resizeMode='cover'
                placeholder={{ blurhash: blurHashPlaceholder }}
              />
            ) : (
              <Text className='text-lg font-bold text-primary-400'>
                {token.symbol?.charAt(0) || '?'}
              </Text>
            )}
          </View>
          <View className='flex-1'>
            <Text className='text-white font-semibold text-lg'>
              {/* {token.symbol || 'Unknown'} */}
              {token.name || 'Unknown Token'}
            </Text>
            <Text className='text-gray-400 text-sm' numberOfLines={1}>
              {/* {token.name || 'Unknown Token'} */}
              {mc && '$'}
              {formatValue(token.uiAmount || token.balance)} {token.symbol}
            </Text>
            {/* {showBalance && (
              <Text className='text-gray-500 text-xs'>
                {formatBalance(token.uiAmount || token.balance, token.symbol)}
              </Text>
            )} */}
          </View>
        </View>
        <View className='items-end'>
          <Text className='text-white font-semibold text-lg'>
            ${formatValue(token.valueUsd)}
          </Text>
          {token.priceChange24h !== undefined && (
            <Text
              className={`text-sm font-medium ${
                token.priceChange24h >= 0
                  ? 'text-success-400'
                  : 'text-danger-400'
              }`}
            >
              {formatPriceChange(token.priceChange24h)}
            </Text>
          )}
          {/* {token.priceUsd && (
            <Text className='text-gray-500 text-xs'>
              ${token.priceUsd.toFixed(token.priceUsd >= 1 ? 2 : 6)}
            </Text>
          )} */}
        </View>
      </View>
    </TouchableOpacity>
  )
}
