import { useCluster } from '@/contexts/ClusterProvider'
import { apiResponse } from '@/libs/api.helpers'
import {
  ASSET_FILTER_OPTIONS,
  auraRequests,
} from '@/libs/api_requests/aura.request'
import { useAssetsStore } from '@/store/assetsStore'
import { useAuthStore } from '@/store/authStore'
import {
  DasApiAsset,
  DasApiAssetList,
} from '@metaplex-foundation/digital-asset-standard-api'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'

/**
 * Hook for fetching and managing NFT assets
 */
export function useAssets() {
  const { activeWallet } = useAuthStore()
  const {
    assets,
    isLoading: storeLoading,
    error: storeError,
    setAssets,
    setLoading,
    setError,
  } = useAssetsStore()
  const { selectedCluster } = useCluster()

  // State for pagination and filtering
  const limit = 20
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  // Track which filter is active
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [filteredAssets, setFilteredAssets] = useState<DasApiAsset[]>([])

  // For development/testing - replace with actual wallet address in production
  const walletAddress = activeWallet?.address
  // const walletAddress = '5QDwYS1CtHzN1oJ2eij8Crka4D2eJcUavMcyuvwNRM9'

  // Track if this is the initial query or not
  const [isInitialQuery, setIsInitialQuery] = useState(true)

  // Track accumulated assets for pagination
  const [accumulatedAssets, setAccumulatedAssets] = useState<DasApiAsset[]>([])

  const {
    data,
    error,
    isLoading: queryLoading,
    refetch: reactQueryRefetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ['nftAssets', walletAddress, limit, cursor],
    queryFn: async (): Promise<DasApiAssetList> => {
      if (!walletAddress) {
        throw new Error('No wallet address available')
      }

      setLoading(true)
      setError(null)

      // Flag to determine if this is a loadMore operation
      const isLoadingMore = !!cursor

      const response = await auraRequests.getAssetsByOwner(
        walletAddress,
        'https://api.mainnet-beta.solana.com',
        {
          limit,
          cursor,
          isLoadingMore,
        }
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch NFT assets')
      }

      const fetchedAssets = response.data

      // Handle pagination - append to accumulated assets if loading more
      if (
        isLoadingMore &&
        fetchedAssets &&
        fetchedAssets.items &&
        fetchedAssets.items.length > 0
      ) {
        // Create a new accumulated list avoiding duplicates by ID
        const existingIds = new Set(accumulatedAssets.map((asset) => asset.id))
        const newUniqueAssets = fetchedAssets.items.filter(
          (asset) => !existingIds.has(asset.id)
        )

        const updatedAccumulatedAssets = [
          ...accumulatedAssets,
          ...newUniqueAssets,
        ]
        setAccumulatedAssets(updatedAccumulatedAssets)

        // Create a merged result with all accumulated assets
        const mergedResult = {
          ...fetchedAssets,
          items: updatedAccumulatedAssets,
          total: updatedAccumulatedAssets.length,
        }

        setAssets(mergedResult)

        // Apply client-side filtering to all accumulated assets
        applyFilter(updatedAccumulatedAssets, activeFilter)

        // Return the merged result with all assets
        return mergedResult
      }

      // Initial load or filter change - reset accumulated assets
      else if (
        !isLoadingMore &&
        fetchedAssets &&
        fetchedAssets.items &&
        fetchedAssets.items.length > 0
      ) {
        // Reset accumulated assets with the new query
        setAccumulatedAssets(fetchedAssets.items)
        setAssets(fetchedAssets)

        // Apply client-side filtering
        applyFilter(fetchedAssets.items, activeFilter)
      }
      // No new data but have accumulated assets - keep using those
      else if (accumulatedAssets && accumulatedAssets.length > 0) {
        // If no new data returned, keep using the accumulated assets
        applyFilter(accumulatedAssets, activeFilter)

        // Create a compatible result structure
        return {
          items: accumulatedAssets,
          total: accumulatedAssets.length,
          limit: limit,
          cursor: data?.cursor || null,
        }
      }
      // Mark initial query as complete
      if (isInitialQuery) {
        setIsInitialQuery(false)
      }

      return fetchedAssets || assets
    },
    enabled: !!walletAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
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

  // Apply filter to the assets
  const applyFilter = useCallback(
    (items: DasApiAsset[] = [], filterKey: string) => {
      const filterOption =
        ASSET_FILTER_OPTIONS.find((f) => f.key === filterKey) ||
        ASSET_FILTER_OPTIONS[0]

      // Ensure items is an array before filtering
      const itemsArray = Array.isArray(items) ? items : []

      // Apply the filter function to each asset
      const filtered = itemsArray.filter((asset) => {
        try {
          return filterOption.filter(asset)
        } catch (e) {
          console.error('Error filtering asset:', e)
          return false
        }
      })

      setFilteredAssets(filtered)
    },
    [ASSET_FILTER_OPTIONS] // Add dependency on filter options
  )

  // Handle filter change
  const changeFilter = (filterKey: string) => {
    if (filterKey !== activeFilter) {
      setActiveFilter(filterKey)

      // If we have accumulated assets, apply the filter to them
      if (accumulatedAssets && accumulatedAssets.length > 0) {
        applyFilter(accumulatedAssets, filterKey)
      } else if (assets?.items && assets.items.length > 0) {
        // Try using assets.items as fallback
        setAccumulatedAssets(assets.items)
        applyFilter(assets.items, filterKey)
      } else {
        // Otherwise use what we have
        const emptyAssets: DasApiAsset[] = []
        applyFilter(emptyAssets, filterKey)
      }
    }
  }

  // Effect to update the client-side filtering based on active filter
  useEffect(() => {
    // Apply filter to all accumulated assets when filter changes
    if (accumulatedAssets && accumulatedAssets.length > 0) {
      applyFilter(accumulatedAssets, activeFilter)
    }
  }, [activeFilter, applyFilter, accumulatedAssets])

  // Create a stable refetch function that preserves data
  const refetch = useCallback(async () => {
    // If we already have data and this isn't the first query,
    // make sure we don't lose our data during refetching
    if (!isInitialQuery && assets?.items && assets.items.length > 0) {
      setLoading(true)
      try {
        const result = await reactQueryRefetch()
        return result
      } finally {
        setLoading(false)
      }
    } else {
      return await reactQueryRefetch()
    }
  }, [reactQueryRefetch, isInitialQuery, assets, setLoading])

  // Track if loadMore is in progress to prevent duplicate calls
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Load more assets (pagination)
  const loadMore = useCallback(() => {
    // Prevent concurrent loadMore calls
    if (isLoadingMore || isRefetching || queryLoading || !data?.cursor) {
      return
    }

    setIsLoadingMore(true)

    // Make sure cursor is properly typed as a string
    const cursorValue =
      typeof data.cursor === 'string'
        ? data.cursor
        : Object.keys(data.cursor).length === 0
          ? undefined
          : String(data.cursor)

    // Store current assets in case of refetch issues
    const currentAssets = [...accumulatedAssets]

    // Set the cursor for the next page
    setCursor(cursorValue)

    // Call refetch to load the next page
    refetch()
      .then(() => {
        // Successfully loaded more assets
        setIsLoadingMore(false)
      })
      .catch(() => {
        // If refetch fails, restore the accumulated assets
        setAccumulatedAssets(currentAssets)
        setIsLoadingMore(false)
      })
  }, [
    data?.cursor,
    isRefetching,
    queryLoading,
    refetch,
    accumulatedAssets,
    isLoadingMore,
  ])

  // Handle sending an NFT
  const sendNFT = async (assetId: string, toAddress: string) => {
    if (!walletAddress) {
      throw new Error('No wallet address available')
    }

    // TODO: Implement actual send NFT logic
    return apiResponse(true, 'NFT sent successfully', {
      transactionId: `mock_tx_${Date.now()}`,
      assetId,
      from: walletAddress,
      to: toAddress,
      timestamp: new Date().toISOString(),
    })
  }

  // Prevent accumulatedAssets from being lost during renders
  useEffect(() => {
    // If we have filteredAssets but no accumulated assets, restore from assets
    if (
      (!accumulatedAssets || accumulatedAssets.length === 0) &&
      assets?.items &&
      assets.items.length > 0
    ) {
      setAccumulatedAssets(assets.items)
      // Also apply the filter to these restored assets
      applyFilter(assets.items, activeFilter)
    }
  }, [assets, accumulatedAssets, activeFilter, applyFilter])

  // Helper function to find an asset by ID in accumulated assets
  const getAssetById = useCallback(
    (id: string): DasApiAsset | undefined => {
      // First check accumulated assets
      const asset = accumulatedAssets.find((asset) => asset.id === id)
      if (asset) return asset

      // If not found in accumulated, check original assets data
      return assets?.items?.find((asset) => asset.id === id)
    },
    [accumulatedAssets, assets]
  )

  // Return the final object with all necessary data
  return {
    assets:
      filteredAssets.length > 0 ? filteredAssets : accumulatedAssets || [], // Use accumulated if filter is returning zero
    getAssetById,
    totalAssets: accumulatedAssets.length,
    loading: queryLoading || storeLoading,
    isRefetching,
    isError,
    error,
    loadMore,
    refetch,
    activeFilter,
    sendNFT,
    hasMore: !!data?.cursor,
    changeFilter,
  }
}
