import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import {
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'

interface CustomTextInputProps extends Omit<TextInputProps, 'style'> {
  label?: string
  icon?: keyof typeof Ionicons.glyphMap
  showPasswordToggle?: boolean
  containerStyle?: ViewStyle
  inputContainerStyle?: ViewStyle
  inputStyle?: TextStyle
  labelStyle?: TextStyle
  isSearch?: boolean
}

export default function CustomTextInput({
  label,
  icon,
  showPasswordToggle = false,
  containerStyle,
  inputContainerStyle,
  inputStyle,
  labelStyle,
  isSearch = false,
  onFocus,
  onBlur,
  secureTextEntry = false,
  ...props
}: CustomTextInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry)
  const [isFocused, setIsFocused] = useState(false)

  const handleFocus = (e: any) => {
    setIsFocused(true)
    onFocus && onFocus(e)
  }

  const handleBlur = (e: any) => {
    setIsFocused(false)
    onBlur && onBlur(e)
  }

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible)
  }

  const finalSecureTextEntry = secureTextEntry && !isPasswordVisible

  return (
    <View style={[containerStyle]}>
      {/* Label */}
      {label && (
        <Text
          className='text-text-secondary font-medium mb-2'
          style={labelStyle}
        >
          {label}
        </Text>
      )}

      {/* Input Container */}
      <View
        className={`bg-secondary-light rounded-[8px] px-4 py-4 flex-row items-center ${
          isFocused ? 'border-primary-500' : 'border-dark-400'
        }`}
        style={inputContainerStyle}
      >
        {/* Leading Icon */}
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={Colors.dark.text}
            style={{ marginRight: 12, marginTop: 0 }}
          />
        )}

        {/* Text Input */}
        <TextInput
          className='flex-1 text-text-light text-[16px] font-medium'
          style={[
            {
              padding: 0,
              paddingVertical: 0,
              margin: 0,
              lineHeight: 20,
              includeFontPadding: false,
            },
            inputStyle,
          ]}
          placeholderTextColor={Colors.dark.text}
          secureTextEntry={finalSecureTextEntry}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {isSearch && props.value && props.value.length > 0 && (
          <View className='flex-row items-center'>
            {/* {isValidUrl(props.value.trim()) && (
              <TouchableOpacity
                onPress={handleUrlSubmit}
                className='bg-primary-500 rounded-xl px-3 py-1 mr-2'
              >
                <Text className='text-white text-xs font-medium'>Open</Text>
              </TouchableOpacity>
            )} */}
            <TouchableOpacity
              onPress={() => {
                props.onChangeText?.('')
              }}
              className='ml-2'
            >
              <Ionicons name='close-circle' size={20} color='#666672' />
            </TouchableOpacity>
          </View>
        )}

        {/* Password Toggle */}
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            className='p-2'
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={Colors.dark.text}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
