import { TokenChart } from '@/components/TokenChart'
import TokenSocials from '@/components/TokenSocials'
import { blurHashPlaceholder } from '@/constants/App'
import { usePortfolio } from '@/hooks/usePortfolio'
import { useTokenChart } from '@/hooks/useTokenChart'
import { useTokenOverview } from '@/hooks/useTokenOverview'
import { formatPercentage, formatValue } from '@/libs/string.helpers'
import { BirdEyeTokenItem } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

export default function TokenDetailScreen() {
  const [imageError, setImageError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [addressCopied, setAddressCopied] = useState(false)
  const copyScaleAnim = useRef(new Animated.Value(1)).current
  const { tokenAddress } = useLocalSearchParams<{ tokenAddress: string }>()

  const {
    token,
    userHolding,
    isLoading,
    isRefetching,
    error,
    refetch,
    showOfflineError,
    isOnline,
  } = useTokenOverview(tokenAddress || '')

  // Get portfolio to check if token is owned
  const { portfolio } = usePortfolio()

  // Get chart functionality for manual refresh
  const { chartType, activeTimeFrame, fetchChartData } = useTokenChart(
    tokenAddress || ''
  )

  // Check if token is in user's portfolio
  const isTokenInPortfolio = useMemo(() => {
    if (!portfolio?.items || !tokenAddress) return false

    return portfolio.items.some(
      (item: BirdEyeTokenItem) => item.address === tokenAddress
    )
  }, [portfolio?.items, tokenAddress])

  // Get the token from portfolio for navigation
  const portfolioToken = useMemo(() => {
    if (!portfolio?.items || !tokenAddress) return null

    return portfolio.items.find(
      (item: BirdEyeTokenItem) => item.address === tokenAddress
    )
  }, [portfolio?.items, tokenAddress])

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      // Refresh both token overview and chart data
      await Promise.all([refetch(), fetchChartData(chartType, activeTimeFrame)])
    } finally {
      setRefreshing(false)
    }
  }

  // If loading and no token data, show loading screen (initial load only)
  if (isLoading && !token) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView className='flex-1 bg-primary-main'>
          <View className='flex-1 justify-center items-center'>
            <ActivityIndicator size='large' color='#6366f1' />
            <Text className='text-white mt-4 text-lg'>
              Loading token data...
            </Text>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    )
  }

  // If error and no token data, show error screen
  if (error && !token) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView className='flex-1 bg-primary-main'>
          <View className='flex-1'>
            {/* Header */}
            <View className='flex-row items-center justify-between px-6 py-4'>
              <TouchableOpacity
                onPress={() => router.back()}
                className='w-10 h-10 bg-dark-200 rounded-full justify-center items-center'
              >
                <Ionicons name='arrow-back' size={20} color='white' />
              </TouchableOpacity>
              <Text className='text-white text-lg font-semibold'>Token</Text>
              <View className='w-10' />
            </View>

            <View className='flex-1 justify-center items-center px-6'>
              <Ionicons name='cloud-offline' size={64} color='#6b7280' />
              <Text className='text-white text-xl font-semibold mt-4 text-center'>
                {showOfflineError
                  ? 'No Internet Connection'
                  : 'Error Loading Token'}
              </Text>
              <Text className='text-gray-400 text-center mt-2 mb-6'>
                {error}
              </Text>
              <TouchableOpacity
                onPress={() => refetch()}
                className='bg-primary-500 px-6 py-3 rounded-2xl'
              >
                <Text className='text-white font-semibold'>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    )
  }

  if (!token) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView className='flex-1 bg-dark-50'>
          <View className='flex-1 justify-center items-center'>
            <Text className='text-white text-lg'>Token not found</Text>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    )
  }

  const tokenOverview = token.tokenOverview
  const imageUri = tokenOverview.logoURI
  const showImage = imageUri && !imageError

  // Calculate price change values
  const priceChange24h = tokenOverview.priceChange24hPercent || 0
  const priceChange24hValue = tokenOverview.price * (priceChange24h / 100)

  // Determine risk level based on liquidity and market cap
  const getRiskLevel = () => {
    if (
      tokenOverview.liquidity > 1000000 &&
      tokenOverview.marketCap > 100000000
    ) {
      return 'Low'
    } else if (
      tokenOverview.liquidity > 100000 &&
      tokenOverview.marketCap > 10000000
    ) {
      return 'Medium'
    }
    return 'High'
  }

  const riskLevel = getRiskLevel()

  // Format address for display (first 4 + last 4 characters)
  const formatMintAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  const copyMintAddress = async () => {
    if (!tokenAddress) return

    try {
      await Clipboard.setStringAsync(tokenAddress)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      setAddressCopied(true)

      // Scale animation
      Animated.sequence([
        Animated.timing(copyScaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(copyScaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start()

      // Reset copied state after 2 seconds
      setTimeout(() => setAddressCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy mint address:', error)
    }
  }

  const shareToken = async () => {
    if (!token?.tokenOverview) return

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      const tokenOverview = token.tokenOverview
      const priceChange24h = tokenOverview.priceChange24hPercent || 0
      const priceChangeText =
        priceChange24h >= 0
          ? `+${priceChange24h.toFixed(2)}%`
          : `${priceChange24h.toFixed(2)}%`

      const shareMessage = `🪙 ${tokenOverview.name} (${tokenOverview.symbol})

💰 Price: $${tokenOverview.price.toFixed(tokenOverview.price >= 1 ? 2 : 6)}
📈 24h Change: ${priceChangeText}
📊 Market Cap: $${formatValue(tokenOverview.marketCap)}
💧 Liquidity: $${formatValue(tokenOverview.liquidity)}
⚠️ Risk Level: ${riskLevel}

📍 Contract: ${tokenAddress}

🔗 View on Cellar: https://cellar.so/token/${tokenAddress}

Powered by Cellar Wallet`

      const result = await Share.share({
        message: shareMessage,
        title: `${tokenOverview.name} (${tokenOverview.symbol}) Token Details`,
        url: `https://cellar.so/token/${tokenAddress}`,
      })

      if (result.action === Share.sharedAction) {
        console.log('Token shared successfully')
      }
    } catch (error) {
      console.error('Error sharing token:', error)
    }
  }

  // Navigation handlers for action buttons
  const handleSendPress = () => {
    if (portfolioToken) {
      router.push({
        pathname: '/(modals)/send' as any,
        params: {
          selectedToken: JSON.stringify(portfolioToken),
        },
      })
    }
  }

  const handleSellPress = () => {
    if (portfolioToken) {
      router.push({
        pathname: '/(modals)/swap' as any,
        params: {
          inputToken: JSON.stringify(portfolioToken),
        },
      })
    }
  }

  const handleBuyPress = () => {
    if (tokenOverview) {
      // Create a search token result format for the swap output
      const searchTokenResult = {
        name: tokenOverview.name,
        symbol: tokenOverview.symbol,
        address: tokenOverview.address,
        network: 'solana' as const,
        decimals: tokenOverview.decimals,
        logo_uri: tokenOverview.logoURI,
        verified: true,
        fdv: tokenOverview.fdv,
        market_cap: tokenOverview.marketCap,
        liquidity: tokenOverview.liquidity,
        price: tokenOverview.price,
        price_change_24h_percent: tokenOverview.priceChange24hPercent || 0,
        sell_24h: 0,
        sell_24h_change_percent: 0,
        buy_24h: 0,
        buy_24h_change_percent: 0,
        unique_wallet_24h: 0,
        unique_wallet_24h_change_percent: 0,
        trade_24h: 0,
        trade_24h_change_percent: 0,
        volume_24h_change_percent: 0,
        volume_24h_usd: tokenOverview.v24hUSD,
        last_trade_unix_time: 0,
        last_trade_human_time: '',
        supply: 0,
        updated_time: 0,
      }

      router.push({
        pathname: '/(modals)/swap' as any,
        params: {
          outputToken: JSON.stringify(searchTokenResult),
        },
      })
    }
  }

  const handleSwapPress = () => {
    if (portfolioToken) {
      router.push({
        pathname: '/(modals)/swap' as any,
        params: {
          inputToken: JSON.stringify(portfolioToken),
        },
      })
    } else {
      // If not in portfolio, open swap for buying
      handleBuyPress()
    }
  }

  const ActionButton = ({ icon, title, onPress, color = '#6366f1' }: any) => (
    <TouchableOpacity
      onPress={onPress}
      className='flex-1 bg-secondary-light rounded-2xl p-4 items-center mx-1'
    >
      <Ionicons name={icon} size={24} color={color} />
      <Text className='text-white font-medium text-sm mt-2'>{title}</Text>
    </TouchableOpacity>
  )

  const MetricCard = ({ label, value, trend }: any) => (
    <View className='bg-secondary-light rounded-xl p-4 flex-1 mx-1'>
      <Text className='text-gray-400 text-sm mb-1'>{label}</Text>
      <Text className='text-white font-semibold text-lg'>{value}</Text>
      {trend && (
        <Text
          className={`text-sm ${
            trend.includes('+') ? 'text-success-400' : 'text-danger-400'
          }`}
        >
          {trend}
        </Text>
      )}
    </View>
  )

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className='flex-1 bg-primary-main'>
        <View className='flex-1'>
          {/* Header */}
          <View className='flex-row items-center justify-between px-6 py-4'>
            <TouchableOpacity
              onPress={() => router.back()}
              className='w-10 h-10  rounded-full justify-center items-center'
            >
              <Ionicons name='chevron-back' size={20} color='white' />
            </TouchableOpacity>
            {/* <Text className='text-white text-lg font-semibold'>
              {tokenOverview.symbol}
            </Text> */}
            <View className='flex-row gap-3'>
              {isRefetching && (
                <View className='w-10 h-10 justify-center items-center'>
                  <ActivityIndicator size={16} color='#6366f1' />
                </View>
              )}
              <TouchableOpacity className='w-10 h-10 rounded-full justify-center items-center'>
                <Ionicons name='star-outline' size={20} color='white' />
              </TouchableOpacity>
              <TouchableOpacity
                className='w-10 h-10 rounded-full justify-center items-center'
                onPress={shareToken}
              >
                <Ionicons name='share-outline' size={20} color='white' />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            className='flex-1'
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor='#6366f1'
              />
            }
          >
            {/* Token Info */}
            <View className='px-6 mb-6'>
              <View className='flex-row items-center mb-4'>
                <View className='w-16 h-16 bg-primary-500/20 rounded-full justify-center items-center mr-4 overflow-hidden'>
                  {showImage ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={{ width: 64, height: 64, borderRadius: 32 }}
                      onError={() => setImageError(true)}
                      placeholder={{ blurhash: blurHashPlaceholder }}
                    />
                  ) : (
                    <Text className='text-2xl font-bold text-primary-400'>
                      {tokenOverview.symbol?.charAt(0) || '?'}
                    </Text>
                  )}
                </View>
                <View className='flex-1'>
                  <Text className='text-white text-2xl font-bold'>
                    {tokenOverview.name}
                  </Text>
                  <Text className='text-gray-400 text-lg'>
                    {tokenOverview.symbol}
                  </Text>
                </View>
                <View
                  className={`px-3 py-1 rounded-xl ${
                    riskLevel === 'Low'
                      ? 'bg-success-500/20'
                      : riskLevel === 'Medium'
                        ? 'bg-warning-500/20'
                        : 'bg-danger-500/20'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      riskLevel === 'Low'
                        ? 'text-success-400'
                        : riskLevel === 'Medium'
                          ? 'text-warning-400'
                          : 'text-danger-400'
                    }`}
                  >
                    {riskLevel} Risk
                  </Text>
                </View>
              </View>

              {/* Price */}
              <View className='mb-4'>
                <Text className='text-white text-4xl font-bold'>
                  $
                  {tokenOverview.price.toFixed(
                    tokenOverview.price >= 1 ? 2 : 6
                  )}
                </Text>
                <View className='flex-row items-center justify-between'>
                  <View className='flex-row items-center'>
                    <Text
                      className={`text-lg font-semibold mr-2 ${
                        priceChange24h >= 0
                          ? 'text-success-400'
                          : 'text-danger-400'
                      }`}
                    >
                      {formatPercentage(priceChange24h)}
                    </Text>
                    <Text
                      className={`text-lg ${
                        priceChange24hValue >= 0
                          ? 'text-success-400'
                          : 'text-danger-400'
                      }`}
                    >
                      (${priceChange24hValue >= 0 ? '+' : ''}
                      {Math.abs(priceChange24hValue).toFixed(
                        tokenOverview.price >= 1 ? 2 : 6
                      )}
                      )
                    </Text>
                  </View>

                  {/* Mint Address Copy Button */}
                  <Animated.View
                    style={{ transform: [{ scale: copyScaleAnim }] }}
                  >
                    <TouchableOpacity
                      onPress={copyMintAddress}
                      className='flex-row items-center bg-secondary-light/80 rounded-xl px-3 py-2 active:opacity-70'
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name='cube-outline'
                        size={14}
                        color='rgba(255,255,255,0.7)'
                      />
                      <Text className='text-white/70 text-xs font-mono ml-2 mr-2'>
                        {formatMintAddress(tokenAddress || '')}
                      </Text>
                      <Ionicons
                        name={
                          addressCopied ? 'checkmark-outline' : 'copy-outline'
                        }
                        size={14}
                        color={
                          addressCopied ? '#10b981' : 'rgba(255,255,255,0.7)'
                        }
                      />
                    </TouchableOpacity>
                  </Animated.View>
                </View>

                {/* Copy Success Feedback */}
                {/* {addressCopied && (
                  <View className='mt-2 flex-row items-center justify-end'>
                    <Ionicons
                      name='checkmark-circle'
                      size={16}
                      color='#10b981'
                    />
                    <Text className='text-green-400 text-sm ml-1'>
                      Mint address copied!
                    </Text>
                  </View>
                )} */}
              </View>
            </View>

            {/* Your Holdings */}
            {userHolding && (
              <View className='px-6 mb-6'>
                <LinearGradient
                  colors={['#122C41', '#122C41']}
                  style={{
                    borderRadius: 24,
                    padding: 24,
                  }}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text className='text-white/80 text-sm mb-2'>
                    Your Holdings
                  </Text>
                  <Text className='text-white text-2xl font-bold mb-1'>
                    ${formatValue(userHolding.valueUsd)}
                  </Text>
                  <Text className='text-white/80 text-lg'>
                    {/* <Text className='text-white/80 text-lg mb-4'> */}
                    {formatValue(userHolding.uiAmount)} {userHolding.symbol}
                  </Text>
                  <View className='flex-row justify-between hidden'>
                    <View>
                      <Text className='text-white/60 text-sm'>
                        Current Price
                      </Text>
                      <Text className='text-white font-semibold'>
                        $
                        {tokenOverview.price.toFixed(
                          tokenOverview.price >= 1 ? 2 : 6
                        )}
                      </Text>
                    </View>
                    {userHolding.priceChange24h !== undefined && (
                      <View className='items-end'>
                        <Text className='text-white/60 text-sm'>
                          24h Change
                        </Text>
                        <Text
                          className={`font-semibold ${
                            userHolding.priceChange24h >= 0
                              ? 'text-success-300'
                              : 'text-danger-300'
                          }`}
                        >
                          {formatPercentage(userHolding.priceChange24h)}
                        </Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* Chart */}
            <TokenChart tokenAddress={tokenAddress || ''} />

            {/* Actions */}
            <View className='px-6 mb-6'>
              <Text className='text-white text-lg font-semibold mb-4'>
                Actions
              </Text>
              <View className='flex-row'>
                {/* Only show sell and send buttons if token is in portfolio */}
                {isTokenInPortfolio && (
                  <ActionButton
                    icon='arrow-up'
                    title='Sell'
                    color='#ef4444'
                    onPress={handleSellPress}
                  />
                )}
                {/* Buy button always visible */}
                <ActionButton
                  icon='arrow-down'
                  title='Buy'
                  color='#10b981'
                  onPress={handleBuyPress}
                />
                {/* Swap button always visible */}
                {/* <ActionButton
                  icon='swap-horizontal'
                  title='Swap'
                  onPress={handleSwapPress}
                /> */}

                {/* Send button */}
                {isTokenInPortfolio && (
                  <ActionButton
                    icon='paper-plane'
                    title='Send'
                    onPress={handleSendPress}
                  />
                )}
              </View>
            </View>

            {/* Market Stats */}
            <View className='px-6 mb-6'>
              <Text className='text-white text-lg font-semibold mb-4'>
                Market Stats
              </Text>
              <View className='gap-3'>
                <View className='flex-row'>
                  <MetricCard
                    label='Market Cap'
                    value={'$' + formatValue(tokenOverview.marketCap)}
                  />
                  <MetricCard
                    label='24h Volume'
                    value={'$' + formatValue(tokenOverview.v24hUSD)}
                  />
                </View>
                <View className='flex-row'>
                  <MetricCard
                    label='Circulating Supply'
                    value={formatValue(tokenOverview.circulatingSupply)}
                  />
                  <MetricCard
                    label='Total Supply'
                    value={formatValue(tokenOverview.totalSupply)}
                  />
                </View>
                <View className='flex-row'>
                  <MetricCard
                    label='FDV'
                    value={'$' + formatValue(tokenOverview.fdv)}
                  />
                  <MetricCard
                    label='Liquidity'
                    value={'$' + formatValue(tokenOverview.liquidity)}
                  />
                </View>
                <View className='flex-row'>
                  <MetricCard
                    label='Holders'
                    value={formatValue(tokenOverview.holder)}
                  />
                  <MetricCard
                    label='24h Trades'
                    value={'$' + formatValue(tokenOverview.trade24h)}
                  />
                </View>
              </View>
            </View>

            {/* About */}
            <View className='px-6 mb-8'>
              <Text className='text-white text-lg font-semibold mb-4'>
                About {tokenOverview.name}
              </Text>
              <View className='bg-secondary-light rounded-2xl p-4'>
                <Text className='text-gray-300 leading-6'>
                  {tokenOverview.extensions?.description ||
                    `${tokenOverview.name} (${tokenOverview.symbol}) is a cryptocurrency token. Market cap: ${formatValue(tokenOverview.marketCap) + tokenOverview.symbol}, Liquidity: ${formatValue(tokenOverview.liquidity) + tokenOverview.symbol}.`}
                </Text>
              </View>
            </View>

            {/* Socials */}
            <View className='px-6 mb-8'>
              <Text className='text-white text-lg font-semibold mb-4'>
                Socials
              </Text>
              <View className='items-center flex-row mb-8'>
                {['website', 'twitter', 'telegram', 'discord', 'medium'].map(
                  (key) => {
                    const link =
                      tokenOverview.extensions?.[
                        key as keyof typeof tokenOverview.extensions
                      ]
                    return link ? <TokenSocials key={key} link={link} /> : null
                  }
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}
