import { NFTCard } from '@/components/NFTCard'
import { useAssets } from '@/hooks/useAssets'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { forwardRef, useImperativeHandle } from 'react'
import {
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export interface NFTsTabRef {
  refetch: () => void
}

export const NFTsTab = forwardRef<NFTsTabRef>((props, ref) => {
  const {
    assets,
    loading: assetsLoading,
    error: assetsError,
    refetch: refetchAssets,
  } = useAssets()

  useImperativeHandle(ref, () => ({
    refetch: refetchAssets,
  }))

  return (
    <View>
      <View className='flex-row items-center justify-between mb-4'>
        <Text className='text-white text-lg font-semibold'>Your NFTs</Text>
        <TouchableOpacity
          onPress={() => router.push('/nft-gallery')}
          className='flex-row items-center gap-1'
        >
          <Text className='text-primary-400 font-medium'>View Gallery</Text>
          <Ionicons name='arrow-forward' size={14} color='#6366f1' />
        </TouchableOpacity>
      </View>

      {assetsLoading ? (
        <View className='h-48'>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[...Array(3)].map((_, index) => (
              <View
                key={index}
                className='w-40 h-40 bg-dark-300 rounded-2xl mr-4 animate-pulse'
              />
            ))}
          </ScrollView>
        </View>
      ) : assetsError ? (
        <View className='bg-dark-200 rounded-2xl p-6 items-center'>
          <Ionicons name='warning-outline' size={48} color='#ef4444' />
          <Text className='text-gray-400 text-center mt-4'>
            {assetsError.toString()}
          </Text>
          <TouchableOpacity
            onPress={() => refetchAssets()}
            className='mt-4 bg-primary-500 rounded-xl px-4 py-2'
          >
            <Text className='text-white font-medium'>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : assets && assets.length > 0 ? (
        <FlatList
          data={assets}
          renderItem={({ item }) => (
            <NFTCard
              asset={item}
              onPress={() =>
                router.push({
                  pathname: '/(modals)/nft-detail',
                  params: { id: item.id },
                })
              }
            />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 24 }}
        />
      ) : (
        <View className='bg-dark-200 rounded-2xl p-6 items-center'>
          <Ionicons name='images-outline' size={48} color='#666672' />
          <Text className='text-gray-400 text-center mt-4'>
            No NFTs found in your wallet
          </Text>
        </View>
      )}
    </View>
  )
})
