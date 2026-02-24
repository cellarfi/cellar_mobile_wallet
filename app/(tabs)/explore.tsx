import { blurHashPlaceholder } from '@/constants/App'
import { RecentDapp, useRecentDappsStore } from '@/store/recentDappsStore'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const { recentDapps, removeRecentDapp, clearRecentDapps } =
    useRecentDappsStore()

  const isValidUrl = (string: string) => {
    const urlRegex =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w\.-]*)*(\?[\w\-=&%]*)*$/i
    return urlRegex.test(string.trim())
  }

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 500)
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) return

    if (isValidUrl(searchQuery)) {
      router.push({
        pathname: '/(screens)/browser' as any,
        params: {
          url: searchQuery.startsWith('http')
            ? searchQuery
            : `https://${searchQuery}`,
        },
      })
    } else {
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`
      router.push({
        pathname: '/(screens)/browser' as any,
        params: {
          url: googleSearchUrl,
          title: `Search: ${searchQuery.trim()}`,
        },
      })
    }
  }

  const openDApp = (dapp: RecentDapp) => {
    router.push({
      pathname: '/(screens)/browser' as any,
      params: { url: dapp.url, title: dapp.title },
    })
  }

  const getFaviconUrl = (domain: string) => {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
  }

  const RecentDappCard = ({ dapp }: { dapp: RecentDapp }) => (
    <TouchableOpacity
      className='bg-secondary-light rounded-2xl p-4 mb-3 active:opacity-80'
      onPress={() => openDApp(dapp)}
    >
      <View className='flex-row items-center'>
        <View className='w-12 h-12 bg-white/10 rounded-xl justify-center items-center mr-3 overflow-hidden'>
          <Image
            source={{ uri: dapp.favicon || getFaviconUrl(dapp.domain) }}
            style={{ width: 28, height: 28 }}
            placeholder={{ blurhash: blurHashPlaceholder }}
          />
        </View>
        <View className='flex-1'>
          <Text
            className='text-white font-semibold text-base mb-0.5'
            numberOfLines={1}
          >
            {dapp.title || dapp.domain}
          </Text>
          <Text className='text-gray-500 text-sm' numberOfLines={1}>
            {dapp.domain}
          </Text>
        </View>
        <View className='items-end'>
          <Text className='text-gray-600 text-xs mb-1'>
            {formatTimeAgo(dapp.lastVisited)}
          </Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation()
              removeRecentDapp(dapp.id)
            }}
            className='p-1'
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name='close-circle' size={18} color='#4b5563' />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )

  const EmptyState = () => (
    <View className='flex-1 justify-center items-center px-8 py-16'>
      <View className='w-24 h-24 bg-secondary-light rounded-full justify-center items-center mb-6'>
        <Ionicons name='compass-outline' size={48} color='#6366f1' />
      </View>
      <Text className='text-white text-xl font-bold text-center mb-3'>
        Start Exploring
      </Text>
      <Text className='text-gray-400 text-center text-base leading-6'>
        Enter a URL or search term above to browse the web. Your recently
        visited sites will appear here.
      </Text>
    </View>
  )

  return (
    <SafeAreaView className='flex-1 bg-primary-main' edges={['top']}>
      <ScrollView
        className='flex-1'
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor='#6366f1'
          />
        }
        contentContainerStyle={
          recentDapps.length === 0 ? { flex: 1 } : undefined
        }
      >
        {/* Header */}
        <View className='px-6 pt-4 pb-2'>
          <View className='flex-row items-center justify-between mb-2'>
            <Text className='text-white text-2xl font-bold'>Browser</Text>
            <TouchableOpacity
              onPress={() => router.push('/(screens)/browser' as any)}
              className='w-10 h-10 bg-secondary-light rounded-full justify-center items-center'
            >
              <Ionicons name='add' size={20} color='#6366f1' />
            </TouchableOpacity>
          </View>
          <Text className='text-gray-400 text-sm'>
            Browse your favorite dApps
          </Text>
        </View>

        {/* Search Bar */}
        <View className='px-6 py-4'>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.15)', 'rgba(139, 92, 246, 0.15)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className='rounded-2xl'
          >
            <View className='bg-secondary-light/80 rounded-2xl px-4 py-3.5 flex-row items-center'>
              <Ionicons
                name={
                  searchQuery.trim() && isValidUrl(searchQuery)
                    ? 'globe'
                    : 'search'
                }
                size={20}
                color={
                  searchQuery.trim() && isValidUrl(searchQuery)
                    ? '#6366f1'
                    : '#666672'
                }
              />
              <TextInput
                className='flex-1 text-white ml-3 text-base'
                placeholder='Search or enter URL...'
                placeholderTextColor='#666672'
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                autoCapitalize='none'
                autoCorrect={false}
                returnKeyType='go'
              />
              {searchQuery.length > 0 && (
                <View className='flex-row items-center'>
                  {searchQuery.trim() && (
                    <View className='bg-primary-500/20 rounded-lg px-2 py-1 mr-2'>
                      <Text className='text-primary-400 text-xs font-medium'>
                        {isValidUrl(searchQuery) ? 'Go' : 'Search'}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name='close-circle' size={20} color='#666672' />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Content */}
        {recentDapps.length === 0 ? (
          <EmptyState />
        ) : (
          <View className='px-6 pb-6'>
            {/* Recent Section Header */}
            <View className='flex-row items-center justify-between mb-4'>
              <View className='flex-row items-center'>
                <Ionicons name='time-outline' size={20} color='#9ca3af' />
                <Text className='text-white text-lg font-semibold ml-2'>
                  Recent
                </Text>
              </View>
              {recentDapps.length > 0 && (
                <TouchableOpacity
                  onPress={clearRecentDapps}
                  className='flex-row items-center'
                >
                  <Text className='text-gray-500 text-sm'>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Recent Dapps List */}
            {recentDapps.map((dapp) => (
              <RecentDappCard key={dapp.id} dapp={dapp} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default Explore
