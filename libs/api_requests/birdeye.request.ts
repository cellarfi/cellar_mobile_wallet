import {
  BirdEyeHistoricalPriceResponse,
  BirdEyeSearchResponse,
  BirdEyeTimePeriod,
  BirdEyeTokenOHLCV,
  BirdEyeTokenOverviewResponse,
  BirdEyeTrendingTokens,
  BirdEyeWalletPortfolio,
  BirdEyeWalletTransactionHistory,
} from '@/types'
import { apiResponse, httpRequest } from '../api.helpers'

export const birdEyeRequests = {
  /**
   * Get wallet portfolio
   * @param walletAddress - The address of the wallet to get the portfolio for
   * @param includePriceChange - Whether to include price change in the response
   * @description This endpoint returns the portfolio of a wallet, also note including includePriceChange will result 2 to credit as it different birdeye api call, use it wisely only when price change is needed
   * @returns The wallet portfolio
   */
  walletPortfolio: async (
    walletAddress: string,
    includePriceChange?: boolean,
    setLoading?: (loading: boolean) => void
  ) => {
    try {
      const res = await httpRequest(setLoading).get(
        `/wallet/portfolio/${walletAddress}`,
        {
          params: {
            includePriceChange,
          },
        }
      )

      return apiResponse<BirdEyeWalletPortfolio>(
        true,
        'Fetched wallet portfolio',
        res.data
      )
    } catch (err: any) {
      console.log('Error fetching wallet portfolio:', err?.response?.data)
      return apiResponse<BirdEyeWalletPortfolio>(
        false,
        err?.response?.data?.message || err?.message || 'Error occurred.',
        undefined
      )
    }
  },

  /**
   * @description Retrieve the transaction history of a wallet.
   * @param walletAddress - The address of the wallet to get the transaction history for
   * @returns The transaction history
   */
  walletHistory: async (
    walletAddress: string,
    setLoading?: (loading: boolean) => void
  ) => {
    try {
      const res = await httpRequest(setLoading).get(
        `/wallet/history/${walletAddress}`
      )

      return apiResponse<BirdEyeWalletTransactionHistory>(
        true,
        'Fetched wallet transaction history',
        res.data
      )
    } catch (err: any) {
      console.log(
        'Error fetching wallet transaction history:',
        err?.response?.data
      )
      return apiResponse<BirdEyeWalletTransactionHistory>(
        false,
        err?.response?.data?.message || err?.message || 'Error occurred.',
        undefined
      )
    }
  },

  /**
   * @description Retrieve stats of a specified token.
   * note: including includeLineChart and includeOHLCV will result 2 to credit as it different birdeye api call, use it wisely only when price change is needed
   * @param tokenAddress - The address of the token to get the overview for
   * @param includeLineChart - Whether to include the line chart in the response
   * @param includeOHLCV - Whether to include the OHLCV in the response
   * @returns The token overview
   */
  tokenOverview: async (
    tokenAddress: string,
    {
      includeLineChart,
      includeOHLCV,
      setLoading,
    }: {
      includeLineChart?: boolean
      includeOHLCV?: boolean
      setLoading?: (loading: boolean) => void
    }
  ) => {
    try {
      const res = await httpRequest(setLoading).get(
        `/token/overview/${tokenAddress}`,
        {
          params: {
            includeLineChart,
            includeOHLCV,
          },
        }
      )

      return apiResponse<BirdEyeTokenOverviewResponse>(
        true,
        'Fetched token overview',
        res.data
      )
    } catch (err: any) {
      console.log('Error fetching token overview:', err?.response?.data)
      return apiResponse<BirdEyeTokenOverviewResponse>(
        false,
        err?.response?.data?.message || err?.message || 'Error occurred.',
        undefined
      )
    }
  },

  historicalPrice: async (
    tokenAddress: string,
    {
      type,
      time_from,
      time_to,
      address_type,
      setLoading,
    }: {
      type?: BirdEyeTimePeriod
      time_from?: number
      time_to?: number
      address_type?: 'token' | 'pair'
      setLoading?: (loading: boolean) => void
    }
  ) => {
    try {
      const res = await httpRequest(setLoading).get(
        `/token/historical-price/${tokenAddress}`,
        {
          params: {
            type,
            time_from,
            time_to,
            address_type,
          },
        }
      )

      return apiResponse<BirdEyeHistoricalPriceResponse>(
        true,
        'Fetched historical price',
        res.data
      )
    } catch (err: any) {
      console.log('Error fetching historical price:', err?.response?.data)
      return apiResponse<BirdEyeHistoricalPriceResponse>(
        false,
        err?.response?.data?.message || err?.message || 'Error occurred.',
        undefined
      )
    }
  },

  tokenOHLCV: async (
    tokenAddress: string,
    {
      type,
      time_from,
      time_to,
      setLoading,
    }: {
      type?: BirdEyeTimePeriod
      time_from?: number
      time_to?: number
      setLoading?: (loading: boolean) => void
    }
  ) => {
    try {
      const res = await httpRequest(setLoading).get(
        `/token/ohlcv/${tokenAddress}`,
        {
          params: {
            type,
            time_from,
            time_to,
          },
        }
      )

      return apiResponse<BirdEyeTokenOHLCV>(
        true,
        'Fetched token OHLCV',
        res.data
      )
    } catch (err: any) {
      console.log('Error fetching token OHLCV:', err?.response?.data)
      return apiResponse<BirdEyeTokenOHLCV>(
        false,
        err?.response?.data?.message || err?.message || 'Error occurred.',
        undefined
      )
    }
  },

  /**
   * Search for a token
   * @param keyword - The keyword to search for
   * @description Search for tokens and market data by providing a name, symbol, token address, or market address.
   * @returns The search results
   */
  search: async (keyword: string, setLoading?: (loading: boolean) => void) => {
    try {
      const res = await httpRequest(setLoading).get(`/token/search`, {
        params: {
          keyword,
        },
      })

      return apiResponse<BirdEyeSearchResponse>(
        true,
        'Fetched search results',
        res.data
      )
    } catch (err: any) {
      console.log('Error fetching token report:', err?.response?.data)
      return apiResponse<BirdEyeSearchResponse>(
        false,
        err?.response?.data?.message || err?.message || 'Error occurred.',
        undefined
      )
    }
  },

  trendingTokens: async ({
    sort_by = 'rank',
    sort_type = 'asc',
    offset = 0,
    limit = 20,
    setLoading,
  }: {
    sort_by?: 'rank' | 'volume24hUSD' | 'liquidity'
    sort_type?: 'asc' | 'desc'
    offset?: number
    limit?: number
    setLoading?: (loading: boolean) => void
  }) => {
    try {
      const res = await httpRequest(setLoading).get(`/token/trending`, {
        params: {
          sort_by,
          sort_type,
          offset,
          limit,
        },
      })

      return apiResponse<BirdEyeTrendingTokens>(
        true,
        'Fetched trending tokens',
        res.data
      )
    } catch (err: any) {
      console.log('Error fetching token report:', err?.response?.data)
      return apiResponse<BirdEyeTrendingTokens>(
        false,
        err?.response?.data?.message || err?.message || 'Error occurred.',
        undefined
      )
    }
  },
}
