import SearchPostCard from '@/components/core/social/SearchPostCard'
import { PostsRequests } from '@/libs/api_requests/posts.request'
import { userRequests } from '@/libs/api_requests/user.request'
import { SearchedPost } from '@/types/posts.interface'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const FILTER_OPTIONS = [
  { label: 'Users', value: 'USERS' },
  { label: 'All Posts', value: 'ALL_POSTS' },
  { label: 'Regular', value: 'REGULAR' },
  { label: 'Donation', value: 'DONATION' },
  { label: 'Token Call', value: 'TOKEN_CALL' },
]

export default function FindPostsModal() {
  const [searchType, setSearchType] = useState<
    'USERS' | 'ALL_POSTS' | 'REGULAR' | 'DONATION' | 'TOKEN_CALL'
  >('ALL_POSTS')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search posts when query or type changes
  React.useEffect(() => {
    const doSearch = async () => {
      if (
        searchType === 'ALL_POSTS' ||
        searchType === 'REGULAR' ||
        searchType === 'DONATION' ||
        searchType === 'TOKEN_CALL'
      ) {
        if (!searchQuery.trim()) {
          setResults([])
          setError(null)
          setLoading(false)
          return
        }
        setLoading(true)
        setError(null)
        try {
          const res = await PostsRequests.searchPosts(
            searchQuery.trim(),
            searchType === 'ALL_POSTS' ? undefined : searchType
          )
          if (res.success && res.data) {
            setResults(res.data as SearchedPost[])
          } else {
            setResults([])
            setError(res.message || 'No results found')
          }
        } catch (e: any) {
          setResults([])
          setError(e?.message || 'Search failed')
        } finally {
          setLoading(false)
        }
      } else if (searchType === 'USERS') {
        if (!searchQuery.trim()) {
          setResults([])
          setError(null)
          setLoading(false)
          return
        }
        setLoading(true)
        setError(null)
        try {
          const res = await userRequests.searchUsers(searchQuery.trim())
          if (res.success && res.data) {
            setResults(res.data)
          } else {
            setResults([])
            setError(res.message || 'No users found')
          }
        } catch (e: any) {
          setResults([])
          setError(e?.message || 'User search failed')
        } finally {
          setLoading(false)
        }
      } else {
        setResults([])
      }
    }
    doSearch()
  }, [searchQuery, searchType])

  // Render a post result
  const renderPost = ({ item }: { item: SearchedPost }) => (
    <SearchPostCard post={item} />
  )

  // Render a user result
  const renderUser = ({ item }: any) => (
    <TouchableOpacity
      className='bg-dark-200 rounded-xl p-4 mb-2 border border-dark-300 flex-row items-center'
      onPress={() =>
        router.push({
          pathname: '/(screens)/user-profile/[tag_name]',
          params: { tagName: item.tag_name },
        })
      }
      activeOpacity={0.9}
    >
      <View className='w-10 h-10 rounded-full bg-dark-300 justify-center items-center mr-3'>
        {item.profile_picture_url ? (
          <Image
            source={{ uri: item.profile_picture_url }}
            className='w-10 h-10 rounded-full'
          />
        ) : (
          <Text className='text-white text-lg font-semibold'>
            {item.display_name?.[0]?.toUpperCase() ?? '?'}
          </Text>
        )}
      </View>
      <View className='flex-1'>
        <Text className='text-white font-semibold text-base'>
          {item.display_name}
        </Text>
        <Text className='text-gray-400 text-xs'>@{item.tag_name}</Text>
      </View>
      <TouchableOpacity
        className='ml-4 px-3 py-1 rounded-xl bg-primary-500'
        onPress={() =>
          router.push({
            pathname: '/(screens)/user-profile/[tag_name]',
            params: { tagName: item.tag_name },
          })
        }
      >
        <Text className='text-white text-xs font-semibold'>View</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView className='flex-1 bg-primary-main'>
      {/* Header */}
      <View className='flex-row items-center justify-between px-6 py-4'>
        <TouchableOpacity
          onPress={() => {
            router.back()
          }}
        >
          <Ionicons name='arrow-back' size={22} color='#fff' />
        </TouchableOpacity>
        <Text className='text-white text-lg font-semibold'>Find Posts</Text>
        <View style={{ width: 22 }} />
      </View>
      {/* Search Bar + Filter */}
      <View className='flex-row items-center px-6 mb-4'>
        <View className='flex-1 bg-secondary-light rounded-xl flex-row items-center px-3 py-2 mr-2'>
          <Ionicons name='search' size={18} color='#6366f1' />
          <TextInput
            className='flex-1 ml-2 text-white'
            placeholder={`Search ${
              searchType === 'USERS' ? 'users' : 'posts'
            }...`}
            placeholderTextColor='#888'
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          onPress={() => setShowFilter(true)}
          className='bg-secondary-light rounded-xl p-2'
        >
          <Ionicons name='filter' size={20} color='#6366f1' />
        </TouchableOpacity>
      </View>
      {/* Filter Modal */}
      <Modal
        visible={showFilter}
        transparent
        animationType='fade'
        onRequestClose={() => setShowFilter(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
          activeOpacity={1}
          onPress={() => setShowFilter(false)}
        >
          <View className='absolute top-44 left-5 right-5 bg-secondary-light/80 rounded-xl p-4 mb-2 border border-dark-200'>
            <Text className='text-white text-base font-semibold mb-3'>
              Search for
            </Text>
            {FILTER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className={`py-2 px-3 rounded-lg mb-1 ${
                  searchType === opt.value
                    ? 'bg-primary-500'
                    : 'bg-secondary-light'
                }`}
                onPress={() => {
                  setSearchType(opt.value as any)
                  setShowFilter(false)
                }}
              >
                <Text
                  className={`text-white ${
                    searchType === opt.value ? 'font-bold' : 'font-normal'
                  }`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Results */}
      {loading ? (
        <View className='flex-1 justify-center items-center'>
          <ActivityIndicator color='#6366f1' />
        </View>
      ) : error ? (
        <Text className='text-red-500 text-center mt-10'>{error}</Text>
      ) : (
        <FlatList
          className='px-6'
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={searchType === 'USERS' ? renderUser : renderPost}
          ListEmptyComponent={
            <Text className='text-gray-400 text-center mt-10'>
              No results yet. Try searching!
            </Text>
          }
        />
      )}
    </SafeAreaView>
  )
}
