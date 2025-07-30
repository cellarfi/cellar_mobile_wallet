import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface HeaderProps {
  title: string
  onSearch: () => void
}

const Header: React.FC<HeaderProps> = ({ title, onSearch }) => (
  <View className='flex-row items-center justify-between px-6 py-4'>
    <Text className='text-white text-2xl font-bold'>{title}</Text>
    <View className='flex-row gap-3'>
      <TouchableOpacity
        className='w-10 h-10 bg-secondary-light rounded-full justify-center items-center'
        onPress={onSearch}
      >
        <Ionicons name='search' size={20} color={Colors.dark.text} />
      </TouchableOpacity>
    </View>
  </View>
)

export default Header
