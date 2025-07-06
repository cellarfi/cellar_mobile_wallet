import { NFTCard } from '@/components/NFTCard'
import { OfflineIndicator } from '@/components/OfflineIndicator'
import { useAssets } from '@/hooks/useAssets'
import {
  ASSET_FILTER_OPTIONS,
  AssetFilterOption,
} from '@/libs/api_requests/aura.request'
import { toTitleCase } from '@/libs/string.helpers'
import { Ionicons } from '@expo/vector-icons'
import { DasApiAsset } from '@metaplex-foundation/digital-asset-standard-api'
import { router, useFocusEffect } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function NFTGalleryScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState<DasApiAsset | null>(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [recipientAddress, setRecipientAddress] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState(false)

  const {
    assets,
    totalAssets,
    loading,
    isRefetching,
    error,
    refetch,
    activeFilter,
    changeFilter,
    loadMore,
    hasMore,
    sendNFT,
  } = useAssets()
  // Track pagination loading state
  const [localLoadingMore, setLocalLoadingMore] = useState(false)

  // Combine local and hook loading states to determine if we're loading more
  const loadingMore = localLoadingMore || isRefetching

  // Reset state when the screen is focused
  useFocusEffect(
    useCallback(() => {
      setSendError(null)
      setSendSuccess(false)
      setRecipientAddress('')
    }, [])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
    } catch (err) {
      console.error('Error during refresh:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const handleSendNFT = async () => {
    if (!selectedNFT || !recipientAddress.trim()) {
      setSendError('Please enter a valid recipient address')
      return
    }

    setSending(true)
    setSendError(null)

    try {
      const result = await sendNFT(selectedNFT.id, recipientAddress.trim())
      if (result.success) {
        setSendSuccess(true)
        setTimeout(() => {
          setShowSendModal(false)
          setSelectedNFT(null)
          setRecipientAddress('')
          setSendSuccess(false)
          refetch() // Refresh the NFT list
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

  // Render item for the FlatList
  const renderItem = ({ item }: { item: DasApiAsset }) => (
    <NFTCard
      asset={item}
      onPress={() => {
        router.push({
          pathname: '/(modals)/nft-detail',
          params: { id: item.id },
        })
      }}
      onLongPress={() => {
        setSelectedNFT(item)
        setShowSendModal(true)
      }}
      galleryView={true}
    />
  )

  return (
    <SafeAreaView className='flex-1 bg-dark-50' edges={['top']}>
      <View className='flex-1'>
        {/* Header */}
        <View className='flex-row items-center justify-between px-6 pt-4'>
          <TouchableOpacity
            onPress={() => router.dismiss()}
            className='w-10 h-10 bg-dark-200 rounded-full justify-center items-center'
          >
            <Ionicons name='arrow-back' size={20} color='white' />
          </TouchableOpacity>
          <Text className='text-white text-2xl font-bold'>NFT Gallery</Text>
          <View className='flex-row mt-4 mb-6'>
            <TouchableOpacity
              onPress={() => setShowFilterModal(true)}
              className='flex-row justify-center items-center gap-x-2 py-3 px-5 rounded-xl bg-dark-200'
            >
              <Ionicons name='funnel-outline' size={20} color='white' />
              <Text className='text-white font-medium'>
                Filter: {toTitleCase(activeFilter.replace(/_/g, ' ')) || 'All'}
              </Text>
            </TouchableOpacity>
          </View>
          <OfflineIndicator />
        </View>

        {/* Asset count display */}
        <View className='px-6 my-1'>
          <Text className='text-gray-400 mt-1'>
            Showing {assets.length} of {totalAssets} NFTs
          </Text>
        </View>

        {/* Content */}
        <View className='flex-1 px-4'>
          {/* Only show full-screen loader on initial load when no assets have been loaded yet */}
          {loading && assets.length === 0 ? (
            <View className='flex-1 justify-center items-center'>
              <ActivityIndicator size='large' color='#6366f1' />
              <Text className='text-white mt-4'>Loading NFTs...</Text>
            </View>
          ) : error ? (
            <View className='flex-1 justify-center items-center p-6'>
              <Ionicons name='warning-outline' size={48} color='#ef4444' />
              <Text className='text-gray-400 text-center mt-4'>
                {error instanceof Error ? error.message : String(error)}
              </Text>
              <TouchableOpacity
                onPress={() => refetch()}
                className='mt-4 bg-primary-500 rounded-xl px-4 py-2'
              >
                <Text className='text-white font-medium'>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : assets.length > 0 ? (
            <FlatList
              data={assets}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor='#6366f1'
                />
              }
              onEndReached={() => {
                if (hasMore && !loadingMore && !isRefetching) {
                  setLocalLoadingMore(true)
                  loadMore()
                  // Reset local loading state after a delay
                  setTimeout(() => setLocalLoadingMore(false), 1500)
                }
              }}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                isRefetching || loadingMore ? (
                  <View className='py-4 items-center'>
                    <ActivityIndicator color='#6366f1' />
                    <Text className='text-gray-400 mt-2'>
                      Loading more NFTs...
                    </Text>
                  </View>
                ) : hasMore ? (
                  <TouchableOpacity
                    onPress={() => {
                      if (!loadingMore && !isRefetching) {
                        setLocalLoadingMore(true)
                        loadMore()
                        // Reset local loading state after a delay
                        setTimeout(() => setLocalLoadingMore(false), 1500)
                      }
                    }}
                    disabled={loadingMore || isRefetching}
                    className='py-4 mb-4 bg-dark-200 rounded-lg items-center'
                  >
                    <Text className='text-primary-400 py-2'>
                      Load more NFTs
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text className='text-gray-500 text-center py-4'>
                    No more NFTs to load
                  </Text>
                )
              }
            />
          ) : (
            <View className='flex-1 justify-center items-center py-10'>
              <Text className='text-gray-400 text-lg text-center'>
                No NFTs found{' '}
                {totalAssets > 0 ? `(Filter: ${activeFilter})` : ''}
              </Text>
              {/* Debug info for development */}
              <Text className='text-gray-600 mt-2 text-center'>
                Total assets: {totalAssets}, Filter: {activeFilter}
              </Text>
              {totalAssets > 0 && (
                <TouchableOpacity
                  onPress={() => changeFilter('all')}
                  className='mt-4 py-2 px-4 bg-primary-500 rounded-xl'
                >
                  <Text className='text-white font-medium'>Show All NFTs</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType='slide'
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View className='flex-1 bg-black/50 justify-end'>
          <View className='bg-dark-100 rounded-t-3xl p-6'>
            <Text className='text-white text-xl font-bold mb-4'>
              Filter NFTs
            </Text>

            {ASSET_FILTER_OPTIONS.map((option: AssetFilterOption) => (
              <TouchableOpacity
                key={option.key}
                onPress={() => {
                  changeFilter(option.key)
                  setShowFilterModal(false)
                }}
                className={`py-4 border-b border-dark-200 flex-row justify-between items-center ${
                  activeFilter === option.key ? 'opacity-100' : 'opacity-70'
                }`}
              >
                <Text className='text-white font-medium'>{option.label}</Text>
                {activeFilter === option.key && (
                  <Ionicons name='checkmark-circle' size={22} color='#6366f1' />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setShowFilterModal(false)}
              className='mt-6 bg-dark-200 py-4 rounded-xl'
            >
              <Text className='text-white font-medium text-center'>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

            {selectedNFT && (
              <View className='items-center mb-4'>
                <Text className='text-white text-lg mb-2'>
                  {selectedNFT.content?.metadata?.name || 'NFT'}
                </Text>
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
                      <View>
                        <Text className='text-white mt-4'>
                          An error occurred:
                        </Text>
                        <Text className='text-red-500 mt-1 mb-4'>
                          {String(sendError)}
                        </Text>
                      </View>
                    )}

                    <View className='flex-row w-full justify-between mt-4'>
                      <TouchableOpacity
                        onPress={() => {
                          if (!sending) {
                            setShowSendModal(false)
                            setSelectedNFT(null)
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
    </SafeAreaView>
  )
}
