import { userRequests } from '@/libs/api_requests/user.request'
import { SearchUsers } from '@/types/user.interface'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

interface MentionSuggestionsProps {
  query: string
  onSelect: (user: SearchUsers) => void
  onClose: () => void
  visible: boolean
}

/**
 * Component that displays user suggestions when @mention is being typed
 * Shows profile image, display name, and tag name for each user
 */
const MentionSuggestions: React.FC<MentionSuggestionsProps> = ({
  query,
  onSelect,
  onClose,
  visible,
}) => {
  const [users, setUsers] = useState<SearchUsers[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible || !query || query.trim().length === 0) {
      setUsers([])
      return
    }

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchUsers(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, visible])

  const searchUsers = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setUsers([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await userRequests.searchUsers(searchQuery)
      if (response.success && response.data) {
        setUsers(response.data)
      } else {
        setError(response.message || 'Failed to search users')
        setUsers([])
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to search users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  if (!visible || (!loading && users.length === 0 && !error)) {
    return null
  }

  const renderUserItem = ({ item }: { item: SearchUsers }) => (
    <TouchableOpacity
      className='flex-row items-center px-4 py-3 active:bg-gray-800/50'
      activeOpacity={0.7}
      onPress={() => {
        onSelect(item)
        onClose()
      }}
    >
      {/* Profile Picture */}
      <View className='w-12 h-12 bg-primary-500/20 rounded-full justify-center items-center mr-3 overflow-hidden'>
        {item.profile_picture_url ? (
          <Image
            source={{ uri: item.profile_picture_url }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
            resizeMode='cover'
          />
        ) : (
          <Text className='text-lg text-white font-semibold'>
            {item.display_name?.[0]?.toUpperCase() ?? '?'}
          </Text>
        )}
      </View>

      {/* User Info */}
      <View className='flex-1'>
        <Text className='text-white font-semibold text-base mb-0.5'>
          {item.display_name}
        </Text>
        <Text className='text-gray-400 text-sm'>@{item.tag_name}</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <View className='bg-secondary-light rounded-xl border border-gray-800/50 shadow-2xl max-h-64 overflow-hidden'>
      {loading ? (
        <View className='py-8 items-center justify-center'>
          <ActivityIndicator color='#00C2CB' size='small' />
          <Text className='text-gray-400 mt-2 text-sm'>Searching...</Text>
        </View>
      ) : error ? (
        <View className='py-4 px-4'>
          <Text className='text-red-400 text-sm'>{error}</Text>
        </View>
      ) : users.length > 0 ? (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps='handled'
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className='py-4 px-4'>
          <Text className='text-gray-400 text-sm text-center'>
            No users found
          </Text>
        </View>
      )}
    </View>
  )
}

export default MentionSuggestions
