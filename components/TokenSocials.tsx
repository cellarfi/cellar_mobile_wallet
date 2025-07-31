import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Linking, TouchableOpacity, View } from 'react-native'

const getSocialType = (
  url: string
): 'twitter' | 'x' | 'telegram' | 'discord' | 'medium' | 'other' => {
  if (!url) return 'other'
  if (url.includes('twitter.com')) return 'twitter'
  if (url.includes('x.com')) return 'x'
  if (url.includes('t.me') || url.includes('telegram')) return 'telegram'
  if (url.includes('discord')) return 'discord'
  if (url.includes('medium.com')) return 'medium'
  return 'other'
}

const getIoniconName = (type: string) => {
  switch (type) {
    case 'twitter':
    case 'x':
      return 'logo-twitter'
    case 'telegram':
      return 'paper-plane-outline'
    case 'discord':
      return 'logo-discord'
    case 'medium':
      return 'logo-medium'
    default:
      return 'globe-outline'
  }
}

const TokenSocials: React.FC<{ link: string }> = ({ link }) => {
  if (!link) return null

  const type = getSocialType(link)
  const iconName = getIoniconName(type)

  return (
    <View className='flex-row items-center'>
      <TouchableOpacity
        onPress={() => Linking.openURL(link)}
        accessibilityLabel={type + ' link'}
        className='mr-2 px-2 py-2 bg-secondary-light rounded-5xl flex-row gap-2'
      >
        <Ionicons name={iconName as any} size={22} color='#fff' />
      </TouchableOpacity>
    </View>
  )
}

export default TokenSocials
