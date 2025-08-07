import { birdEyeRequests } from '@/libs/api_requests/birdeye.request'
import { formatValue } from '@/libs/string.helpers'
import { BirdEyeTokenOverviewResponse } from '@/types'
import { Post } from '@/types/posts.interface'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import TokenCallChart from './TokenCallChart'

interface TokenCallCardProps {
  token_meta: Post['token_meta']
}

const TokenCallCard = React.memo(({ token_meta }: TokenCallCardProps) => {
  const [currentPrice, setCurrentPrice] = useState(0)
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [tokenOverview, setTokenOverview] =
    useState<BirdEyeTokenOverviewResponse | null>(null)

  const initialPrice = token_meta?.price ? parseFloat(token_meta.price) : 0

  const priceChange =
    currentPrice && initialPrice
      ? ((currentPrice - initialPrice) / initialPrice) * 100
      : 0

  const fetchCurrentPrice = useCallback(async () => {
    if (!token_meta?.token_address) {
      console.log('No token address provided for price fetch')
      return
    }

    console.log('Fetching price for token:', token_meta.token_address)
    setIsLoadingPrice(true)
    setPriceError(null)

    try {
      const response = await birdEyeRequests.tokenOverview(
        token_meta.token_address,
        {
          includeLineChart: false,
          includeOHLCV: false,
        }
      )

      // console.log('Token overview response:', response)

      if (response.success && response.data?.tokenOverview) {
        const price = response.data.tokenOverview.price || 0
        // console.log('Setting current price to:', price)
        setCurrentPrice(price)
        setTokenOverview(response.data)
      } else {
        console.log('Failed to get token overview, using fallback')
        setPriceError('Failed to load price')
        // Fallback to target price if available
        if (token_meta.target_price) {
          setCurrentPrice(parseFloat(token_meta.target_price))
        }
      }
    } catch (err: any) {
      console.error('Erbg-secondary/5oken price:', err)
      setPriceError(err?.message || 'Error loading price')
      // Fallback to target price if available
      if (token_meta.target_price) {
        setCurrentPrice(parseFloat(token_meta.target_price))
      }
    } finally {
      setIsLoadingPrice(false)
    }
  }, [token_meta?.token_address, token_meta?.target_price])

  useEffect(() => {
    fetchCurrentPrice()
  }, [fetchCurrentPrice])

  const handleBuyPress = () => {
    if (token_meta?.token_address) {
      router.push({
        pathname: '/(modals)/swap',
        params: {
          outputToken: JSON.stringify({
            name:
              tokenOverview?.tokenOverview?.name ||
              token_meta.token_name ||
              'Token',
            symbol:
              tokenOverview?.tokenOverview?.symbol ||
              token_meta.token_symbol ||
              'TOKEN',
            address: token_meta.token_address,
            network: 'solana',
            decimals: tokenOverview?.tokenOverview?.decimals || 9,
            logo_uri:
              tokenOverview?.tokenOverview?.logoURI ||
              token_meta.logo_url ||
              '',
            verified: true,
            fdv: tokenOverview?.tokenOverview?.fdv || 0,
            market_cap:
              tokenOverview?.tokenOverview?.marketCap ||
              token_meta.market_cap ||
              '0',
            liquidity: tokenOverview?.tokenOverview?.liquidity || 0,
            price: currentPrice,
            price_change_24h_percent:
              tokenOverview?.tokenOverview?.priceChange24hPercent ||
              priceChange,
            sell_24h: tokenOverview?.tokenOverview?.sell24h || 0,
            sell_24h_change_percent:
              tokenOverview?.tokenOverview?.sell24hChangePercent || 0,
            buy_24h: tokenOverview?.tokenOverview?.buy24h || 0,
            buy_24h_change_percent:
              tokenOverview?.tokenOverview?.buy24hChangePercent || 0,
            unique_wallet_24h:
              tokenOverview?.tokenOverview?.uniqueWallet24h || 0,
            unique_wallet_24h_change_percent:
              tokenOverview?.tokenOverview?.uniqueWallet24hChangePercent || 0,
            trade_24h: tokenOverview?.tokenOverview?.trade24h || 0,
            trade_24h_change_percent:
              tokenOverview?.tokenOverview?.trade24hChangePercent || 0,
            volume_24h_change_percent: 0,
            volume_24h_usd: 0,
            last_trade_unix_time: 0,
            last_trade_human_time: '',
            supply: tokenOverview?.tokenOverview?.totalSupply || 0,
            updated_time: 0,
          }),
        },
      })
    }
  }

  return (
    <View className='bg-secondary/5 border border-zinc-800 rounded-2xl p-4'>
      {/* Token Header */}
      <View className='flex-row items-center mb-4'>
        <View className='w-12 h-12 bg-primary-500/20 rounded-full justify-center items-center mr-3 overflow-hidden'>
          {token_meta?.logo_url ? (
            <Image
              source={{ uri: token_meta.logo_url }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
              }}
              contentFit='cover'
            />
          ) : (
            <Text className='text-white text-xl font-bold'>
              {token_meta?.token_symbol?.charAt(0) || '?'}
            </Text>
          )}
        </View>
        <View className='flex-1'>
          <Text className='text-gray-100 font-bold text-lg'>
            {token_meta?.token_symbol}
          </Text>
          <Text className='text-gray-400 text-sm'>
            Called at ${formatValue(parseFloat(token_meta?.market_cap || '0'))}{' '}
            MC
          </Text>
        </View>
        <View className='items-end'>
          {isLoadingPrice ? (
            <View className='items-center'>
              <ActivityIndicator size='small' color='#6366f1' />
              <Text className='text-gray-400 text-xs mt-1'>Loading...</Text>
            </View>
          ) : (
            <>
              <Text className='text-gray-100 font-bold text-lg'>
                $
                {currentPrice > 0
                  ? currentPrice.toFixed(currentPrice >= 1 ? 2 : 6)
                  : '0.00'}
              </Text>
              {currentPrice > 0 && initialPrice > 0 && (
                <Text
                  className={`text-sm font-bold ${
                    priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {priceChange >= 0 ? '+' : ''}
                  {priceChange.toFixed(1)}%
                </Text>
              )}
              {priceError && (
                <Text className='text-red-400 text-xs'>Price unavailable</Text>
              )}
            </>
          )}
        </View>
      </View>

      {/* Chart */}
      {token_meta?.token_address && (
        <TokenCallChart tokenAddress={token_meta.token_address} />
      )}

      {/* Buy Button */}
      <TouchableOpacity
        className='bg-primary-500 rounded-xl py-3 px-6 items-center mt-4 flex-row justify-center'
        onPress={handleBuyPress}
      >
        <Ionicons name='trending-up' size={18} color='#ffffff' />
        <Text className='text-white font-bold text-base ml-2'>Buy</Text>
      </TouchableOpacity>
    </View>
  )
})

TokenCallCard.displayName = 'TokenCallCard'

export default TokenCallCard
