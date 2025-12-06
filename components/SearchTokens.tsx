import CustomTextInput from '@/components/ui/CustomTextInput'
import { blurHashPlaceholder } from '@/constants/App'
import { useTrending } from '@/hooks/useTrending'
import { birdEyeRequests } from '@/libs/api_requests/birdeye.request'
import { NATIVE_SOL_MINT, WRAPPED_SOL_MINT } from '@/libs/solana.lib'
import { isValidUrl } from '@/libs/string.helpers'
import { BirdEyeSearchItem, BirdEyeSearchTokenResult } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import React, { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

interface SearchResult {
  address: string
  name: string
  symbol: string
  logoURI: string
  price: number
  priceChange24h: number
  marketCap: number
  verified: boolean
  rank?: number
}

interface SearchTokensProps {
  mode?: 'navigate' | 'select'
  onTokenSelect?: (token: SearchResult) => void
  onUrlDetected?: (url: string) => void
  title?: string
  placeholder?: string
}

export default function SearchTokens({
  mode = 'navigate',
  onTokenSelect,
  onUrlDetected,
  title = 'Search Tokens',
  placeholder = 'Search tokens or enter URL...',
}: SearchTokensProps) {
  const { trending } = useTrending()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debounceTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  // Handle URL submission (when user presses enter or submits)
  const handleUrlSubmit = () => {
    if (!searchQuery.trim()) return

    if (isValidUrl(searchQuery.trim())) {
      let finalUrl = searchQuery.trim()

      // Add https:// if no protocol is specified
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl
      }

      // Call the URL handler if provided
      onUrlDetected?.(finalUrl)
    } else {
      // If not a URL, perform regular token search
      performSearch(searchQuery)
    }
  }

  // Convert trending tokens to SearchResult format
  const trendingTokensForSearch = useMemo(() => {
    if (!trending?.tokens) return []

    return trending.tokens.map((token) => ({
      address: token.address,
      name: token.name,
      symbol: token.symbol,
      logoURI: token.logoURI,
      price: token.price,
      priceChange24h: token.price24hChangePercent || 0,
      marketCap: token.marketcap,
      verified: true,
      rank: token.rank,
    }))
  }, [trending])

  // Sort tokens by verified status (verified first) and then by rank/market cap
  const sortTokens = useCallback((tokens: SearchResult[]) => {
    return tokens.sort((a, b) => {
      // First, sort by verified status (verified tokens first)
      if (a.verified && !b.verified) return -1
      if (!a.verified && b.verified) return 1

      // If both are verified or both are not verified, sort by rank (if available) or market cap
      if (a.rank && b.rank) {
        return a.rank - b.rank
      }

      // If no rank, sort by market cap (higher first)
      return b.marketCap - a.marketCap
    })
  }, [])

  // Determine what to show: search results or trending tokens
  const tokensToShow = useMemo(() => {
    if (searchQuery.trim()) {
      return sortTokens(searchResults) // Show sorted search results when actively searching
    }
    return sortTokens(trendingTokensForSearch) // Show sorted trending tokens by default
  }, [searchQuery, searchResults, trendingTokensForSearch, sortTokens])

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await birdEyeRequests.search(query.trim(), setIsLoading)

      if (response.success && response.data) {
        // Filter for token results only
        const tokenItems = response.data.items.filter(
          (item: BirdEyeSearchItem) => item.type === 'token'
        )

        // Flatten all token results from all token items
        const allTokens: SearchResult[] = []
        tokenItems.forEach((item: BirdEyeSearchItem) => {
          item.result.forEach((token: BirdEyeSearchTokenResult) => {
            // Check if this is wrapped SOL and replace with native SOL
            const isWrappedSol = token.address === WRAPPED_SOL_MINT

            allTokens.push({
              address: isWrappedSol ? NATIVE_SOL_MINT : token.address,
              name: isWrappedSol ? 'SOL' : token.name,
              symbol: isWrappedSol ? 'SOL' : token.symbol,
              logoURI: token.logo_uri,
              price: token.price,
              priceChange24h: token.price_change_24h_percent,
              marketCap: token.market_cap,
              verified: token.verified,
            })
          })
        })

        setSearchResults(allTokens)
      } else {
        setError(response.message || 'Search failed')
        setSearchResults([])
      }
    } catch (err: any) {
      console.error('Search error:', err)
      setError('An error occurred while searching')
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSearchChange = (text: string) => {
    setSearchQuery(text)

    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    // Check if it's a valid URL - if so, don't auto-search, wait for user to submit
    if (isValidUrl(text.trim())) {
      // Don't perform token search for URLs, let user press enter to navigate
      setSearchResults([])
      setError(null)
      setIsLoading(false)
      return
    }

    // Set new timeout for debounced search (only for non-URLs)
    debounceTimeout.current = setTimeout(() => {
      performSearch(text)
    }, 500)
  }

  const handleTokenPress = (token: SearchResult) => {
    onTokenSelect?.(token)
  }

  const renderToken = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      className='bg-secondary-light rounded-2xl p-4 mb-3 active:scale-95'
      onPress={() => handleTokenPress(item)}
    >
      <View className='flex-row items-center'>
        {/* Rank Badge for Trending Tokens */}
        {!searchQuery.trim() && item.rank && (
          <View className='w-8 h-8 bg-primary-900 rounded-full justify-center items-center mr-3'>
            <Text className='text-primary-400 text-xs font-bold'>
              #{item.rank}
            </Text>
          </View>
        )}

        {/* Token Logo */}
        <View className='w-12 h-12 bg-primary-500/20 rounded-full justify-center items-center mr-3 overflow-hidden'>
          {item.logoURI ? (
            <Image
              source={{ uri: item.logoURI }}
              style={{ width: 48, height: 48, borderRadius: 24 }}
              placeholder={{ blurhash: blurHashPlaceholder }}
            />
          ) : (
            <Text className='text-lg font-bold text-primary-400'>
              {item.symbol?.charAt(0) || '?'}
            </Text>
          )}
        </View>

        {/* Token Info */}
        <View className='flex-1'>
          <View className='flex-row items-center mb-1'>
            <Text className='text-white font-semibold text-lg mr-2'>
              {item.symbol}
            </Text>
            {item.verified && (
              <Ionicons name='checkmark-circle' size={16} color='#22c55e' />
            )}
          </View>
          <Text className='text-gray-400 text-sm' numberOfLines={1}>
            {item.name}
          </Text>
        </View>

        {/* Price Info */}
        <View className='items-end'>
          <Text className='text-white font-semibold text-lg mb-1'>
            ${item?.price?.toFixed(item?.price >= 1 ? 2 : 6) || '0.00'}
          </Text>
          <Text
            className={`text-sm font-medium ${
              item.priceChange24h >= 0 ? 'text-success-400' : 'text-danger-400'
            }`}
          >
            {item.priceChange24h >= 0 ? '+' : ''}
            {item?.priceChange24h?.toFixed(2) || '0.00'}%
          </Text>
        </View>
      </View>

      {/* Market Cap */}
      <View className='flex-row justify-between items-center mt-3 pt-3 border-t border-dark-300'>
        <Text className='text-gray-400 text-sm'>Market Cap</Text>
        <Text className='text-gray-300 text-sm'>
          $
          {item.marketCap >= 1e9
            ? `${(item.marketCap / 1e9)?.toFixed(2) || '0.00'}B`
            : item.marketCap >= 1e6
              ? `${(item.marketCap / 1e6)?.toFixed(2)}M`
              : item.marketCap >= 1e3
                ? `${(item.marketCap / 1e3)?.toFixed(2) || '0.00'}K`
                : item.marketCap?.toFixed(2) || '0.00'}
        </Text>
      </View>
    </TouchableOpacity>
  )

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View className='items-center py-12'>
          <ActivityIndicator size='large' color='#6366f1' />
          <Text className='text-gray-400 mt-4'>
            {searchQuery.trim()
              ? 'Searching tokens...'
              : 'Loading trending tokens...'}
          </Text>
        </View>
      )
    }

    if (error) {
      return (
        <View className='items-center py-12'>
          <Ionicons name='warning-outline' size={48} color='#ef4444' />
          <Text className='text-white text-lg font-semibold mt-4'>
            Search Error
          </Text>
          <Text className='text-gray-400 text-center mt-2'>{error}</Text>
          <TouchableOpacity
            onPress={() => performSearch(searchQuery)}
            className='mt-4 bg-primary-500 rounded-xl px-4 py-2'
          >
            <Text className='text-white font-medium'>Retry</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (searchQuery.trim() && searchResults.length === 0) {
      // Check if it's a valid URL
      if (isValidUrl(searchQuery.trim())) {
        return (
          <View className='items-center py-12'>
            <Ionicons name='globe-outline' size={48} color='#6366f1' />
            <Text className='text-white text-lg font-semibold mt-4'>
              Ready to Browse
            </Text>
            <Text className='text-gray-400 text-center mt-2 mb-4'>
              Press Enter or tap &quot;Open&quot; to navigate to:
            </Text>
            <Text className='text-primary-400 text-center font-mono text-sm mb-6'>
              {searchQuery.startsWith('http')
                ? searchQuery
                : `https://${searchQuery}`}
            </Text>
            <TouchableOpacity
              onPress={handleUrlSubmit}
              className='bg-primary-500 rounded-2xl px-6 py-3'
            >
              <Text className='text-white font-medium'>Open in Browser</Text>
            </TouchableOpacity>
          </View>
        )
      }

      return (
        <View className='items-center py-12'>
          <Ionicons name='search-outline' size={48} color='#666672' />
          <Text className='text-white text-lg font-semibold mt-4'>
            No Results Found
          </Text>
          <Text className='text-gray-400 text-center mt-2'>
            No tokens found for &quot;{searchQuery}&quot;
          </Text>
        </View>
      )
    }

    if (!searchQuery.trim()) {
      // No search query - check if we have trending tokens
      if (!trending?.tokens || trending.tokens.length === 0) {
        return (
          <View className='items-center py-12'>
            <Ionicons name='trending-up' size={48} color='#666672' />
            <Text className='text-white text-lg font-semibold mt-4'>
              Trending Tokens
            </Text>
            <Text className='text-gray-400 text-center mt-2'>
              Trending tokens will appear here
            </Text>
          </View>
        )
      }
      // If we have trending tokens, they'll be shown in the main list
      return null
    }

    return null
  }

  return (
    <View className='flex-1'>
      {/* Search Bar */}
      <View className='px-6 mb-4'>
        <CustomTextInput
          value={searchQuery}
          onChangeText={handleSearchChange}
          onSubmitEditing={handleUrlSubmit}
          autoFocus
          placeholder={placeholder}
          icon='search'
          autoCapitalize='none'
          autoCorrect={false}
          returnKeyType='go'
          isSearch
        />
      </View>

      {/* Results */}
      <View className='flex-1 px-6'>
        {/* Section Header */}
        {!isLoading && tokensToShow.length > 0 && (
          <View className='mb-3'>
            <View className='flex-row items-center justify-between'>
              <Text className='text-gray-400 text-sm font-medium'>
                {searchQuery.trim()
                  ? isValidUrl(searchQuery.trim())
                    ? 'Tokens • Enter URL to browse'
                    : 'Search Results'
                  : 'Trending Tokens'}
                {searchQuery.trim() && !isValidUrl(searchQuery.trim()) && (
                  <Text className='text-gray-500'> • Verified first</Text>
                )}
              </Text>
              {!searchQuery.trim() && trending?.updateTime && (
                <Text className='text-gray-500 text-xs'>
                  Updated{' '}
                  {new Date(trending.updateTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              )}
            </View>
          </View>
        )}

        {tokensToShow.length > 0 ? (
          <FlatList
            data={tokensToShow}
            renderItem={renderToken}
            keyExtractor={(item) => item.address}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </View>
  )
}
