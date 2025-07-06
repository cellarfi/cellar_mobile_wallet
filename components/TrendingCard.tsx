import { blurHashPlaceholder } from '@/constants/App'
import { formatPriceChange, formatValue } from '@/libs/string.helpers'
import { BirdEyeTrendingTokenItem } from '@/types'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface TrendingCardProps {
  token: BirdEyeTrendingTokenItem
  onPress?: () => void
}

export function TrendingCard({ token, onPress }: TrendingCardProps) {
  const [imageError, setImageError] = useState(false)

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else {
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

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toFixed(2)}`
    } else {
      return `$${price.toFixed(6)}`
    }
  }

  const showImage = token.logoURI && !imageError

  return (
    <TouchableOpacity
      onPress={handlePress}
      className='bg-dark-200 rounded-2xl p-4 mr-3 w-48 active:scale-95'
    >
      <View className='flex-row items-center mb-3'>
        <View className='w-10 h-10 bg-primary-500/20 rounded-full justify-center items-center mr-3 overflow-hidden'>
          {showImage ? (
            <Image
              source={{ uri: token.logoURI }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              onError={() => setImageError(true)}
              // resizeMode='cover'
              placeholder={{ blurhash: blurHashPlaceholder }}
            />
          ) : (
            <Text className='text-sm font-bold text-primary-400'>
              {token.symbol?.charAt(0) || '?'}
            </Text>
          )}
        </View>
        <View className='flex-1'>
          <Text className='text-white font-semibold'>{token.symbol}</Text>
          <Text className='text-gray-400 text-xs' numberOfLines={1}>
            {token.name}
          </Text>
        </View>
      </View>
      <Text className='text-white font-bold text-lg mb-1'>
        {formatPrice(token.price)}
      </Text>
      <View className='flex-row justify-between'>
        <Text
          className={`text-sm font-medium ${
            (token.price24hChangePercent || 0) >= 0
              ? 'text-success-400'
              : 'text-danger-400'
          }`}
        >
          {formatPriceChange(token.price24hChangePercent)}
        </Text>
        <Text className='text-gray-400 text-xs'>
          {formatValue(token.volume24hUSD)}
        </Text>
      </View>
    </TouchableOpacity>
  )
}
