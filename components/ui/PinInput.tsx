import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Text, TextInput, View } from 'react-native'

interface PinInputProps {
  length?: number
  value: string
  onChange: (pin: string) => void
  error?: string
  showSuccess?: boolean
  autoFocus?: boolean
}

export default function PinInput({
  length = 4,
  value,
  onChange,
  error,
  showSuccess,
  autoFocus = true,
}: PinInputProps) {
  const inputRefs = useRef<TextInput[]>([])
  const shakeAnimation = useRef(new Animated.Value(0)).current
  const [isFocused, setIsFocused] = useState(false)

  // Trigger shake animation when there's an error
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [error])

  const handleChange = (text: string, index: number) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, '')

    if (digit.length === 0) {
      // Handle backspace
      const newValue = value.slice(0, index) + value.slice(index + 1)
      onChange(newValue)

      // Move to previous input
      if (index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
      return
    }

    if (digit.length === 1) {
      // Single digit input
      const newValue = value.slice(0, index) + digit + value.slice(index + 1)
      onChange(newValue)

      // Move to next input
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    } else if (digit.length > 1) {
      // Handle paste
      const pastedDigits = digit.slice(0, length)
      onChange(pastedDigits)

      // Focus last filled input or next empty one
      const nextIndex = Math.min(pastedDigits.length, length - 1)
      inputRefs.current[nextIndex]?.focus()
    }
  }

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    }
  }

  const getBoxStyle = (index: number) => {
    const hasValue = !!value[index]
    const isCurrentFocus = isFocused && index === value.length

    let backgroundColor = '#1A2741'
    let borderColor = '#2d2d35'

    if (error) {
      borderColor = '#ef4444'
      backgroundColor = '#7f1d1d'
    } else if (showSuccess && hasValue) {
      borderColor = '#00C2CB'
      backgroundColor = '#0B6979'
    } else if (isCurrentFocus) {
      borderColor = '#00C2CB'
    } else if (hasValue) {
      borderColor = '#00C2CB'
    }

    return {
      backgroundColor,
      borderColor,
    }
  }

  return (
    <View className='w-full items-center'>
      <Animated.View
        className='flex-row justify-center gap-3 mb-4'
        style={{ transform: [{ translateX: shakeAnimation }] }}
      >
        {Array.from({ length }).map((_, index) => {
          const boxStyle = getBoxStyle(index)
          const hasValue = !!value[index]

          return (
            <View
              key={index}
              className='w-14 h-16 rounded-xl border-2 items-center justify-center'
              style={{
                backgroundColor: boxStyle.backgroundColor,
                borderColor: boxStyle.borderColor,
              }}
            >
              {hasValue ? (
                <View className='w-3 h-3 bg-white rounded-full' />
              ) : (
                <View className='w-3 h-3 bg-gray-600 rounded-full opacity-30' />
              )}
              <TextInput
                ref={(ref) => {
                  if (ref) inputRefs.current[index] = ref
                }}
                className='absolute opacity-0 w-full h-full'
                value={value[index] || ''}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType='number-pad'
                maxLength={length}
                selectTextOnFocus
                autoFocus={autoFocus && index === 0}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                returnKeyType='done'
                secureTextEntry={false}
                autoComplete='off'
                autoCorrect={false}
              />
            </View>
          )
        })}
      </Animated.View>

      {error && (
        <View className='flex-row items-center gap-2'>
          <Ionicons name='alert-circle' size={16} color='#ef4444' />
          <Text className='text-red-400 text-sm'>{error}</Text>
        </View>
      )}

      {showSuccess && !error && value.length === length && (
        <View className='flex-row items-center gap-2'>
          <Ionicons name='checkmark-circle' size={16} color='#00C2CB' />
          <Text className='text-secondary text-sm'>PIN set successfully</Text>
        </View>
      )}
    </View>
  )
}
