import { blurHashPlaceholder } from '@/constants/App'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

interface DApp {
  id: string
  name: string
  description: string
  url: string
  icon: string
  category: string
  isHot?: boolean
  verified?: boolean
  rating?: number
  users?: string
}

const categories = [
  { id: 'all', name: 'All', icon: 'apps' },
  { id: 'defi', name: 'DeFi', icon: 'trending-up' },
  { id: 'nft', name: 'NFTs', icon: 'image' },
  { id: 'gaming', name: 'Gaming', icon: 'game-controller' },
  { id: 'tools', name: 'Tools', icon: 'construct' },
  { id: 'social', name: 'Social', icon: 'people' },
]

const featuredDApps: DApp[] = [
  {
    id: '0',
    name: 'Airbills Pay',
    description: 'Pay your bills with crypto',
    url: 'https://app.airbillspay.com/',
    icon: 'https://app.airbillspay.com/favicon.ico',
    category: 'tools',
    isHot: true,
    verified: true,
    rating: 4.8,
    users: '1M+',
  },
  {
    id: '1',
    name: 'Jupiter',
    description: 'Best price swaps across all DEXs',
    url: 'https://jup.ag',
    icon: 'https://station.jup.ag/svg/jupiter-logo.svg',
    category: 'defi',
    isHot: true,
    verified: true,
    rating: 4.8,
    users: '1M+',
  },
  {
    id: '2',
    name: 'Magic Eden',
    description: 'Premier NFT marketplace',
    url: 'https://magiceden.io',
    icon: 'https://www.magiceden.io/img/favicon.png',
    category: 'nft',
    verified: true,
    rating: 4.6,
    users: '500K+',
  },
  {
    id: '3',
    name: 'Drift Protocol',
    description: 'Decentralized perpetuals trading',
    url: 'https://app.drift.trade',
    icon: 'https://app.drift.trade/icons/driftIconWhite.svg',
    category: 'defi',
    isHot: true,
    verified: true,
    rating: 4.7,
    users: '100K+',
  },
  {
    id: '4',
    name: 'Raydium',
    description: 'Automated market maker',
    url: 'https://raydium.io',
    icon: 'https://raydium.io/logo/logo-only-icon.svg',
    category: 'defi',
    verified: true,
    rating: 4.5,
    users: '800K+',
  },
]

