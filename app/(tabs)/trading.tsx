import { TokenCard } from '@/components/TokenCard'
import { TokenCardSkeleton } from '@/components/TokenCardSkeleton'
import { useTrendingInfinite } from '@/hooks/useTrending'
import { BirdEyeTrendingTokenItem } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Mock data
const marketStats = {
  totalMarketCap: '$2.18T',
  volume24h: '$124.5B',
  dominance: 'BTC: 49.2%',
  fearGreedIndex: 72,
}

const timeFrames = ['1H', '24H', '7D', '1M', '1Y']
const sortOptions = ['Market Cap', 'Volume', 'Price', 'Change']

const trendingCategories = [
  { name: 'DeFi', count: 45, change: '+12.3%' },
  { name: 'Meme', count: 128, change: '+34.7%' },
  { name: 'AI', count: 23, change: '+8.9%' },
  { name: 'Gaming', count: 67, change: '+5.2%' },
]

export default function TradingScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTimeFrame, setActiveTimeFrame] = useState('24H')
  const [activeSortOption, setActiveSortOption] = useState('Market Cap')
  const [refreshing, setRefreshing] = useState(false)

  // Use the trending hook with infinite scroll
  const {
    trending,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTrendingInfinite()

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }

  // Convert BirdEye tokens to format compatible with TokenCard
  const convertToken = (token: BirdEyeTrendingTokenItem) => ({
    address: token.address,
    decimals: token.decimals,
    balance: 0, // Not applicable for trending tokens
    uiAmount: token.marketcap, // Not applicable for trending tokens
    chainId: 'solana',
    name: token.symbol,
    symbol: 'MC',
    logoURI: token.logoURI,
    priceUsd: token.price,
    valueUsd: token.price,
    priceChange24h: token.price24hChangePercent,
    liquidity: token.liquidity,
  })

  // Filter tokens based on search query
  const filteredTokens =
    trending?.tokens.filter(
      (token) =>
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

  const CategoryCard = ({ category }: any) => (
    <TouchableOpacity className='bg-dark-200 rounded-2xl p-4 mr-3 w-32 active:scale-95'>
      <Text className='text-white font-semibold text-lg mb-2'>
        {category.name}
      </Text>
      <Text className='text-gray-400 text-sm mb-1'>
        {category.count} tokens
      </Text>
      <Text
        className={`text-sm font-medium ${
          category.change.includes('+') ? 'text-success-400' : 'text-danger-400'
        }`}
      >
        {category.change}
      </Text>
    </TouchableOpacity>
  )

  const renderToken = ({ item }: { item: BirdEyeTrendingTokenItem }) => (
    <TokenCard key={item.address} token={convertToken(item)} mc />
  )

  const renderFooter = () => {
    if (!isFetchingNextPage) return null
    return (
      <View className='py-4'>
        <TokenCardSkeleton count={3} />
      </View>
    )
  }

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-dark-50' edges={['top']}>
      <FlatList
        data={filteredTokens}
        renderItem={renderToken}
        keyExtractor={(item) => item.address}
        showsVerticalScrollIndicator={false}
        className='px-6'
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor='#6366f1'
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View className='flex-row items-center justify-between py-4'>
              <Text className='text-white text-2xl font-bold'>Trading</Text>
              <View className='flex-row space-x-3'>
                <TouchableOpacity className='w-10 h-10 bg-dark-200 rounded-full justify-center items-center'>
                  <Ionicons name='filter' size={20} color='#6366f1' />
                </TouchableOpacity>
                <TouchableOpacity className='w-10 h-10 bg-dark-200 rounded-full justify-center items-center'>
                  <Ionicons name='bookmark-outline' size={20} color='white' />
                </TouchableOpacity>
              </View>
            </View>

            {/* Search */}
            <View className='mb-6'>
              <TouchableOpacity
                className='bg-dark-200 rounded-2xl px-4 py-3 flex-row items-center'
                onPress={() => router.push('/(modals)/search')}
              >
                <Ionicons name='search' size={20} color='#666672' />
                <Text className='flex-1 text-gray-400 ml-3 text-lg'>
                  Search tokens...
                </Text>
              </TouchableOpacity>
            </View>

            {/* Time Frames */}
            {/* <View className='mb-6'>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className='flex-row gap-3'>
                  {timeFrames.map((timeFrame) => (
                    <TouchableOpacity
                      key={timeFrame}
                      onPress={() => setActiveTimeFrame(timeFrame)}
                      className={`px-4 py-2 rounded-xl ${
                        activeTimeFrame === timeFrame
                          ? 'bg-primary-500'
                          : 'bg-dark-200'
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          activeTimeFrame === timeFrame
                            ? 'text-white'
                            : 'text-gray-400'
                        }`}
                      >
                        {timeFrame}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View> */}

            {/* Trending Categories */}
            {/* <View className='mb-6'>
              <View className='flex-row items-center justify-between mb-4'>
                <Text className='text-white text-xl font-bold'>
                  Trending Categories
                </Text>
                <TouchableOpacity>
                  <Text className='text-primary-400 font-medium'>View All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={trendingCategories}
                renderItem={({ item }) => <CategoryCard category={item} />}
                horizontal
                showsHorizontalScrollIndicator={false}
                // contentContainerStyle={{ paddingHorizontal: 24 }}
              />
            </View> */}

            {/* Sort Options */}
            <View className='mb-4'>
              <View className='flex-row items-center justify-between'>
                <Text className='text-white text-xl font-bold'>Top Tokens</Text>
                {/* <View className='flex-row bg-dark-200 rounded-xl p-1'>
                  {sortOptions.slice(0, 2).map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setActiveSortOption(option)}
                      className={`px-3 py-2 rounded-lg ${
                        activeSortOption === option ? 'bg-primary-500' : ''
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          activeSortOption === option
                            ? 'text-white'
                            : 'text-gray-400'
                        }`}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View> */}
              </View>
            </View>

            {/* Loading state */}
            {isLoading && !trending && (
              <View className='px-6'>
                <TokenCardSkeleton count={5} />
              </View>
            )}

            {/* Error state */}
            {error && (
              <View className='mb-6'>
                <View className='bg-dark-200 rounded-2xl p-6 items-center'>
                  <Ionicons name='warning-outline' size={48} color='#ef4444' />
                  <Text className='text-gray-400 text-center mt-4'>
                    {error}
                  </Text>
                  <TouchableOpacity
                    onPress={() => refetch()}
                    className='mt-4 bg-primary-500 rounded-xl px-4 py-2'
                  >
                    <Text className='text-white font-medium'>Retry</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* No results for search */}
            {searchQuery &&
              filteredTokens.length === 0 &&
              !isLoading &&
              !error && (
                <View className='mb-6'>
                  <View className='bg-dark-200 rounded-2xl p-6 items-center'>
                    <Ionicons name='search-outline' size={48} color='#666672' />
                    <Text className='text-gray-400 text-center mt-4'>
                      No tokens found for "{searchQuery}"
                    </Text>
                  </View>
                </View>
              )}
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  )
}
