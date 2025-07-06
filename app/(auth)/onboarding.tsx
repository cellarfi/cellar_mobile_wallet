import CustomButton from '@/components/ui/CustomButton'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useRef, useState } from 'react'
import {
  Animated,
  ColorValue,
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

const onboardingData = [
  {
    id: 1,
    title: 'Trade with Confidence',
    description:
      'Access real-time market data, trending tokens, and professional trading tools built for the Solana ecosystem.',
    icon: 'trending-up',
    color: ['#6366f1', '#8b5cf6'] as readonly [ColorValue, ColorValue],
  },
  {
    id: 2,
    title: 'Social DeFi Experience',
    description:
      'Connect with fellow traders, share insights, and tip your favorite content creators with USDC.',
    icon: 'people',
    color: ['#10b981', '#34d399'] as readonly [ColorValue, ColorValue],
  },
  {
    id: 3,
    title: 'Secure Wallet Management',
    description:
      'Manage multiple wallets, track your portfolio, and explore NFTs with bank-grade security.',
    icon: 'shield-checkmark',
    color: ['#f59e0b', '#fbbf24'] as readonly [ColorValue, ColorValue],
  },
]

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)
  const scrollX = useRef(new Animated.Value(0)).current

  const handleNext = async () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1
      flatListRef.current?.scrollToIndex({ index: nextIndex })
      setCurrentIndex(nextIndex)
    } else {
      router.push('/(auth)/login')
    }
  }

  const handleSkip = async () => {
    router.push('/(auth)/login')
  }

  const renderItem = ({
    item,
    index,
  }: {
    item: (typeof onboardingData)[0]
    index: number
  }) => (
    <View style={{ width }} className='flex-1 px-6 py-12'>
      <View className='flex-1 justify-center items-center shadow-glow'>
        <LinearGradient
          colors={item.color}
          style={{
            width: 128,
            height: 128,
            borderRadius: 64,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 48,
          }}
        >
          <Ionicons name={item.icon as any} size={64} color='white' />
        </LinearGradient>

        <Text className='text-3xl font-bold text-white text-center mb-6'>
          {item.title}
        </Text>
        <Text className='text-lg text-gray-400 text-center leading-7 px-4'>
          {item.description}
        </Text>
      </View>
    </View>
  )

  const renderDots = () => (
    <View className='flex-row justify-center items-center mb-8'>
      {onboardingData.map((_, index) => {
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width,
        ]

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        })

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        })

        return (
          <Animated.View
            key={index}
            className='h-2 bg-primary-500 rounded-full mx-1'
            style={{ width: dotWidth, opacity }}
          />
        )
      })}
    </View>
  )

  return (
    <SafeAreaView className='flex-1 bg-dark-50'>
      <LinearGradient
        colors={['#0a0a0b', '#1a1a1f', '#0a0a0b']}
        style={{ flex: 1 }}
      >
        {/* Skip Button */}
        <View className='flex-row justify-end px-6 pt-4'>
          <TouchableOpacity onPress={handleSkip}>
            <Text className='text-gray-400 text-lg'>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Animated.FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(
              event.nativeEvent.contentOffset.x / width
            )
            setCurrentIndex(newIndex)
          }}
        />

        {/* Bottom Section */}
        <View className='px-6 pb-8'>
          {renderDots()}

          <CustomButton
            text={
              currentIndex === onboardingData.length - 1
                ? 'Get Started'
                : 'Next'
            }
            onPress={handleNext}
            type='primary'
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  )
}
