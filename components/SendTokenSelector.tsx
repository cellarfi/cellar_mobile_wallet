import { blurHashPlaceholder } from '@/constants/App'
import { BirdEyeTokenItem } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import React, { useMemo, useState } from 'react'
import {
  FlatList,
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

interface SendTokenSelectorProps {
  selectedToken: BirdEyeTokenItem | null
  tokens: BirdEyeTokenItem[]
  onTokenSelect: (token: BirdEyeTokenItem) => void
}

export default function SendTokenSelector({
  selectedToken,
  tokens,
  onTokenSelect,
}: SendTokenSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const formatBalance = (balance: number, decimals: number = 9) => {
    const actualBalance = balance / Math.pow(10, decimals)
    return actualBalance.toLocaleString('en-US', {
      maximumFractionDigits: 6,
      minimumFractionDigits: 0,
    })
  }

  const formatBalanceWithSymbol = (token: BirdEyeTokenItem) => {
    const balance = formatBalance(token.balance, token.decimals)
    return `${balance} ${token.symbol || ''}`
  }

  // Filter tokens based on search query
  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return tokens

    const query = searchQuery.toLowerCase().trim()
    return tokens.filter(
      (token) =>
        token.symbol?.toLowerCase().includes(query) ||
        token.name?.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query)
    )
  }, [tokens, searchQuery])

  const handleModalClose = () => {
    setModalVisible(false)
    setSearchQuery('')
  }

  const TokenListItem = ({ token }: { token: BirdEyeTokenItem }) => (
    <TouchableOpacity
      className='flex-row items-center bg-secondary-light rounded-2xl p-4 mb-3'
      onPress={() => {
        onTokenSelect(token)
        handleModalClose()
      }}
    >
      <View className='w-12 h-12 bg-primary-500/20 rounded-full justify-center items-center mr-3 overflow-hidden'>
        {token.logoURI ? (
          <Image
            source={{ uri: token.logoURI }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
            placeholder={{ blurhash: blurHashPlaceholder }}
          />
        ) : (
          <Text className='text-lg font-bold text-primary-400'>
            {token.symbol?.charAt(0) || '?'}
          </Text>
        )}
      </View>
      <View className='flex-1'>
        <Text className='text-white font-semibold text-lg'>
          {token.symbol || 'Unknown'}
        </Text>
        <Text className='text-gray-400 text-sm'>
          {token.name || 'Unknown Token'}
        </Text>
        <Text className='text-gray-400 text-sm'>
          {formatBalanceWithSymbol(token)}
        </Text>
      </View>
      <View className='items-end'>
        <Text className='text-white font-semibold'>
          ${token.valueUsd?.toFixed(2) || '0.00'}
        </Text>
        {token.priceUsd && (
          <Text className='text-gray-400 text-xs'>
            ${token.priceUsd.toFixed(token.priceUsd >= 1 ? 2 : 6)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <>
      <TouchableOpacity
        className='bg-secondary-light rounded-2xl p-4 mb-4'
        onPress={() => setModalVisible(true)}
      >
        <Text className='text-gray-400 text-sm mb-2'>Token</Text>
        <View className='flex-row items-center justify-between'>
          <View className='flex-row items-center flex-1'>
            <View className='w-12 h-12 bg-primary-500/20 rounded-full justify-center items-center mr-3 overflow-hidden'>
              {selectedToken?.logoURI ? (
                <Image
                  source={{ uri: selectedToken.logoURI }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                  placeholder={{ blurhash: blurHashPlaceholder }}
                />
              ) : (
                <Text className='text-lg font-bold text-primary-400'>
                  {selectedToken?.symbol?.charAt(0) || '?'}
                </Text>
              )}
            </View>
            <View className='flex-1'>
              <Text className='text-white font-semibold text-lg'>
                {selectedToken?.symbol || 'Select Token'}
              </Text>
              <Text className='text-gray-400 text-sm'>
                {selectedToken
                  ? formatBalanceWithSymbol(selectedToken)
                  : 'No token selected'}
              </Text>
            </View>
          </View>

          <View className='flex-row items-center'>
            {selectedToken && (
              <View className='items-end mr-3'>
                <Text className='text-white font-medium text-sm'>
                  ≈ ${selectedToken.valueUsd?.toFixed(2) || '0.00'}
                </Text>
                {selectedToken.priceUsd && (
                  <Text className='text-gray-400 text-xs'>
                    $
                    {selectedToken.priceUsd.toFixed(
                      selectedToken.priceUsd >= 1 ? 2 : 6
                    )}{' '}
                    / {selectedToken?.symbol || ''}
                  </Text>
                )}
              </View>
            )}
            <Ionicons name='chevron-down' size={20} color='#666672' />
          </View>
        </View>
      </TouchableOpacity>

      {/* Token Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType='slide'
        presentationStyle='pageSheet'
      >
        <SafeAreaView className='flex-1 bg-primary-main'>
          {/* Header */}
          <View className='flex-row items-center justify-between px-6 py-4'>
            <TouchableOpacity
              onPress={handleModalClose}
              className='w-10 h-10 rounded-full justify-center items-center'
            >
              <Ionicons name='close' size={20} color='white' />
            </TouchableOpacity>
            <Text className='text-white text-lg font-semibold'>
              Select Token
            </Text>
            <View className='w-10' />
          </View>

          {/* Search Input */}
          <View className='px-6 mb-4'>
            <View className='bg-secondary-light rounded-2xl px-4 py-3 flex-row items-center'>
              <Ionicons name='search' size={20} color='#666672' />
              <TextInput
                className='flex-1 text-white ml-3 text-lg'
                placeholder='Search tokens...'
                placeholderTextColor='#666672'
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize='none'
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  className='p-1'
                >
                  <Ionicons name='close-circle' size={18} color='#666672' />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Tokens List */}
          {filteredTokens.length > 0 ? (
            <FlatList
              data={filteredTokens}
              keyExtractor={(item) => item.address}
              renderItem={({ item }) => <TokenListItem token={item} />}
              className='flex-1 px-6'
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps='handled'
            />
          ) : (
            <View className='flex-1 justify-center items-center px-6'>
              <Ionicons name='search-outline' size={48} color='#666672' />
              <Text className='text-gray-400 text-center mt-4 text-lg'>
                No tokens found
              </Text>
              <Text className='text-gray-500 text-center mt-2'>
                {searchQuery.trim()
                  ? `No tokens match "${searchQuery}"`
                  : 'Your portfolio appears to be empty'}
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </>
  )
}
