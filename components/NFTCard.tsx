import { blurHashPlaceholder } from '@/constants/App'
import { getAssetUri } from '@/libs/asset.helpers'
import { DasApiAsset } from '@metaplex-foundation/digital-asset-standard-api'
import { formatWalletAddress } from '@privy-io/expo'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface NFTCardProps {
  asset: DasApiAsset
  onPress?: () => void
  onLongPress?: () => void
  galleryView?: boolean
}

export function NFTCard({
  asset,
  onPress,
  onLongPress,
  galleryView = false,
}: NFTCardProps) {
  // Extract NFT name and collection from metadata
  const name = asset.content?.metadata?.name || 'Unnamed NFT'

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else {
      // Pass the asset ID to the detail page
      router.push({
        pathname: '/(modals)/nft-detail',
        params: { id: asset.id },
      })
    }
  }

  const imageUrl = getAssetUri(asset)

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={onLongPress}
      className={`bg-dark-200 rounded-2xl p-4 ${galleryView ? 'mb-4 w-[48%]' : 'mr-3 w-40'} active:scale-95`}
    >
      <View className='w-full h-32 bg-dark-300 rounded-xl justify-center items-center mb-3 overflow-hidden'>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: '100%', borderRadius: 24 }}
            placeholder={{ blurhash: blurHashPlaceholder }}
          />
        ) : (
          <Text className='text-4xl'>🖼️</Text>
        )}
      </View>
      <Text className='text-white font-semibold text-sm mb-1' numberOfLines={1}>
        {name}
      </Text>
      <Text className='text-gray-500 text-xs opacity-70' numberOfLines={1}>
        ID: {asset.id ? formatWalletAddress(asset.id) : 'Unknown ID'}
      </Text>
    </TouchableOpacity>
  )
}
