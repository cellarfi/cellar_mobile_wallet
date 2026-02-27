/**
 * Single swap activity item from Tapestry swap activity API.
 */
export interface SwapActivityItem {
  id?: number
  transactionSignature?: string
  walletAddress?: string
  profileId?: string
  inputMint?: string
  outputMint?: string
  inputAmount?: number
  outputAmount?: number
  inputValueSOL?: number
  outputValueSOL?: number
  inputValueUSD?: number
  outputValueUSD?: number
  solPrice?: number
  timestamp?: number
  source?: string
  slippage?: number
  priorityFee?: number
  tradeType?: 'buy' | 'sell' | string
  platform?: string
  sourceWallet?: string
  sourceTransactionId?: string
  createdAt?: string
  updatedAt?: string
}

/**
 * Pagination/metadata for swap activity response.
 */
export interface SwapActivityMeta {
  total?: number
  hasMore?: boolean
  oldestTimestamp?: number
  newestTimestamp?: number
}

/**
 * Swap activity API response shape (data + meta).
 */
export interface SwapActivityResponse {
  data: SwapActivityItem[]
  meta: SwapActivityMeta
}
