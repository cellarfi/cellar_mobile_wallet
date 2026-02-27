import {
  BirdEyeHistoricalPriceResponse,
  BirdEyeTimePeriod,
  BirdEyeTokenOHLCV,
  BirdEyeTokenOverview,
} from '@/types'
import { birdEyeRequests } from '@/utils/api_requests/birdeye.request'
import { getBirdeyeTimeParams } from '@/utils/birdeye.util'
import { Request, Response } from 'express'

export const getTokenOverview = async (
  req: Request<
    { tokenAddress: string },
    {},
    {},
    { includeLineChart: boolean; includeOHLCV: boolean }
  >,
  res: Response
): Promise<void> => {
  try {
    const { tokenAddress } = req.params
    const { includeOHLCV, includeLineChart } = req.query

    const tokenOverview = await birdEyeRequests.tokens.tokenOverview(
      tokenAddress
    )

    if (!tokenOverview.success) {
      res.status(500).json({
        success: false,
        message: tokenOverview.message,
      })
      return
    }

    const data: {
      tokenOverview: BirdEyeTokenOverview
      ohlcv?: BirdEyeTokenOHLCV
      lineChart?: BirdEyeHistoricalPriceResponse
    } = {
      tokenOverview: tokenOverview.data!,
    }

    if (Boolean(includeLineChart)) {
      const params = getBirdeyeTimeParams('1H')
      const historicalPrice = await birdEyeRequests.defi.historicalPrice({
        tokenAddress,
        type: '1H',
        time_from: params.time_from,
        time_to: params.time_to,
        address_type: 'token',
      })

      if (historicalPrice.success) {
        data.lineChart = historicalPrice.data
      }
    }

    if (Boolean(includeOHLCV)) {
      const params = getBirdeyeTimeParams('1H')
      const ohlcv = await birdEyeRequests.defi.tokenOHLCV({
        tokenAddress,
        type: '1H',
        currency: 'usd',
        time_from: params.time_from,
        time_to: params.time_to,
      })

      if (ohlcv.success) {
        data.ohlcv = ohlcv.data
      }
    }

    // Return the result
    res.json(data)
  } catch (err: any) {
    console.error('[getTokenOverview] Error:', err)
    res.status(500).json({
      success: false,
      error: err.message || 'An error occurred processing your swap request',
    })
  }
}

export const search = async (
  req: Request<{}, {}, {}, { keyword: string }>,
  res: Response
): Promise<void> => {
  try {
    const { keyword } = req.query

    const tokenOverview = await birdEyeRequests.utils.search({
      keyword,
    })

    if (!tokenOverview.success) {
      res.status(500).json({
        success: false,
        message: tokenOverview.message,
      })
      return
    }

    // Return the result
    res.json(tokenOverview.data)
  } catch (err: any) {
    console.error('[raydiumSwapHandler] Error:', err)
    res.status(500).json({
      success: false,
      error: err.message || 'An error occurred processing your swap request',
    })
  }
}

export const getHistoricalPrice = async (
  req: Request<
    { tokenAddress: string },
    {},
    {},
    {
      type: BirdEyeTimePeriod
      time_from: number
      time_to: number
      address_type: 'token' | 'pair'
    }
  >,
  res: Response
): Promise<void> => {
  try {
    const { tokenAddress } = req.params
    const { type, time_from, time_to, address_type } = req.query

    const params = getBirdeyeTimeParams(type || '1H')

    const tokenOverview = await birdEyeRequests.defi.historicalPrice({
      tokenAddress,
      type: type || '1H',
      time_from: time_from || params.time_from,
      time_to: time_to || params.time_to,
      address_type: address_type || 'token',
    })

    if (!tokenOverview.success) {
      res.status(500).json({
        success: false,
        message: tokenOverview.message,
      })
      return
    }

    // Return the result
    res.json(tokenOverview.data)
  } catch (err: any) {
    console.error('[raydiumSwapHandler] Error:', err)
    res.status(500).json({
      success: false,
      error: err.message || 'An error occurred processing your swap request',
    })
  }
}

export const getOHLCV = async (
  req: Request<
    { tokenAddress: string },
    {},
    {},
    {
      type: BirdEyeTimePeriod
      time_from: number
      time_to: number
    }
  >,
  res: Response
): Promise<void> => {
  try {
    const { tokenAddress } = req.params
    const { type, time_from, time_to } = req.query

    const params = getBirdeyeTimeParams(type || '1H')

    const tokenOverview = await birdEyeRequests.defi.tokenOHLCV({
      tokenAddress,
      type: type || '1H',
      currency: 'usd',
      time_from: time_from || params.time_from,
      time_to: time_to || params.time_to,
    })

    if (!tokenOverview.success) {
      res.status(500).json({
        success: false,
        message: tokenOverview.message,
      })
      return
    }

    // Return the result
    res.json(tokenOverview.data)
  } catch (err: any) {
    console.error('[raydiumSwapHandler] Error:', err)
    res.status(500).json({
      success: false,
      error: err.message || 'An error occurred processing your swap request',
    })
  }
}

export const getTrendingTokens = async (
  req: Request<
    {},
    {},
    {},
    {
      sort_by?: 'rank' | 'volume24hUSD' | 'liquidity'
      sort_type?: 'asc' | 'desc'
      offset?: number
      limit?: number
    }
  >,
  res: Response
): Promise<void> => {
  try {
    const { sort_by, sort_type, offset, limit } = req.query

    const trendingTokens = await birdEyeRequests.tokens.trendingTokens({
      sort_by: sort_by || 'rank',
      sort_type: sort_type || 'asc',
      offset: offset || 0,
      limit: limit || 20,
    })

    if (!trendingTokens.success) {
      res.status(500).json({
        success: false,
        message: trendingTokens.message,
      })
      return
    }

    // Return the result
    res.json(trendingTokens.data)
  } catch (err: any) {
    console.error('[getTokenOverview] Error:', err)
    res.status(500).json({
      success: false,
      error: err.message || 'An error occurred processing your swap request',
    })
  }
}
