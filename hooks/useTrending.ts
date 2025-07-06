import { birdEyeRequests } from '@/libs/api_requests/birdeye.request'
import { useTrendingStore } from '@/store/trendingStore'
import { BirdEyeTrendingTokens } from '@/types'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

export function useTrending() {
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    refetchIntervalInBackground: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
    getNextPageParam: (lastPage, allPages) => {
      // If we got less than 20 tokens, there's no next page
      if (lastPage.tokens.length < 20) {
        return undefined
      }
      // Calculate the next offset
      return allPages.length * 20
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
