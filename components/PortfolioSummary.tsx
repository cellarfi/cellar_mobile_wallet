import { usePortfolio } from '@/hooks/usePortfolio'
import { useAuthStore } from '@/store/authStore'
import { Ionicons } from '@expo/vector-icons'
import { formatWalletAddress } from '@privy-io/expo'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useRef, useState } from 'react'
import { Animated, Text, TouchableOpacity, View } from 'react-native'

interface PortfolioSummaryProps {}

export function PortfolioSummary({}: PortfolioSummaryProps) {
  const { portfolio, isLoading, isRefetching, error } = usePortfolio()
  const { activeWallet } = useAuthStore()
  const [copied, setCopied] = useState(false)
  const scaleAnim = useRef(new Animated.Value(1)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  const formatPortfolioValue = (value?: number) => {
    if (!value) return '0.00'
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const calculatePortfolioChange = () => {
    if (!portfolio?.items || portfolio.items.length === 0) {
      return { changeValue: 0, changePercent: 0 }
    }

    let totalChangeValue = 0
    let totalCurrentValue = 0

    portfolio.items.forEach((item) => {
      if (item.valueUsd && item.priceChange24h !== undefined) {
        const currentValue = item.valueUsd
        const previousValue = currentValue / (1 + item.priceChange24h / 100)
        const changeValue = currentValue - previousValue

        totalChangeValue += changeValue
        totalCurrentValue += currentValue
      }
    })

    const changePercent =
      totalCurrentValue > 0
        ? (totalChangeValue / (totalCurrentValue - totalChangeValue)) * 100
        : 0

    return { changeValue: totalChangeValue, changePercent }
  }

  const formatPortfolioChange = () => {
    const { changeValue, changePercent } = calculatePortfolioChange()

    if (changeValue === 0) return null

    const isPositive = changeValue >= 0
    const sign = isPositive ? '+' : ''
    const formattedValue = Math.abs(changeValue).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    const formattedPercent = Math.abs(changePercent).toFixed(2)

    return {
      text: `${sign}$${formattedValue} (${sign}${formattedPercent}%)`,
      isPositive,
    }
  }

  const copyToClipboard = async () => {
    if (!activeWallet?.address) return

    try {
      await Clipboard.setStringAsync(activeWallet.address)

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      // Start animations
      setCopied(true)

      // Scale animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start()

      // Opacity animation for copy feedback
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setCopied(false))
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  if (isLoading && !portfolio) {
    return (
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={{
          borderRadius: 24,
          padding: 24,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className='animate-pulse'>
          <Text className='text-white/80 text-sm mb-2'>
            Total Portfolio Value
          </Text>
          <View className='h-8 bg-white/20 rounded mb-4 w-48' />
          <View className='flex-row items-center'>
            <View className='h-4 bg-white/20 rounded w-24' />
            <View className='h-4 bg-white/20 rounded w-16 ml-2' />
          </View>
        </View>
      </LinearGradient>
    )
  }

  if (error) {
    return (
      <View className='bg-dark-200 rounded-2xl p-6 items-center'>
        <Ionicons name='warning-outline' size={48} color='#ef4444' />
        <Text className='text-gray-400 text-center mt-4'>
          Failed to load portfolio
        </Text>
        <Text className='text-gray-500 text-center text-sm mt-2'>{error}</Text>
      </View>
    )
  }

  return (
    <LinearGradient
      colors={['#6366f1', '#8b5cf6']}
      style={{
        borderRadius: 24,
        padding: 24,
      }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* {onWalletSwitch && (
        <View className='flex-row items-center justify-between mb-4'>
          <View>
            <Text className='text-white/80 text-sm'>Active Wallet</Text>
            <Text className='text-white text-lg font-semibold'>
              Main Wallet
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(modals)/wallet-switcher')}
            className='bg-white/20 rounded-full p-2'
          >
            <Ionicons name='swap-horizontal' size={20} color='white' />
          </TouchableOpacity>
        </View>
      )} */}

      <Text className='text-white/80 text-sm mb-2'>Total Portfolio Value</Text>
      <View className=' mb-3'>
        <Text className='text-white text-3xl font-bold'>
          ${formatPortfolioValue(portfolio?.totalUsd)}
        </Text>
        {(() => {
          const change = formatPortfolioChange()
          if (!change) return null

          return (
            <Text
              className={`text-xs font-semibold ${
                change.isPositive ? 'text-green-400' : 'text-red-300'
              }`}
            >
              {change.text}
            </Text>
          )
        })()}
      </View>
      {/* <View className='flex-row items-center'>
        <Text className='text-success-300 font-semibold mr-2'>{'+10.58'}</Text>
        <Text className='text-success-300 font-semibold'>({'+2.04%'})</Text>
        <Text className='text-white/80 ml-2'>today</Text>
      </View> */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={copyToClipboard}
          className='flex-row items-center gap-3 active:opacity-70'
          activeOpacity={0.7}
        >
          <Text className='text-white/60 text-sm font-mono'>
            {formatWalletAddress(activeWallet?.address)}{' '}
          </Text>

          <Ionicons
            name={copied ? 'checkmark-outline' : 'copy-outline'}
            size={15}
            color={copied ? '#10b981' : 'rgba(255,255,255,0.6)'}
          />
          {isRefetching && (
            <Text className='text-green-400 text-xs'>Updating...</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  )
}