const trendingDApps: DApp[] = [
  {
    id: '5',
    name: 'Phantom',
    description: 'Solana wallet in your browser',
    url: 'https://phantom.app',
    icon: 'https://phantom.app/img/phantom-icon-purple.png',
    category: 'tools',
    verified: true,
    rating: 4.9,
    users: '2M+',
  },
  {
    id: '6',
    name: 'Solscan',
    description: 'Solana blockchain explorer',
    url: 'https://solscan.io',
    icon: 'https://solscan.io/favicon.ico',
    category: 'tools',
    verified: true,
    rating: 4.4,
    users: '1.5M+',
  },
  {
    id: '7',
    name: 'Step Finance',
    description: 'Portfolio management dashboard',
    url: 'https://app.step.finance',
    icon: 'https://app.step.finance/favicon.ico',
    category: 'defi',
    verified: true,
    rating: 4.3,
    users: '200K+',
  },
  {
    id: '8',
    name: 'Tensor',
    description: 'Pro NFT trading platform',
    url: 'https://tensor.trade',
    icon: 'https://tensor.trade/favicon.ico',
    category: 'nft',
    isHot: true,
    verified: true,
    rating: 4.5,
    users: '150K+',
  },
]

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  // Helper function to validate URLs
  const isValidUrl = (string: string) => {
    const urlRegex =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i
    return urlRegex.test(string.trim())
  }
  const [recentlyVisited] = useState<DApp[]>([
    {
      id: 'recent1',
      name: 'Jupiter',
      description: 'Swapped SOL to USDC',
      url: 'https://jup.ag',
      icon: 'https://station.jup.ag/svg/jupiter-logo.svg',
      category: 'defi',
    },
    {
      id: 'recent2',
      name: 'Magic Eden',
      description: 'Browsed NFT collections',
      url: 'https://magiceden.io',
      icon: 'https://www.magiceden.io/img/favicon.png',
      category: 'nft',
    },
  ])

  const filteredDApps = [...featuredDApps, ...trendingDApps].filter((dapp) => {
    const matchesCategory =
      selectedCategory === 'all' || dapp.category === selectedCategory
    const matchesSearch =
      dapp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dapp.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const onRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) return

    if (isValidUrl(searchQuery)) {
      // Navigate to browser with URL
      router.push({
        pathname: '/(modals)/browser' as any,
        params: {
          url: searchQuery.startsWith('http')
            ? searchQuery
            : `https://${searchQuery}`,
        },
      })
    } else {
      // Open Google search for the query
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`
      router.push({
        pathname: '/(modals)/browser' as any,
        params: {
          url: googleSearchUrl,
          title: `Search: ${searchQuery.trim()}`,
        },
      })
    }
  }

  const openDApp = (dapp: DApp) => {
    router.push({
      pathname: '/(modals)/browser' as any,
      params: { url: dapp.url, title: dapp.name },
    })
  }

  const CategoryButton = ({
    category,
  }: {
    category: (typeof categories)[0]
  }) => (
    <TouchableOpacity
      className={`mr-3 px-4 py-2 rounded-xl ${
        selectedCategory === category.id ? 'bg-primary-500' : 'bg-dark-200'
      }`}
      onPress={() => setSelectedCategory(category.id)}
    >
      <View className='flex-row items-center'>
        <Ionicons
          name={category.icon as any}
          size={16}
          color={selectedCategory === category.id ? 'white' : '#666672'}
        />
        <Text
          className={`ml-2 font-medium ${
            selectedCategory === category.id ? 'text-white' : 'text-gray-400'
          }`}
        >
          {category.name}
        </Text>
      </View>
    </TouchableOpacity>
  )

  const FeaturedCard = ({ dapp }: { dapp: DApp }) => (
    <TouchableOpacity
      className='w-80 mr-4 bg-dark-200 rounded-3xl p-6 active:scale-95'
      onPress={() => openDApp(dapp)}
    >
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
        className='absolute inset-0 rounded-3xl'
      />
      <View className='flex-row items-center mb-4'>
        <View className='w-12 h-12 bg-white rounded-xl justify-center items-center mr-3 overflow-hidden'>
          <Image
            source={{ uri: dapp.icon }}
            style={{ width: 32, height: 32 }}
            placeholder={{ blurhash: blurHashPlaceholder }}
          />
        </View>
        <View className='flex-1'>
          <View className='flex-row items-center'>
            <Text className='text-white font-bold text-lg mr-2'>
              {dapp.name}
            </Text>
            {dapp.verified && (
              <Ionicons name='checkmark-circle' size={16} color='#22c55e' />
            )}
            {dapp.isHot && (
              <View className='bg-orange-500 px-2 py-1 rounded-full ml-2'>
                <Text className='text-white text-xs font-bold'>HOT</Text>
              </View>
            )}
          </View>
          <Text className='text-gray-400 text-sm'>{dapp.users} users</Text>
        </View>
      </View>
      <Text className='text-gray-300 text-sm mb-4 leading-5'>
        {dapp.description}
      </Text>
      <View className='flex-row items-center justify-between'>
        <View className='flex-row items-center'>
          <Ionicons name='star' size={14} color='#F9A826' />
          <Text className='text-gray-400 text-sm ml-1'>{dapp.rating}</Text>
        </View>
        <View className='bg-primary-500 px-4 py-2 rounded-xl'>
          <Text className='text-white font-medium text-sm'>Open</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  const DAppCard = ({ dapp }: { dapp: DApp }) => (
    <TouchableOpacity
      className='bg-dark-200 rounded-2xl p-4 mb-3 active:scale-95'
      onPress={() => openDApp(dapp)}
    >
      <View className='flex-row items-center'>
        <View className='w-12 h-12 bg-white rounded-xl justify-center items-center mr-3 overflow-hidden'>
          <Image
            source={{ uri: dapp.icon }}
            style={{ width: 32, height: 32 }}
            placeholder={{ blurhash: blurHashPlaceholder }}
          />
        </View>
        <View className='flex-1'>
          <View className='flex-row items-center mb-1'>
            <Text className='text-white font-semibold text-lg mr-2'>
              {dapp.name}
            </Text>
            {dapp.verified && (
              <Ionicons name='checkmark-circle' size={14} color='#22c55e' />
            )}
            {dapp.isHot && (
              <View className='bg-orange-500 px-2 py-1 rounded-full ml-1'>
                <Text className='text-white text-xs font-bold'>HOT</Text>
              </View>
            )}
          </View>
          <Text className='text-gray-400 text-sm mb-1'>{dapp.description}</Text>
          <View className='flex-row items-center'>
            <Ionicons name='star' size={12} color='#F9A826' />
            <Text className='text-gray-400 text-xs ml-1 mr-3'>
              {dapp.rating}
            </Text>
            <Text className='text-gray-500 text-xs'>{dapp.users} users</Text>
          </View>
        </View>
        <Ionicons name='chevron-forward' size={20} color='#666672' />
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView className='flex-1 bg-dark-50' edges={['top']}>
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
      >
        {/* Header */}
        <View className='flex-row items-center justify-between px-6 py-4'>
          <View>
            <Text className='text-white text-2xl font-bold'>Explore</Text>
            <Text className='text-gray-400 text-sm'>
              Discover amazing DApps
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(modals)/browser' as any)}
            className='w-10 h-10 bg-dark-200 rounded-full justify-center items-center'
          >
            <Ionicons name='add' size={20} color='#6366f1' />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className='px-6 mb-6'>
          <View className='bg-dark-200 rounded-2xl px-4 py-3 flex-row items-center'>
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
              className='flex-1 text-white ml-3 text-lg'
              placeholder='Search DApps, enter URL, or search Google...'
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
                {/* Show what will happen when user hits enter */}
                {searchQuery.trim() && (
                  <View className='bg-dark-300 rounded-lg px-2 py-1 mr-2'>
                    <Text className='text-gray-400 text-xs'>
                      {isValidUrl(searchQuery) ? 'Browse' : 'Search'}
                    </Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name='close-circle' size={20} color='#666672' />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Categories */}
        <View className='mb-6'>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className='px-6'
          >
            {categories.map((category) => (
              <CategoryButton key={category.id} category={category} />
            ))}
          </ScrollView>
        </View>

        {/* Featured DApps */}
        <View className='mb-6'>
          <View className='flex-row items-center justify-between px-6 mb-4'>
            <Text className='text-white text-xl font-bold'>Featured</Text>
            <TouchableOpacity>
              <Text className='text-primary-400 font-medium'>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className='px-6'
          >
            {featuredDApps.map((dapp) => (
              <FeaturedCard key={dapp.id} dapp={dapp} />
            ))}
          </ScrollView>
        </View>

        {/* Recently Visited */}
        {recentlyVisited.length > 0 && (
          <View className='px-6 mb-6'>
            <Text className='text-white text-xl font-bold mb-4'>
              Recently Visited
            </Text>
            <View className='flex-row'>
              {recentlyVisited.map((dapp) => (
                <TouchableOpacity
                  key={dapp.id}
                  className='bg-dark-200 rounded-2xl p-4 mr-3 items-center w-24'
                  onPress={() => openDApp(dapp)}
                >
                  <View className='w-12 h-12 bg-white rounded-xl justify-center items-center mb-2 overflow-hidden'>
                    <Image
                      source={{ uri: dapp.icon }}
                      style={{ width: 32, height: 32 }}
                      placeholder={{ blurhash: blurHashPlaceholder }}
                    />
                  </View>
                  <Text
                    className='text-white text-xs font-medium text-center'
                    numberOfLines={1}
                  >
                    {dapp.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* All DApps */}
        <View className='px-6 mb-6'>
          <Text className='text-white text-xl font-bold mb-4'>
            {selectedCategory === 'all'
              ? 'All DApps'
              : categories.find((c) => c.id === selectedCategory)?.name}
          </Text>
          {filteredDApps.map((dapp) => (
            <DAppCard key={dapp.id} dapp={dapp} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Explore
