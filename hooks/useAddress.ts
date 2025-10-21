import { addressBookRequests } from '@/libs/api_requests/address-book.request'
import { useAddressStore } from '@/store/addressStore'
import { useAuthStore } from '@/store/authStore'
import { useNetworkStore } from '@/store/networkStore'
import { AddressBookEntry } from '@/types'
import { useQuery } from '@tanstack/react-query'

export function useAddress() {
  const { activeWallet } = useAuthStore()
  const { isOnline } = useNetworkStore()
  const {
    addresses,
    isLoading: storeLoading,
    error: storeError,
    setAddresses,
    setLoading,
    setError,
  } = useAddressStore()

  const walletAddress = activeWallet?.address

  const {
    data,
    error,
    isLoading: queryLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ['addresses', walletAddress],
    queryFn: async (): Promise<AddressBookEntry[]> => {
      if (!walletAddress) {
        throw new Error('No wallet address available')
      }

      // Check if offline before making request
      if (isOnline === false) {
        throw new Error('Device is offline - using cached data')
      }

      setLoading(true)
      setError(null)

      const response = await addressBookRequests.getAddressBook()

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch addresses')
      }

      // Update the store with the fetched data
      setAddresses(response.data)
      return response.data
    },
    enabled: false, // Don't auto-fetch - only fetch when refetch is called manually
    staleTime: isOnline === false ? Infinity : 30 * 1000, // Never stale when offline
    gcTime: 10 * 60 * 1000, // Keep cached data for 10 minutes
    refetchIntervalInBackground: false,
    retry: (failureCount, error) => {
      if (isOnline === false) return false
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Handle errors
  const hasError = isError || !!storeError
  const errorMessage = error?.message || storeError

  if (hasError && errorMessage) {
    setError(errorMessage)
  }

  return {
    addresses: data || addresses, // Use fresh data if available, fallback to stored data
    isLoading: queryLoading || storeLoading,
    isRefetching,
    error: errorMessage,
    refetch, // This is the manual refetch function
    hasWallet: !!walletAddress,
  }
}
