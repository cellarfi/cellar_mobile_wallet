import { addressBookRequests } from '@/libs/api_requests/address-book.request'
import { isValidSolanaAddress } from '@/libs/solana.lib'
import { useAddressBookStore } from '@/store/addressBookStore'
import { useAuthStore } from '@/store/authStore'
import { AddressBookEntry } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function EditAddressScreen() {
  // Route params
  const { entryId } = useLocalSearchParams<{ entryId: string }>()

  // Store access
  const { activeWallet } = useAuthStore()
  const { entries, addEntry, updateEntry } = useAddressBookStore()
  const walletAddress = activeWallet?.address

  // Form state
  const [isLoading, setIsLoading] = useState(false)
  const [loadingEntry, setLoadingEntry] = useState(!!entryId)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [network, setNetwork] = useState('solana')
  const [isFavorite, setIsFavorite] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [addressValidation, setAddressValidation] = useState<{
    isValidating: boolean
    isValid: boolean | null
  }>({ isValidating: false, isValid: null })

  const [originalValues, setOriginalValues] = useState<{
    name: string
    address: string
    description: string
    network: string
    isFavorite: boolean
    tags: string[]
  }>({
    name: '',
    address: '',
    description: '',
    network: 'solana',
    isFavorite: false,
    tags: [],
  })

  // Load address book entry if entryId is provided
  useEffect(() => {
    if (entryId) {
      loadAddressFromStore(entryId)
    }
    // For new entries, original values were already initialized with defaults
  }, [entryId, entries])

  // Validate address in real-time
  useEffect(() => {
    if (!address.trim()) {
      setAddressValidation({ isValidating: false, isValid: null })
      return
    }

    // Only validate Solana addresses
    if (network !== 'solana') {
      setAddressValidation({ isValidating: false, isValid: null })
      return
    }

    setAddressValidation({ isValidating: true, isValid: null })

    const timeoutId = setTimeout(() => {
      const isValid = isValidSolanaAddress(address.trim())
      setAddressValidation({ isValidating: false, isValid })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [address, network])

  // Load address from store instead of making API request
  const loadAddressFromStore = (id: string) => {
    setLoadingEntry(true)
    try {
      // Find the entry in the store
      const entry = entries.find((e) => e.id === id)

      if (entry) {
        // Set form fields
        setName(entry.name)
        setAddress(entry.address)
        setDescription(entry.description || '')
        setNetwork(entry.network || 'solana')
        setIsFavorite(entry.is_favorite || false)
        setTags(entry.tags || [])

        // Store original values for change detection
        setOriginalValues({
          name: entry.name,
          address: entry.address,
          description: entry.description || '',
          network: entry.network || 'solana',
          isFavorite: entry.is_favorite || false,
          tags: entry.tags || [],
        })
      } else {
        console.error('Address not found in store:', id)
        Alert.alert('Error', 'Failed to load address details')
        router.dismiss()
      }
    } catch (error) {
      console.error('Error loading address details from store:', error)
      Alert.alert('Error', 'Failed to load address details')
      router.dismiss()
    } finally {
      setLoadingEntry(false)
    }
  }

  const handleAddTag = () => {
    if (!newTag.trim()) return

    if (!tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
    }

    setNewTag('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const validate = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name')
      return false
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please enter a wallet address')
      return false
    }

    if (network === 'solana' && addressValidation.isValid === false) {
      Alert.alert(
        'Warning',
        'The wallet address format looks invalid. Do you want to continue anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => saveAddress() },
        ]
      )
      return false
    }

    return true
  }

  const saveAddress = async () => {
    if (!walletAddress || !validate()) return

    const entryData: Omit<
      AddressBookEntry,
      'id' | 'created_at' | 'updated_at'
    > = {
      name,
      address,
      description,
      network,
      is_favorite: isFavorite,
      tags,
    }

    try {
      let response

      if (entryId) {
        // Update existing entry
        response = await addressBookRequests.updateAddressBookEntry(
          entryId,
          entryData,
          setIsLoading
        )

        // Update entry in store if API call was successful
        if (response.success && response.data) {
          // Make sure to preserve any fields that might be in the store but not returned by the API
          const existingEntry = entries.find((e) => e.id === entryId)
          const mergedEntry = {
            ...existingEntry,
            ...response.data,
            is_favorite: isFavorite, // Ensure favorite status is updated
          }

          updateEntry(entryId, mergedEntry)
        }
      } else {
        // Create new entry
        response = await addressBookRequests.addAddressBookEntry(entryData)

        // Add new entry to store if API call was successful
        if (response.success && response.data) {
          addEntry(response.data)
        }
      }

      if (response.success) {
        // Small delay to ensure store is updated before dismissing
        setTimeout(() => {
          Alert.alert(
            'Success',
            entryId
              ? 'Address updated successfully'
              : 'Address added successfully',
            [{ text: 'OK', onPress: () => router.dismiss() }]
          )
        }, 100)
      } else {
        Alert.alert('Error', response.message || 'Failed to save address')
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to save address'
      console.error('Error saving address:', errorMessage)
      Alert.alert('Error', errorMessage)
    }
  }

  // Detect if any changes were made compared to the original values
  const hasChanges = useMemo(() => {
    // For a new address (no entryId), any valid input is a change
    if (!entryId) {
      return name.trim() !== '' && address.trim() !== ''
    }

    // For existing addresses, compare current form values with original values
    return (
      name !== originalValues.name ||
      address !== originalValues.address ||
      description !== originalValues.description ||
      network !== originalValues.network ||
      isFavorite !== originalValues.isFavorite ||
      // Compare tags (order might be different, so we check length and contents)
      tags.length !== originalValues.tags.length ||
      !tags.every((tag) => originalValues.tags.includes(tag)) ||
      !originalValues.tags.every((tag) => tags.includes(tag))
    )
  }, [
    name,
    address,
    description,
    network,
    isFavorite,
    tags,
    originalValues,
    entryId,
  ])

  if (loadingEntry) {
    return (
      <SafeAreaView className='flex-1 bg-dark-100 justify-center items-center'>
        <ActivityIndicator size='large' color='#6366f1' />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className='flex-1 bg-dark-100'>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className='flex-1'
      >
        <View className='flex-row items-center p-4 border-b border-dark-300'>
          <TouchableOpacity onPress={() => router.dismiss()} className='mr-4'>
            <Ionicons name='arrow-back' size={24} color='white' />
          </TouchableOpacity>
          <Text className='text-white text-xl font-semibold flex-1'>
            {entryId ? 'Edit Address' : 'Add Address'}
          </Text>
          <TouchableOpacity
            onPress={saveAddress}
            disabled={
              isLoading ||
              !hasChanges ||
              name.trim() === '' ||
              address.trim() === '' ||
              (network === 'solana' && addressValidation.isValid === false)
            }
            className={
              isLoading ||
              !hasChanges ||
              name.trim() === '' ||
              address.trim() === '' ||
              (network === 'solana' && addressValidation.isValid === false)
                ? 'opacity-50'
                : ''
            }
          >
            <Text
              className={`font-medium text-lg ${isLoading || !hasChanges || name.trim() === '' || address.trim() === '' || (network === 'solana' && addressValidation.isValid === false) ? 'text-gray-500' : 'text-primary-500'}`}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className='flex-1 p-4'>
          {/* Name Input */}
          <View className='mb-4'>
            <Text className='text-white text-sm mb-2 ml-1'>Name</Text>
            <View className='bg-dark-200 rounded-2xl'>
              <TextInput
                className='text-white p-4'
                placeholder='Enter a name for this address'
                placeholderTextColor='#6b7280'
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Address Input */}
          <View className='mb-4'>
            <Text className='text-white text-sm mb-2 ml-1'>Wallet Address</Text>
            <View className='bg-dark-200 rounded-2xl flex-row items-center'>
              <TextInput
                className='text-white p-4 flex-1'
                placeholder='Enter wallet address'
                placeholderTextColor='#6b7280'
                value={address}
                onChangeText={setAddress}
                multiline
              />
              {/* Address validation indicator */}
              <View className='mr-4'>
                {addressValidation.isValidating ? (
                  <ActivityIndicator size={16} color='#6366f1' />
                ) : addressValidation.isValid === true ? (
                  <Ionicons name='checkmark-circle' size={20} color='#22c55e' />
                ) : addressValidation.isValid === false ? (
                  <TouchableOpacity
                    onPress={() => setAddress('')}
                    className='p-1'
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name='close-circle' size={20} color='#ef4444' />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
            {addressValidation.isValid === false && network === 'solana' && (
              <Text className='text-red-400 text-sm mt-1 ml-1'>
                Invalid Solana address
              </Text>
            )}
          </View>

          {/* Description Input */}
          <View className='mb-4'>
            <Text className='text-white text-sm mb-2 ml-1'>
              Description (optional)
            </Text>
            <View className='bg-dark-200 rounded-2xl'>
              <TextInput
                className='text-white p-4'
                placeholder='Add a description or note'
                placeholderTextColor='#6b7280'
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>
          </View>

          {/* Network Selection */}
          {/* <View className='mb-4'>
            <Text className='text-white text-sm mb-2 ml-1'>Network</Text>
            <View className='bg-dark-200 rounded-2xl p-1 flex-row'>
              {['solana', 'soon', 'sonic'].map((net) => (
                <TouchableOpacity
                  key={net}
                  className={`flex-1 p-3 rounded-xl ${
                    network === net ? 'bg-primary-500' : ''
                  }`}
                  onPress={() => setNetwork(net)}
                >
                  <Text
                    className={`text-center font-medium ${
                      network === net ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    {net.charAt(0).toUpperCase() + net.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View> */}

          {/* Favorite Toggle */}
          <View className='bg-dark-200 rounded-2xl mb-4'>
            <View className='flex-row items-center justify-between p-4'>
              <View className='flex-row items-center'>
                <Ionicons name='star' size={20} color='#F9A826' />
                <Text className='text-white font-medium ml-2'>
                  Mark as favorite
                </Text>
              </View>
              <Switch
                value={isFavorite}
                onValueChange={setIsFavorite}
                trackColor={{ false: '#2d2d35', true: '#6366f1' }}
                thumbColor={isFavorite ? '#ffffff' : '#666672'}
              />
            </View>
          </View>

          {/* Tags Input */}
          <View className='mb-6'>
            <Text className='text-white text-sm mb-2 ml-1'>
              Tags (optional)
            </Text>
            <View className='bg-dark-200 rounded-2xl mb-2 flex-row items-center'>
              <TextInput
                className='text-white p-4 flex-1'
                placeholder='Add tag and press +'
                placeholderTextColor='#6b7280'
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={handleAddTag}
              />
              <TouchableOpacity
                className='p-4'
                onPress={handleAddTag}
                disabled={!newTag.trim()}
              >
                <Ionicons
                  name='add-circle'
                  size={24}
                  color={newTag.trim() ? '#6366f1' : '#6b7280'}
                />
              </TouchableOpacity>
            </View>

            {/* Tags List */}
            <View className='flex-row flex-wrap'>
              {tags.map((tag, index) => (
                <View
                  key={index}
                  className='bg-dark-300 rounded-full flex-row items-center px-3 py-1 mr-2 mb-2'
                >
                  <Text className='text-primary-400 mr-1'>{tag}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                    <Ionicons name='close-circle' size={16} color='#6366f1' />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
