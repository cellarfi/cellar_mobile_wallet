import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import {
  KeyboardTypeOptions,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'

interface CustomTextInputProps {
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder: string
  icon?: keyof typeof Ionicons.glyphMap
  keyboardType?: KeyboardTypeOptions
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  secureTextEntry?: boolean
  showPasswordToggle?: boolean
  containerStyle?: ViewStyle
  inputContainerStyle?: ViewStyle
  inputStyle?: TextStyle
  labelStyle?: TextStyle
  editable?: boolean
  multiline?: boolean
  numberOfLines?: number
  maxLength?: number
  autoFocus?: boolean
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send'
  onSubmitEditing?: () => void
  onFocus?: () => void
  onBlur?: () => void
}

export default function CustomTextInput({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  showPasswordToggle = false,
  containerStyle,
  inputContainerStyle,
  inputStyle,
  labelStyle,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  autoFocus = false,
  returnKeyType = 'done',
  onSubmitEditing,
  onFocus,
  onBlur,
}: CustomTextInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry)
  const [isFocused, setIsFocused] = useState(false)

  const handleFocus = () => {
    setIsFocused(true)
    onFocus?.()
  }

  const handleBlur = () => {
    setIsFocused(false)
    onBlur?.()
  }

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible)
  }

  const finalSecureTextEntry = secureTextEntry && !isPasswordVisible

  return (
    <View style={[containerStyle]}>
      {/* Label */}
      <Text className='text-white font-medium mb-2' style={labelStyle}>
        {label}
      </Text>

      {/* Input Container */}
      <View
        className={`bg-dark-200 border rounded-xl px-4 py-4 flex-row items-center ${
          isFocused ? 'border-primary-500' : 'border-dark-400'
        }`}
        style={inputContainerStyle}
      >
        {/* Leading Icon */}
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color='#666672'
            style={{ marginRight: 12, marginTop: 0 }}
          />
        )}

        {/* Text Input */}
        <TextInput
          className='flex-1 text-white text-lg'
          style={[
            inputStyle,
            {
              padding: 0,
              margin: 0,
              lineHeight: 20, // Match icon size
              height: 20, // Match icon size
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor='#666672'
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={finalSecureTextEntry}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          autoFocus={autoFocus}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

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
              color='#666672'
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
