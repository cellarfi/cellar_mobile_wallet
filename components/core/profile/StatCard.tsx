import React from 'react'
import { Text, View } from 'react-native'

interface StatCardProps {
  label: string
  value: string | number
  extra?: string
}

export default function StatCard({ label, value, extra }: StatCardProps) {
  return (
    <View className='items-center'>
      <Text className='text-white text-xl font-bold'>{value}</Text>
      <Text className='text-gray-400 text-sm'>{label}</Text>
      {extra && (
        <View className='bg-primary-500/30 rounded-full px-2 py-0.5 mt-1'>
          <Text className='text-primary-300 text-xs font-medium'>{extra}</Text>
        </View>
      )}
    </View>
  )
}
