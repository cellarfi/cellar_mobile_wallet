import { birdEyeRequests } from '@/libs/api_requests/birdeye.request'
import { useAuthStore } from '@/store/authStore'
import { usePortfolioStore } from '@/store/portfolioStore'
import { BirdEyeWalletPortfolio } from '@/types'
import { useQuery } from '@tanstack/react-query'

export function usePortfolio() {
  const { activeWallet } = useAuthStore()
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
    enabled: !!walletAddress,
    staleTime: 30 * 1000, // 30 seconds

    // refetchInterval: 60 * 1000, // Refetch every 60 seconds
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
    portfolio: data || portfolio, // Use fresh data if available, fallback to stored data
    isLoading: queryLoading || storeLoading,
    isRefetching,
    error: errorMessage,
    refetch,
    hasWallet: !!walletAddress,
  }
}
