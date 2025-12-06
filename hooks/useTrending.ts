import { birdEyeRequests } from '@/libs/api_requests/birdeye.request'
import { useNetworkStore } from '@/store/networkStore'
import { useTrendingStore } from '@/store/trendingStore'
import { BirdEyeTrendingTokens } from '@/types'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

export function useTrending() {
  const { isOnline } = useNetworkStore()
  const {
    trending,
    isLoading: storeLoading,
    error: storeError,
    setTrending,
    setLoading,
    setError,
    hasNextPage,
    isFetchingNextPage,
    setFetchingNextPage,
    appendTrending,
  } = useTrendingStore()

  const {
    data,
    error,
    isLoading: queryLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ['trending-tokens'],
    queryFn: async (): Promise<BirdEyeTrendingTokens> => {
      // Check if offline before making request
      if (isOnline === false) {
        throw new Error('Device is offline - using cached data')
      }

      setLoading(true)
      setError(null)

      const response = await birdEyeRequests.trendingTokens({
        sort_by: 'rank',
        sort_type: 'asc',
        offset: 0,
        limit: 20,
        setLoading,
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch trending tokens')
      }

      // Update the store with the fetched data
      setTrending(response.data)
      return response.data
    },
    enabled: isOnline !== false, // Only enable when online
    staleTime: isOnline === false ? Infinity : 5 * 60 * 1000, // Never stale when offline
    gcTime: 10 * 60 * 1000, // Keep cached data for 10 minutes
    refetchInterval: isOnline === true ? 10 * 60 * 1000 : false, // Only refetch when online
    refetchIntervalInBackground: false,
    retry: (failureCount, error) => {
      if (isOnline === false) return false
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: isOnline === true,
    refetchOnReconnect: isOnline === true,
  })

  // Handle errors
  const hasError = isError || !!storeError
  const errorMessage = error?.message || storeError

  if (hasError && errorMessage) {
    setError(errorMessage)
  }

  return {
    trending: data || trending, // Use fresh data if available, fallback to stored data
    isLoading: queryLoading || storeLoading,
    isRefetching,
    error: errorMessage,
    refetch,
  }
}

export function useTrendingInfinite() {
  const { isOnline } = useNetworkStore()
  const {
    trending,
    isLoading: storeLoading,
    error: storeError,
    setTrending,
    setLoading,
    setError,
    hasNextPage,
    isFetchingNextPage,
    setFetchingNextPage,
    appendTrending,
  } = useTrendingStore()

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage: queryHasNextPage,
    isFetchingNextPage: queryIsFetchingNextPage,
    refetch,
    isRefetching,
    isError,
  } = useInfiniteQuery({
    queryKey: ['trending-tokens-infinite'],
    queryFn: async ({ pageParam = 0 }): Promise<BirdEyeTrendingTokens> => {
      // Check if offline before making request
      if (isOnline === false) {
        throw new Error('Device is offline - using cached data')
      }

      if (pageParam === 0) {
        setLoading(true)
      } else {
        setFetchingNextPage(true)
      }
      setError(null)

      const response = await birdEyeRequests.trendingTokens({
        sort_by: 'rank',
        sort_type: 'asc',
        offset: pageParam,
        limit: 20,
        setLoading: pageParam === 0 ? setLoading : undefined,
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch trending tokens')
      }

      // Update the store with the fetched data
      if (pageParam === 0) {
        setTrending(response.data)
      } else {
        appendTrending(response.data)
      }

      return response.data
    },
    enabled: isOnline !== false, // Only enable when online
    getNextPageParam: (lastPage, allPages) => {
      // If we got less than 20 tokens, there's no next page
      if (lastPage.tokens.length < 20) {
        return undefined
      }
      // Calculate the next offset
      return allPages.length * 20
    },
    initialPageParam: 0,
    staleTime: isOnline === false ? Infinity : 5 * 60 * 1000, // Never stale when offline
    gcTime: 10 * 60 * 1000, // Keep cached data for 10 minutes
    retry: (failureCount, error) => {
      if (isOnline === false) return false
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: isOnline === true,
    refetchOnReconnect: isOnline === true,
  })

  // Handle errors
  const hasError = isError || !!storeError
  const errorMessage = error?.message || storeError

  if (hasError && errorMessage) {
    setError(errorMessage)
  }

  // Flatten all pages into a single array
  const allTokens = data?.pages.flatMap((page) => page.tokens) || []
  const latestUpdate = data?.pages[0]

  const trendingData = latestUpdate
    ? {
        updateUnixTime: latestUpdate.updateUnixTime,
        updateTime: latestUpdate.updateTime,
        tokens: allTokens,
      }
    : trending

  return {
    trending: trendingData,
    isLoading: isLoading || storeLoading,
    isRefetching,
    error: errorMessage,
    refetch,
    fetchNextPage,
    hasNextPage: queryHasNextPage,
    isFetchingNextPage: queryIsFetchingNextPage || isFetchingNextPage,
  }
}
