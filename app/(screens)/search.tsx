import SearchTokens from '@/components/SearchTokens'
import { BirdEyeSearchTokenResult } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function SearchScreen() {
  // Get parameters for different behaviors
  const {
    mode = 'navigate', // 'navigate' or 'select'
    returnTo,
    returnParam,
    title = 'Search Tokens',
  } = useLocalSearchParams<{
    mode?: 'navigate' | 'select'
    returnTo?: string
    returnParam?: string
    title?: string
  }>()

  const handleTokenSelect = (token: any) => {
    if (mode === 'navigate') {
      // Navigate to token detail screen
      router.push({
        pathname: '/(screens)/token-detail',
        params: { tokenAddress: token.address },
      })
    } else if (mode === 'select' && returnTo && returnParam) {
      // Convert SearchResult to BirdEyeSearchTokenResult format for consistency
      const tokenResult: BirdEyeSearchTokenResult = {
        name: token.name,
        symbol: token.symbol,
        address: token.address,
        network: 'solana' as const,
        decimals: 9, // Default decimals, will be updated by the receiving screen
        logo_uri: token.logoURI,
        verified: token.verified,
        fdv: 0,
        market_cap: token.marketCap,
        liquidity: 0,
        price: token.price,
        price_change_24h_percent: token.priceChange24h,
        sell_24h: 0,
        sell_24h_change_percent: 0,
        buy_24h: 0,
        buy_24h_change_percent: 0,
        unique_wallet_24h: 0,
        unique_wallet_24h_change_percent: 0,
        trade_24h: 0,
        trade_24h_change_percent: 0,
        volume_24h_change_percent: 0,
        volume_24h_usd: 0,
        last_trade_unix_time: 0,
        last_trade_human_time: '',
        supply: 0,
        updated_time: 0,
        rank: token.rank,
      }

      // Return to the calling screen with the selected token
      router.back()

      // Set the parameters after going back to preserve the existing state
      setTimeout(() => {
        router.setParams({ [returnParam]: JSON.stringify(tokenResult) })
      }, 100)
    }
  }

  const handleUrlDetected = (url: string) => {
    // Navigate to browser with the URL
    router.push({
      pathname: '/(screens)/browser' as any,
      params: { url, title: 'Browser' },
    })
  }

  return (
    <SafeAreaView className='flex-1 bg-primary-main' edges={['top']}>
      <View className='flex-1'>
        {/* Header */}
        <View className='flex-row items-center justify-between px-6 py-4'>
          <TouchableOpacity
            onPress={() => router.back()}
            className='w-10 h-10 rounded-full justify-center items-center'
          >
            <Ionicons name='chevron-back' size={20} color='white' />
          </TouchableOpacity>
          <Text className='text-white text-lg font-semibold'>{title}</Text>
          <View className='w-10' />
        </View>

        {/* Search Component */}
        <SearchTokens
          mode={mode as 'navigate' | 'select'}
          onTokenSelect={handleTokenSelect}
          onUrlDetected={handleUrlDetected}
          title={title}
        />
      </View>
    </SafeAreaView>
  )
}
