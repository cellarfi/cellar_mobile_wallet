import React from 'react'
import { View } from 'react-native'

interface TokenCardSkeletonProps {
  count?: number
}

export function TokenCardSkeleton({ count = 3 }: TokenCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} className='bg-secondary-light rounded-2xl p-4 mb-3'>
          <View className='flex-row items-center justify-between'>
            <View className='flex-row items-center flex-1'>
              {/* Token logo skeleton */}
              <View className='w-12 h-12 bg-secondary-light/50 rounded-full mr-3 animate-pulse' />
              <View className='flex-1'>
                {/* Token symbol skeleton */}
                <View className='h-5 bg-secondary-light/50 rounded w-16 mb-2 animate-pulse' />
                {/* Token name skeleton */}
                <View className='h-4 bg-secondary-light/40 w-24 mb-1 animate-pulse' />
                {/* Balance skeleton */}
                <View className='h-3 bg-secondary-light/40 w-20 animate-pulse' />
              </View>
            </View>
            <View className='items-end'>
              {/* Value skeleton */}
              <View className='h-5 bg-secondary-light/50 rounded w-20 mb-2 animate-pulse' />
              {/* Change skeleton */}
              <View className='h-4 bg-secondary-light/40 w-16 mb-1 animate-pulse' />
              {/* Price skeleton */}
              <View className='h-3 bg-secondary-light/40 w-14 animate-pulse' />
            </View>
          </View>
        </View>
      ))}
    </>
  )
}
