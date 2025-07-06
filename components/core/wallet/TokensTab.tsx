import { TokenCard } from '@/components/TokenCard'
import { TokenCardSkeleton } from '@/components/TokenCardSkeleton'
import { usePortfolio } from '@/hooks/usePortfolio'
import { BirdEyeTokenItem } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import React, { forwardRef, useImperativeHandle } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

export interface TokensTabRef {
  refetch: () => void
}

export const TokensTab = forwardRef<TokensTabRef>((props, ref) => {
  const { portfolio, isLoading, error, refetch } = usePortfolio()

  useImperativeHandle(ref, () => ({
    refetch,
  }))

  return (
    <View>
      <View className='flex-row items-center justify-between mb-4'>
        <Text className='text-white text-lg font-semibold'>Your Tokens</Text>
        {/* <TouchableOpacity>
          <Text className='text-primary-400 font-medium'>Sort</Text>
        </TouchableOpacity> */}
      </View>

      {isLoading && !portfolio ? (
        <TokenCardSkeleton count={5} />
      ) : error ? (
        <View className='bg-dark-200 rounded-2xl p-6 items-center'>
          <Ionicons name='warning-outline' size={48} color='#ef4444' />
          <Text className='text-gray-400 text-center mt-4'>{error}</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className='mt-4 bg-primary-500 rounded-xl px-4 py-2'
          >
            <Text className='text-white font-medium'>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : portfolio?.items && portfolio.items.length > 0 ? (
        portfolio.items.map((token: BirdEyeTokenItem, index: number) => (
          <TokenCard key={`${token.address}-${index}`} token={token} />
        ))
      ) : (
        <View className='bg-dark-200 rounded-2xl p-6 items-center'>
          <Ionicons name='wallet-outline' size={48} color='#666672' />
          <Text className='text-gray-400 text-center mt-4'>
            No tokens found in your wallet
          </Text>
        </View>
      )}
    </View>
  )
})
