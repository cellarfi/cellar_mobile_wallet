import { birdEyeRequests } from '@/libs/api_requests/birdeye.request'
import { useAuthStore } from '@/store/authStore'
import { useNetworkStore } from '@/store/networkStore'
import { usePortfolioStore } from '@/store/portfolioStore'
import { BirdEyeWalletPortfolio } from '@/types'
import { useQuery } from '@tanstack/react-query'

export function usePortfolio() {
  const { activeWallet } = useAuthStore()
  const { isOnline } = useNetworkStore()
  const {
    portfolio,
    isLoading: storeLoading,
    error: storeError,
    setPortfolio,
    setLoading,
    setError,
  } = usePortfolioStore()

  const walletAddress = activeWallet?.address
  // const walletAddress = '5QDwYS1CtHzN1oJ2eij8Crka4D2eJcUavMcyuvwNRM9'

  const {
    data,
    error,
    isLoading: queryLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ['portfolio', walletAddress],
    queryFn: async (): Promise<BirdEyeWalletPortfolio> => {
      if (!walletAddress) {
        throw new Error('No wallet address available')
      }

      // Check if offline before making request
      if (isOnline === false) {
        throw new Error('Device is offline - using cached data')
      }

      setLoading(true)
      setError(null)

      const response = await birdEyeRequests.walletPortfolio(
        walletAddress,
        true, // includePriceChange
        setLoading
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch portfolio')
      }

      // Update the store with the fetched data
      setPortfolio(response.data)
      return response.data
    },
    enabled: !!walletAddress && isOnline !== false, // Only enable when online
    staleTime: isOnline === false ? Infinity : 30 * 1000, // Never stale when offline
    gcTime: 10 * 60 * 1000, // Keep cached data for 10 minutes
    // Disable retries when offline (handled by global config, but being explicit)
    retry: (failureCount, error) => {
      if (isOnline === false) return false
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Disable background refetch when offline
    refetchOnWindowFocus: isOnline === true,
    refetchOnReconnect: isOnline === true,
    refetchIntervalInBackground: false,
  })

  // Handle errors
  const hasError = isError || !!storeError
  const errorMessage = error?.message || storeError

  if (hasError && errorMessage) {
    setError(errorMessage)
  }

  return {
    portfolio: data || portfolio, // Use fresh data if available, fallback to stored data
    isLoading: queryLoading || storeLoading,
    isRefetching,
    error: errorMessage,
    refetch,
    hasWallet: !!walletAddress,
  }
}
