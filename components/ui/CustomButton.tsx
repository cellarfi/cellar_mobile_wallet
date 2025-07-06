import { cn } from '@/libs/utils'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import {
  ActivityIndicator,
  ColorValue,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'

interface CustomButtonProps {
  text: string
  onPress: () => void
  type?: 'primary' | 'secondary' | 'danger' | 'dark'
  icon?: keyof typeof Ionicons.glyphMap
  loading?: boolean
  disabled?: boolean
  className?: string
  iconPosition?: 'left' | 'right'
  iconSize?: number
  iconColor?: string
  style?: ViewStyle
  children?: React.ReactNode
  shallowGradient?: boolean
}

export default function CustomButton({
  text,
  onPress,
  type = 'primary',
  icon,
  loading = false,
  disabled = false,
  className = '',
  iconPosition = 'left',
  iconSize = 20,
  iconColor,
  style,
  children,
  shallowGradient = false,
}: CustomButtonProps) {
  const isDisabled = disabled || loading

  const getButtonColors = ():
    | readonly [ColorValue, ColorValue, ...ColorValue[]]
    | undefined => {
    switch (type) {
      case 'primary':
        return isDisabled
          ? ['#2d2d35', '#2d2d35']
          : shallowGradient
            ? ['#6366f1', '#8b5cf6']
            : ['#6366f1', '#8b5cf6', '#06b6d4']
      case 'secondary':
        return undefined // Uses border styling instead
      case 'dark':
        return undefined // Uses border styling instead
      case 'danger':
        return isDisabled ? ['#2d2d35', '#2d2d35'] : ['#ef4444', '#dc2626']
    }
  }

  const getIconColor = () => {
    if (iconColor) return iconColor
    switch (type) {
      case 'primary':
        return '#ffffff'
      case 'secondary':
        return '#ffffff'
      case 'dark':
        return '#ffffff'
      case 'danger':
        return '#ffffff'
    }
  }

  const renderContent = () => {
    const content = (
      <>
        {icon && iconPosition === 'left' && (
          <Ionicons
            name={icon}
            size={iconSize}
            color={getIconColor()}
            style={{ marginRight: 8 }}
          />
        )}
        <Text
          className={cn(
            `text-center`,
            type === 'secondary' || type === 'dark'
              ? 'text-white'
              : isDisabled
                ? 'text-gray-500'
                : 'text-white',
            type === 'dark' ? 'font-medium' : 'text-lg font-semibold'
          )}
        >
          {loading ? 'Loading...' : text}
        </Text>
        {icon && iconPosition === 'right' && (
          <Ionicons
            name={icon}
            size={iconSize}
            color={getIconColor()}
            style={{ marginLeft: 8 }}
          />
        )}
        {loading && (
          <ActivityIndicator
            color='#fff'
            style={{ marginLeft: 8 }}
            size='small'
          />
        )}
      </>
    )

    if (type === 'secondary' || type === 'dark') {
      return (
        <View
          className={cn(
            'py-4 border rounded-2xl flex-row justify-center items-center',
            type === 'dark' ? 'bg-dark-200 border-dark-400' : 'border-gray-700',
            className
          )}
          style={style}
        >
          {content}
        </View>
      )
    }

    const colors = getButtonColors()
    if (!colors) return null

    return (
      <LinearGradient
        colors={colors}
        className={`py-4 rounded-2xl flex-row justify-center items-center ${className}`}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 16,
          paddingVertical: 16,
          paddingHorizontal: 16,
          ...style,
        }}
      >
        {content}
      </LinearGradient>
    )
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`active:scale-95 shadow-glow ${className}`}
      style={style}
    >
      {renderContent()}
      {children}
    </TouchableOpacity>
  )
}
