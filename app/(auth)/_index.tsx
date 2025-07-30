import AppLogo from '@/components/ui/AppLogo'
import CustomButton from '@/components/ui/CustomButton'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useEffect, useRef } from 'react'
import { Animated, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const logoAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }, [])

  const logoScale = logoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  })

  const logoRotation = logoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <SafeAreaView className='flex-1 bg-dark-50'>
      <LinearGradient
        colors={['#0a0a0b', '#1a1a1f', '#0a0a0b']}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className='flex-1 px-6 py-12'>
          {/* Logo Section */}
          <Animated.View
            className='flex-1 justify-center items-center'
            style={{
              transform: [{ scale: logoScale }, { rotate: logoRotation }],
            }}
          >
            <View className='mb-8'>
              <AppLogo />
            </View>
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <Text className='text-4xl font-bold text-white text-center mb-4'>
                Cellar
              </Text>
              <Text className='text-lg text-gray-400 text-center mb-2'>
                Your Gateway to Solana DeFi
              </Text>
              <Text className='text-sm text-gray-500 text-center px-8'>
                Trade, socialize, and build wealth in the new financial frontier
              </Text>
            </Animated.View>
          </Animated.View>

          {/* Bottom Section */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
            className='gap-4'
          >
            {/* Login Button */}
            <CustomButton
              text='Get Started'
              onPress={() => router.push('/(auth)/onboarding')}
            />

            {/* Terms */}
            <Text className='text-xs text-gray-500 text-center px-4'>
              By continuing, you agree to our{' '}
              <Text className='text-primary-400'>Terms of Service</Text> and{' '}
              <Text className='text-primary-400'>Privacy Policy</Text>
            </Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  )
}
