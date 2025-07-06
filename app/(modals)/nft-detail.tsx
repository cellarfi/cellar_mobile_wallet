import { blurHashPlaceholder } from '@/constants/App'
import { useAssets } from '@/hooks/useAssets'
import { getAssetUri } from '@/libs/asset.helpers'
import { Ionicons } from '@expo/vector-icons'
import { DasApiAsset } from '@metaplex-foundation/digital-asset-standard-api'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import * as Linking from 'expo-linking'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function NFTDetailScreen() {
  // Get the NFT ID from the URL params
  const { id } = useLocalSearchParams<{ id: string }>()
  const [nft, setNft] = useState<DasApiAsset | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [recipientAddress, setRecipientAddress] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const { assets, loading: assetsLoading, getAssetById, sendNFT } = useAssets()

  useEffect(() => {
    const loadAsset = async () => {
      setLoading(true)
      if (id && assets && assets.length > 0) {
        // Find the NFT by ID in the assets array
        const foundAsset = getAssetById(id)
        if (foundAsset) {
          setNft(foundAsset)
        }
      }
      setLoading(false)
    }

    loadAsset()
  }, [id, assets])

  const imageUrl = nft ? getAssetUri(nft) : ''

  const getName = () => {
    return nft?.content?.metadata?.name || 'Unnamed NFT'
  }

  const getCollection = () => {
    return (
      nft?.grouping?.find((g) => g.group_key === 'collection')?.group_value ||
      'Unknown Collection'
    )
  }

  const getDescription = () => {
    return (
      nft?.content?.metadata?.description ||
      `An NFT from the ${getCollection()} collection on Solana.`
    )
  }

  const getOwner = () => {
    return nft?.ownership?.owner || 'Unknown Owner'
  }

  const getCreator = () => {
    return nft?.creators?.[0]?.address || 'Unknown Creator'
  }

  const getAttributes = () => {
    return nft?.content?.metadata?.attributes || []
  }

  // Format address for display - show first 6 and last 4 characters
  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  // Copy to clipboard function
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await Clipboard.setStringAsync(text)
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setCopiedField(field)

      // Reset after 2 seconds
      setTimeout(() => {
        setCopiedField(null)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Function to view on explorer
  const viewOnExplorer = async () => {
    try {
      // This would be a real Solscan or other explorer URL in production
      const url = `https://solscan.io/token/${nft?.id || ''}`
      const canOpen = await Linking.canOpenURL(url)

      if (canOpen) {
        await Linking.openURL(url)
      } else {
        Alert.alert('Error', 'Cannot open explorer link')
      }
    } catch (error) {
      console.error('Failed to open explorer:', error)
      Alert.alert('Error', 'Failed to open in explorer')
    }
  }

  // Function to share NFT
  const shareNFT = async () => {
    try {
      const url = `https://solscan.io/token/${nft?.id || ''}`
      const shareContent = {
        title: `Check out my ${getName()}`,
        message: `Check out my ${getName()} from the ${getCollection()} collection on Solana!\n\nView on Solscan: ${url}`,
      }

      await Share.share(shareContent)
    } catch (error) {
      console.error('Failed to share NFT:', error)
      Alert.alert('Error', 'Failed to share NFT')
    }
  }

  // Handle sending an NFT
  const handleSendNFT = async () => {
    if (!nft || !recipientAddress.trim()) {
      setSendError('Please enter a valid recipient address')
      return
    }

    setSending(true)
    setSendError(null)

    try {
      const result = await sendNFT(nft.id, recipientAddress.trim())
      if (result.success) {
        setSendSuccess(true)
        setTimeout(() => {
          setShowSendModal(false)
          setRecipientAddress('')
          setSendSuccess(false)
          // Go back to the gallery after successful send
          router.back()
        }, 2000)
      } else {
        setSendError(result.message || 'Failed to send NFT')
      }
    } catch (err: any) {
      setSendError(err.message || 'An error occurred while sending the NFT')
    } finally {
      setSending(false)
    }
  }

  if (loading || assetsLoading) {
    return (
      <SafeAreaView className='flex-1 bg-dark-50'>
        <View className='flex-1 justify-center items-center'>
          <Text className='text-white text-lg'>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!nft) {
    return (
      <SafeAreaView className='flex-1 bg-dark-50'>
        <View className='flex-1 justify-center items-center'>
          <Text className='text-white text-lg'>No NFT found</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className='flex-1 bg-dark-50'>
      <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className='flex-row items-center justify-between px-6 py-4'>
          <TouchableOpacity
            onPress={() => router.dismiss()}
            className='w-10 h-10 bg-dark-200 rounded-full justify-center items-center'
          >
            <Ionicons name='arrow-back' size={20} color='white' />
          </TouchableOpacity>
          <Text className='text-white text-lg font-semibold'>NFT Details</Text>
          <View className='w-10' />
        </View>

        {/* NFT Display */}
        <View className='px-6'>
          <View className='bg-dark-200 rounded-3xl p-6 mb-6 items-center'>
            {/* NFT Image */}
            <TouchableOpacity
              className='w-full h-64 rounded-2xl justify-center items-center'
              onPress={() => setShowImageModal(true)}
              activeOpacity={0.8}
            >
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: '100%', height: '100%', borderRadius: 24 }}
                  contentFit='contain'
                  placeholder={{ blurhash: blurHashPlaceholder }}
                />
              ) : (
                <Text className='text-8xl'>🖼️</Text>
              )}
            </TouchableOpacity>

            {/* NFT Name */}
            <Text className='text-white text-2xl font-bold mt-1'>
              {getName()}
            </Text>

            {nft.content?.metadata?.symbol && (
              <View className='bg-primary-400/20 px-4 py-2 rounded-full'>
                <Text className='text-primary-400 font-semibold'>
                  {nft.content?.metadata?.symbol}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        <View className='px-6 mb-6'>
          <View className='bg-dark-200 rounded-2xl p-6'>
            <Text className='text-white text-lg font-semibold mb-2'>
              Description
            </Text>
            <Text className='text-gray-400'>{getDescription()}</Text>
          </View>
        </View>

        {/* Properties */}
        {getAttributes().length > 0 && (
          <View className='px-6 mb-6'>
            <View className='bg-dark-200 rounded-2xl p-6'>
              <Text className='text-white text-lg font-semibold mb-4'>
                Properties
              </Text>
              <View className='flex-row flex-wrap justify-between'>
                {getAttributes().map((attr: any, index: number) => (
                  <View
                    key={index}
                    className='bg-dark-300 rounded-xl p-3 mb-3 w-[48%]'
                  >
                    <Text className='text-primary-400 text-xs'>
                      {attr.trait_type}
                    </Text>
                    <Text className='text-white font-medium'>{attr.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Details */}
        <View className='px-6 mb-6'>
          <View className='bg-dark-200 rounded-2xl p-6'>
            <Text className='text-white text-lg font-semibold mb-4'>
              Details
            </Text>

            {/* Owner */}
            <View className='flex-row justify-between py-3 border-b border-dark-300'>
              <Text className='text-gray-400'>Owner</Text>
              <View className='flex-row items-center'>
                <Text className='text-white font-medium mr-2'>
                  {formatAddress(getOwner())}
                </Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard(getOwner(), 'owner')}
                >
                  <Ionicons
                    name={
                      copiedField === 'owner'
                        ? 'checkmark-outline'
                        : 'copy-outline'
                    }
                    size={16}
                    color='#6366f1'
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Creator */}
            <View className='flex-row justify-between py-3 border-b border-dark-300'>
              <Text className='text-gray-400'>Creator</Text>
              <Text className='text-white font-medium'>
                {formatAddress(getCreator())}
              </Text>
            </View>

            {/* Token ID */}
            <View className='flex-row justify-between py-3 border-b border-dark-300'>
              <Text className='text-gray-400'>Token ID</Text>
              <View className='flex-row items-center'>
                <Text className='text-white font-medium mr-2'>
                  {formatAddress(nft.id || '')}
                </Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard(nft.id || '', 'tokenId')}
                >
                  <Ionicons
                    name={
                      copiedField === 'tokenId'
                        ? 'checkmark-outline'
                        : 'copy-outline'
                    }
                    size={16}
                    color='#6366f1'
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Collection */}
            <View className='flex-row justify-between py-3 border-b border-dark-300'>
              <Text className='text-gray-400'>Collection</Text>
              <View className='flex-row items-center'>
                <Text className='text-white font-medium mr-2'>
                  {formatAddress(getCollection())}
                </Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard(getCollection(), 'collection')}
                >
                  <Ionicons
                    name={
                      copiedField === 'collection'
                        ? 'checkmark-outline'
                        : 'copy-outline'
                    }
                    size={16}
                    color='#6366f1'
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Mint Date */}
            <View className='flex-row justify-between py-3 border-b border-dark-300'>
              <Text className='text-gray-400'>Mint Date</Text>
              <Text className='text-white font-medium'>{'Not available'}</Text>
            </View>

            {/* Last Sale */}
            <View className='flex-row justify-between py-3 border-b border-dark-300'>
              <Text className='text-gray-400'>Last Sale</Text>
              <Text className='text-white font-medium'>Not available</Text>
            </View>

            {/* Rarity */}
            <View className='flex-row justify-between py-3'>
              <Text className='text-gray-400'>Rarity</Text>
              <Text className='text-white font-medium'>{'Not available'}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className='flex-row gap-4 px-6 mb-8'>
          <TouchableOpacity
            className='flex-1 bg-dark-200 rounded-xl p-4 items-center justify-center'
            onPress={() => setShowSendModal(true)}
          >
            <Ionicons name='send-outline' size={20} color='#6366f1' />
            <Text className='text-white text-center font-medium mt-1'>
              Send NFT
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className='flex-1 bg-dark-200 rounded-xl p-4 items-center justify-center'
            onPress={viewOnExplorer}
          >
            <Ionicons name='open-outline' size={20} color='#6366f1' />
            <Text className='text-white text-center font-medium mt-1'>
              View in Explorer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className='flex-1 bg-dark-200 rounded-xl p-4 items-center justify-center'
            onPress={shareNFT}
          >
            <Ionicons name='share-social-outline' size={20} color='#6366f1' />
            <Text className='text-white text-center font-medium mt-1'>
              Share
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Send NFT Modal */}
      <Modal
        visible={showSendModal}
        transparent={true}
        animationType='slide'
        onRequestClose={() => {
          if (!sending) setShowSendModal(false)
        }}
      >
        <View className='flex-1 bg-black/50 justify-end'>
          <View className='bg-dark-100 rounded-t-3xl p-6'>
            <Text className='text-white text-xl font-bold mb-4'>Send NFT</Text>

            {nft && (
              <View className='items-center mb-4'>
                <Text className='text-white text-lg mb-2'>{getName()}</Text>
                {!sendSuccess ? (
                  <>
                    <Text className='text-gray-400 mb-4 text-center'>
                      Enter the recipient's wallet address to send this NFT
                    </Text>
                    <View className='bg-dark-200 rounded-xl w-full p-4 mb-2'>
                      <TextInput
                        placeholder='Recipient Wallet Address'
                        placeholderTextColor='#666672'
                        className='text-white'
                        value={recipientAddress}
                        onChangeText={setRecipientAddress}
                        autoCapitalize='none'
                        editable={!sending}
                      />
                    </View>

                    {sendError && (
                      <Text className='text-red-500 my-2'>{sendError}</Text>
                    )}

                    <View className='flex-row w-full justify-between mt-4'>
                      <TouchableOpacity
                        onPress={() => {
                          if (!sending) {
                            setShowSendModal(false)
                            setRecipientAddress('')
                            setSendError(null)
                          }
                        }}
                        className='bg-dark-200 py-3 px-6 rounded-xl flex-1 mr-2'
                        disabled={sending}
                      >
                        <Text className='text-white font-medium text-center'>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleSendNFT}
                        className='bg-primary-500 py-3 px-6 rounded-xl flex-1 ml-2'
                        disabled={sending}
                      >
                        {sending ? (
                          <ActivityIndicator size='small' color='white' />
                        ) : (
                          <Text className='text-white font-medium text-center'>
                            Send
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View className='items-center'>
                    <Ionicons name='checkmark-circle' size={60} color='green' />
                    <Text className='text-green-500 text-lg mt-2'>
                      NFT sent successfully!
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Full-Screen Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={false}
        animationType='fade'
        onRequestClose={() => setShowImageModal(false)}
      >
        <SafeAreaView className='flex-1 bg-black'>
          {/* Header */}
          <View className='flex-row items-center justify-between px-6 py-4 bg-black/80 absolute top-0 left-0 right-0 z-10'>
            <TouchableOpacity
              onPress={() => setShowImageModal(false)}
              className='w-10 h-10 bg-white/20 rounded-full justify-center items-center'
            >
              <Ionicons name='close' size={24} color='white' />
            </TouchableOpacity>
            <Text
              className='text-white text-lg font-semibold flex-1 text-center mx-4'
              numberOfLines={1}
              ellipsizeMode='tail'
            >
              {getName()}
            </Text>
            <View className='w-10' />
          </View>

          {/* Full-Screen Image */}
          <View className='flex-1 justify-center items-center'>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit='contain'
                placeholder={{ blurhash: blurHashPlaceholder }}
              />
            ) : (
              <View className='justify-center items-center'>
                <Text className='text-white text-8xl mb-4'>🖼️</Text>
                <Text className='text-white text-lg'>No image available</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}
