import { birdEyeRequests } from '@/libs/api_requests/birdeye.request'
import { useAuthStore } from '@/store/authStore'
import { useNetworkStore } from '@/store/networkStore'
import { useTransactionsStore } from '@/store/transactionsStore'
import { BirdEyeTransaction } from '@/types'
import { Transaction, TransactionType } from '@/types/transaction.interface'
import { useQuery } from '@tanstack/react-query'

/**
 * Convert a BirdEye transaction to our app's Transaction format
 */
const convertBirdEyeTransaction = (tx: BirdEyeTransaction): Transaction => {
  // Determine the transaction type based on mainAction and balance changes
  let type: TransactionType = tx.mainAction as TransactionType

  // If the type is not valid, determine based on balance changes
  if (!['send', 'receive', 'swap', 'buy', 'sell'].includes(type)) {
    // Default to send
    type = 'send'
  }

  // Find the most significant token in the balance changes
  // This will be used as the main token for the transaction
  let mainToken = {
    symbol: 'SOL',
    amount: 0,
    decimals: 9,
    logoURI:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  }

  if (tx.balanceChange && tx.balanceChange.length > 0) {
    // Sort by absolute amount value to find the most significant token change
    const sortedChanges = [...tx.balanceChange].sort((a, b) => {
      const absA = Math.abs(a.amount) / Math.pow(10, a.decimals)
      const absB = Math.abs(b.amount) / Math.pow(10, b.decimals)
      return absB - absA
    })

    // Use the most significant token as the main token
    mainToken = sortedChanges[0]

    // If mainAction isn't set correctly, try to determine from balance changes
    if (type === 'send' && mainToken.amount > 0) {
      type = 'receive'
    } else if (type === 'receive' && mainToken.amount < 0) {
      type = 'send'
    }

    // If there are multiple tokens with significant changes, it might be a swap
    if (sortedChanges.length > 1) {
      const firstToken = sortedChanges[0]
      const secondToken = sortedChanges[1]

      // If one token decreases and another increases, it's likely a swap
      if (
        (firstToken.amount < 0 && secondToken.amount > 0) ||
        (firstToken.amount > 0 && secondToken.amount < 0)
      ) {
        type = 'swap'
      }
    }
  }

  // Convert timestamp from ISO string to number
  const timestamp = new Date(tx.blockTime).getTime()

  return {
    id: tx.txHash,
    type,
    symbol: mainToken.symbol,
    amount: Math.abs(
      Number(mainToken.amount) / Math.pow(10, mainToken.decimals)
    ),
    timestamp,
    status: tx.status ? 'completed' : 'failed',
    recipientAddress: tx.to,
    senderAddress: tx.from,
    fee: tx.fee / 1000000000, // Convert lamports to SOL
    logoURI: mainToken.logoURI, // Include the token logo URI
  }
}

export const useTransactions = () => {
  const { activeWallet } = useAuthStore()
  const { isOnline } = useNetworkStore()
  const {
    transactions: storeTransactions,
    isLoading: storeLoading,
    error: storeError,
    setTransactions,
    setLoading,
    setError,
  } = useTransactionsStore()

  // const walletAddress = '5QDwYS1CtHzN1oJ2eij8Crka4D2eJcUavMcyuvwNRM9'
  const walletAddress = activeWallet?.address

  const {
    data,
    error,
    isLoading: queryLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ['transactions', walletAddress],
    queryFn: async (): Promise<Transaction[]> => {
      if (!walletAddress) {
        throw new Error('No wallet address available')
      }

      // Check if offline before making request
      if (isOnline === false) {
        throw new Error('Device is offline - using cached data')
      }

      setLoading(true)
      setError(null)

      const response = await birdEyeRequests.walletHistory(
        walletAddress,
        setLoading
      )

      if (!response.success || !response.data) {
        throw new Error(
          response.message || 'Failed to fetch transaction history'
        )
      }

      // Convert BirdEye transactions to our app's transaction format
      const convertedTransactions =
        response.data.solana && response.data.solana.length > 0
          ? response.data.solana.map(convertBirdEyeTransaction)
          : []

      // Update the store with the fetched data
      setTransactions(convertedTransactions)

      return convertedTransactions
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
    transactions: data && !isError ? data : storeTransactions, // Use fresh data if available, fallback to stored data
    isLoading: queryLoading || storeLoading,
    isRefetching,
    error: errorMessage,
    refetch,
    hasWallet: !!walletAddress,
  }
}
