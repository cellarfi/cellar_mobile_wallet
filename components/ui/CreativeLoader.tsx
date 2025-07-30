import AppLogo from '@/components/ui/AppLogo'
import React, { useEffect, useRef } from 'react'
import { Animated, Text, View } from 'react-native'

interface CreativeLoaderProps {
  label?: string
  logoSize?: number
}

export default function CreativeLoader({
  label,
  logoSize = 300,
}: CreativeLoaderProps) {
  // Animation values
  const logoScale = useRef(new Animated.Value(1)).current
  const dot1Opacity = useRef(new Animated.Value(0.3)).current
  const dot2Opacity = useRef(new Animated.Value(0.3)).current
  const dot3Opacity = useRef(new Animated.Value(0.3)).current

  // Logo breathing animation
  useEffect(() => {
    const breathingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    )
    breathingAnimation.start()

    return () => breathingAnimation.stop()
  }, [logoScale])

  // Dots animation
  useEffect(() => {
    const createDotAnimation = (opacity: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      )
    }

    // Start each dot animation with different delays
    const dot1Animation = createDotAnimation(dot1Opacity, 0)
    const dot2Animation = createDotAnimation(dot2Opacity, 200)
    const dot3Animation = createDotAnimation(dot3Opacity, 400)

    dot1Animation.start()
    dot2Animation.start()
    dot3Animation.start()

    return () => {
      dot1Animation.stop()
      dot2Animation.stop()
      dot3Animation.stop()
    }
  }, [dot1Opacity, dot2Opacity, dot3Opacity])

  return (
    <View className='items-center gap-8'>
      <Animated.View style={{ transform: [{ scale: logoScale }] }}>
        <AppLogo size={logoSize} />
      </Animated.View>

      {/* Label text */}
      {label && (
        <Text className='text-white text-lg font-medium text-center px-6'>
          {label}
        </Text>
      )}

      {/* Animated dots */}
      <View className='flex-row gap-3'>
        <Animated.View
          style={{
            opacity: dot1Opacity,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: '#6366f1',
          }}
        />
        <Animated.View
          style={{
            opacity: dot2Opacity,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: '#8b5cf6',
          }}
        />
        <Animated.View
          style={{
            opacity: dot3Opacity,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: '#06b6d4',
          }}
        />
      </View>
    </View>
  )
}
