import { birdEyeRequests } from '@/libs/api_requests/birdeye.request'
import { usePortfolioStore } from '@/store/portfolioStore'
import { useTokenStore } from '@/store/tokenStore'
import { BirdEyeTokenItem, BirdEyeTokenOverviewResponse } from '@/types'
import NetInfo from '@react-native-community/netinfo'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

export function useTokenOverview(tokenAddress: string) {
  const [isOnline, setIsOnline] = useState(true)
  const {
    tokens,
    setToken,
    setTokenLoading,
    setTokenError,
    getToken,
    isTokenLoading,
    getTokenError,
  } = useTokenStore()

  const { portfolio } = usePortfolioStore()

  // Check network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected || false)
    })
    return unsubscribe
  }, [])

  // Find user's holding of this token
  const userHolding: BirdEyeTokenItem | null =
    portfolio?.items?.find((item) => item.address === tokenAddress) || null

  const {
    data,
    error,
    isLoading: queryLoading,
    refetch,
    isRefetching,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ['tokenOverview', tokenAddress],
    queryFn: async (): Promise<BirdEyeTokenOverviewResponse> => {
      if (!tokenAddress) {
        throw new Error('No token address provided')
      }

      // Only set loading for initial loads, not for background refetches
      const storedToken = getToken(tokenAddress)
      if (!storedToken) {
        setTokenLoading(tokenAddress, true)
      }
      setTokenError(tokenAddress, null)

      const response = await birdEyeRequests.tokenOverview(tokenAddress, {
        setLoading: undefined, // Don't use the API's loading state for UI
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch token overview')
      }

      // Update the store with the fetched data while preserving existing chart data
      const existingToken = getToken(tokenAddress)
      const updatedToken = {
        ...response.data,
        // Preserve existing chart data if it exists
        ...(existingToken?.ohlcv && { ohlcv: existingToken.ohlcv }),
        ...(existingToken?.lineChart && { lineChart: existingToken.lineChart }),
      }

      setToken(tokenAddress, updatedToken)
      setTokenLoading(tokenAddress, false)
      return updatedToken
    },
    enabled: !!tokenAddress && isOnline,
    staleTime: 30 * 1000, // 30 seconds
    // refetchInterval: isOnline ? 60 * 1000 : false, // Refetch every 60 seconds if online
    refetchIntervalInBackground: false,
    retry: (failureCount, error) => {
      // Don't retry if offline
      if (!isOnline) return false
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Get stored token data
  const storedToken = getToken(tokenAddress)
  const isStoreLoading = isTokenLoading(tokenAddress)
  const storeError = getTokenError(tokenAddress)

  // Handle errors
  const hasError = isError || !!storeError
  const errorMessage = error?.message || storeError

  if (hasError && errorMessage) {
    setTokenError(tokenAddress, errorMessage)
    setTokenLoading(tokenAddress, false) // Clear loading state on error
  }

  // Determine what data to return - only show loading for initial loads
  const tokenData = data || storedToken
  const loading = (queryLoading && !tokenData) || (isStoreLoading && !tokenData)

  // If offline and no stored data, show offline error
  const showOfflineError = !isOnline && !tokenData && !loading

  return {
    token: tokenData,
    userHolding,
    isLoading: loading,
    isRefetching,
    error: showOfflineError
      ? 'No internet connection. Please check your connection and try again.'
      : errorMessage,
    refetch,
    isOnline,
    hasStoredData: !!storedToken,
    showOfflineError,
  }
}
