import { useAddress } from '@/hooks/useAddress'
import { addressBookRequests } from '@/libs/api_requests/address-book.request'
import { useAddressStore } from '@/store/addressStore'
import { useAuthStore } from '@/store/authStore'
import { AddressBookEntry } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { formatWalletAddress } from '@privy-io/expo'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function AddressBookScreen() {
  const { activeWallet } = useAuthStore()
  const walletAddress = activeWallet?.address

  const {
    addresses: addressBook,
    isLoading,
    refetch: loadAddressBook,
    isRefetching,
  } = useAddress()

  const { removeAddress } = useAddressStore()

  const [searchText, setSearchText] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { selectMode, onSelect } = useLocalSearchParams<{
    selectMode?: string
    onSelect?: string
  }>()

  const isSelectionMode = selectMode === 'true'

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (walletAddress) {
        console.log('Address book screen focused - checking if refresh needed')
        loadAddressBook()
      }
      return () => {}
    }, [walletAddress, loadAddressBook])
  )

  // Debug address book data
  useEffect(() => {
    console.log('Address book debug:', {
      entriesCount: addressBook.length,
      isLoading,
      hasWallet: !!walletAddress,
      sampleEntry: addressBook[0]
        ? {
            id: addressBook[0].id,
            name: addressBook[0].name,
            address: addressBook[0].address,
          }
        : null,
    })
  }, [addressBook, isLoading, walletAddress])

  // Handle pull-to-refresh action
  const onRefresh = useCallback(async () => {
    try {
      await loadAddressBook()
    } catch (error) {
      console.error('Error refreshing address book:', error)
    }
  }, [loadAddressBook])

  const handleAddAddress = () => {
    router.push({
      pathname: '/(modals)/edit-address' as any,
    })
  }

  const handleEditAddress = (entry: AddressBookEntry) => {
    router.push({
      pathname: '/(modals)/edit-address' as any,
      params: { entryId: entry.id },
    })
  }

  // Separate function to handle the actual deletion process
  const deleteAddressEntry = async (id: string) => {
    if (!walletAddress) return

    // Only set deleting state if not already deleting this entry
    if (deletingId !== id) {
      setDeletingId(id)
    }

    try {
      console.log(`Sending delete request for address ID: ${id}`)
      const response = await addressBookRequests.deleteAddressBookEntry(id)

      if (response.success) {
        // Update the store if API call succeeded
        removeAddress(id)
        // Alert with a slight delay to ensure store is updated first
        setTimeout(() => {
          Alert.alert('Success', 'Address deleted successfully')
        }, 100)
      } else {
        Alert.alert('Error', response.message || 'Failed to delete address')
      }
    } catch (error: any) {
      // Check if error is related to record not found (already deleted)
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete address'
      if (!errorMessage.includes('not found')) {
        Alert.alert('Error', errorMessage)
      }
    } finally {
      // Always clear the deleting state
      setDeletingId(null)
    }
  }

  // Handler for delete button press that shows confirmation
  const handleDeleteAddress = (entry: AddressBookEntry) => {
    // Prevent multiple alerts if already in process of deleting
    if (deletingId === entry.id) return

    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete "${entry.name}" from your address book?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          // Use a simple reference to the function instead of an inline async function
          onPress: () => deleteAddressEntry(entry.id),
        },
      ]
    )
  }

  const handleSelectAddress = (entry: AddressBookEntry) => {
    console.log('handleSelectAddress called with:', {
      entry: {
        id: entry.id,
        name: entry.name,
        address: entry.address,
      },
      isSelectionMode,
      onSelect,
    })

    if (isSelectionMode && onSelect) {
      // Parse the callback function name and navigate back with the selected address
      try {
        const callbackFn = JSON.parse(onSelect)
        console.log('Parsed callback function:', callbackFn)

        if (callbackFn && callbackFn.screen && callbackFn.param) {
          const params = { [callbackFn.param]: entry.address }
          console.log('Navigating with params:', params)

          // Go back to the previous screen (send screen) and set the parameters
          router.back()

          // Use setTimeout to ensure navigation completes before setting params
          setTimeout(() => {
            router.setParams(params)
          }, 200)
        } else {
          console.error('Invalid callback function structure:', callbackFn)
        }
      } catch (error) {
        console.error('Error parsing callback:', error)
        // Fallback: just dismiss the modal
        router.dismiss()
      }
    } else {
      handleEditAddress(entry)
    }
  }

  const filteredAddressBook = addressBook.filter(
    (entry) =>
      entry.name.toLowerCase().includes(searchText.toLowerCase()) ||
      entry.address.toLowerCase().includes(searchText.toLowerCase())
  )

  const renderItem = ({ item }: { item: AddressBookEntry }) => (
    <TouchableOpacity
      className='flex-row items-center bg-dark-200 rounded-2xl p-4 mb-2'
      onPress={() => handleSelectAddress(item)}
    >
      <View className='w-10 h-10 bg-primary-500/70 rounded-full justify-center items-center mr-4'>
        <Text className='text-lg text-white/70'>{item.name.charAt(0)}</Text>
      </View>

      <View className='flex-1'>
        <View className='flex-row items-center'>
          <Text className='text-white font-semibold text-base mr-2'>
            {item.name}
          </Text>
          {item.is_favorite && (
            <Ionicons name='star' size={16} color='#F9A826' />
          )}
        </View>
        <Text className='text-gray-400'>
          {formatWalletAddress(item.address)}
        </Text>
        {item.description && (
          <Text className='text-gray-500 text-xs mt-1'>{item.description}</Text>
        )}
      </View>

      {!isSelectionMode && (
        <View className='flex-row'>
          {/* Edit button */}
          <TouchableOpacity
            className='p-2 mr-1'
            onPress={() => handleEditAddress(item)}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name='pencil-outline' size={20} color='#6366f1' />
          </TouchableOpacity>

          {/* Delete button */}
          <TouchableOpacity
            className='p-2'
            onPress={() => handleDeleteAddress(item)}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            disabled={deletingId === item.id}
          >
            {deletingId === item.id ? (
              <ActivityIndicator size='small' color='#ef4444' />
            ) : (
              <Ionicons name='trash-outline' size={20} color='#ef4444' />
            )}
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView className='flex-1 bg-primary-main'>
      <View className='flex-row items-center p-4 border-b border-dark-300'>
        <TouchableOpacity onPress={() => router.dismiss()} className='mr-4'>
          <Ionicons name='chevron-back' size={24} color='white' />
        </TouchableOpacity>
        <Text className='text-white text-xl font-semibold flex-1'>
          {isSelectionMode ? 'Select Address' : 'Address Book'}
        </Text>
        {!isSelectionMode && (
          <TouchableOpacity onPress={handleAddAddress}>
            <Ionicons name='add' size={24} color='#6366f1' />
          </TouchableOpacity>
        )}
      </View>

      <View className='p-4'>
        <View className='relative mb-4'>
          <TextInput
            className='bg-secondary-light text-white px-10 py-3 rounded-2xl w-full'
            placeholder='Search addresses...'
            placeholderTextColor='#6b7280'
            value={searchText}
            onChangeText={setSearchText}
          />
          <View className='absolute left-3 top-0 bottom-0 justify-center'>
            <Ionicons name='search' size={20} color='#6b7280' />
          </View>
        </View>

        <FlatList
          data={filteredAddressBook}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          className='w-full'
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor='#6366f1'
              colors={['#6366f1']}
              progressBackgroundColor='#1e1e24'
            />
          }
          ListEmptyComponent={
            isLoading ? (
              <View className='flex-1 justify-center items-center py-8'>
                <ActivityIndicator size='large' color='#6366f1' />
              </View>
            ) : (
              <View className='flex-1 justify-center items-center py-8'>
                <Text className='text-white text-center'>
                  {searchText.length > 0
                    ? 'No addresses match your search criteria'
                    : 'Add addresses to your address book for quick access'}
                </Text>
                {!isSelectionMode && !searchText && (
                  <TouchableOpacity
                    className='bg-primary-500 rounded-full px-6 py-3 mt-4'
                    onPress={handleAddAddress}
                  >
                    <Text className='text-white font-medium'>Add Address</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }
        />
      </View>
    </SafeAreaView>
  )
}
