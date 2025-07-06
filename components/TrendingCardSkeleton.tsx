import React from 'react'
import { View } from 'react-native'

interface TrendingCardSkeletonProps {
  count?: number
}

export function TrendingCardSkeleton({ count = 3 }: TrendingCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} className='bg-dark-200 rounded-2xl p-4 mr-3 w-48'>
          {/* Header with logo and symbol */}
          <View className='flex-row items-center mb-3'>
            <View className='w-10 h-10 bg-dark-300 rounded-full mr-3' />
            <View className='flex-1'>
              <View className='w-16 h-4 bg-dark-300 rounded mb-1' />
              <View className='w-24 h-3 bg-dark-300 rounded' />
            </View>
          </View>

          {/* Price */}
          <View className='w-20 h-5 bg-dark-300 rounded mb-1' />

          {/* Change and Volume */}
          <View className='flex-row justify-between'>
            <View className='w-12 h-4 bg-dark-300 rounded' />
            <View className='w-16 h-3 bg-dark-300 rounded' />
          </View>
        </View>
      ))}
    </>
  )
}
