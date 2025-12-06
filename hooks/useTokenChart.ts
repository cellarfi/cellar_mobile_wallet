import { birdEyeRequests } from '@/libs/api_requests/birdeye.request'
import { useNetworkStore } from '@/store/networkStore'
import { useTokenStore } from '@/store/tokenStore'
import { BirdEyeTimePeriod } from '@/types'
import { useMutation } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'

export type ChartType = 'line' | 'candlestick'

export function useTokenChart(tokenAddress: string) {
  const { isOnline } = useNetworkStore()
  const [chartType, setChartType] = useState<ChartType>('candlestick')
  const [activeTimeFrame, setActiveTimeFrame] =
    useState<BirdEyeTimePeriod>('1H')

  const { getToken, setToken } = useTokenStore()

  // Get current token data
  const tokenData = getToken(tokenAddress)

  // OHLCV mutation for candlestick chart
  const ohlcvMutation = useMutation({
    mutationFn: async ({ timeFrame }: { timeFrame: BirdEyeTimePeriod }) => {
      // Check if offline before making request
      if (isOnline === false) {
        throw new Error('Device is offline - cannot fetch chart data')
      }

      const response = await birdEyeRequests.tokenOHLCV(tokenAddress, {
        type: timeFrame,
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch OHLCV data')
      }

      return response.data
    },
    onSuccess: (data) => {
      if (tokenData) {
        // Update the token store with new OHLCV data
        setToken(tokenAddress, {
          ...tokenData,
          ohlcv: data,
        })
      }
    },
  })

  // Historical price mutation for line chart
  const historicalPriceMutation = useMutation({
    mutationFn: async ({ timeFrame }: { timeFrame: BirdEyeTimePeriod }) => {
      // Check if offline before making request
      if (isOnline === false) {
        throw new Error('Device is offline - cannot fetch chart data')
      }

      const response = await birdEyeRequests.historicalPrice(tokenAddress, {
        type: timeFrame,
      })

      if (!response.success || !response.data) {
        throw new Error(
          response.message || 'Failed to fetch historical price data'
        )
      }

      return response.data
    },
    onSuccess: (data) => {
      if (tokenData) {
        // Update the token store with new line chart data
        setToken(tokenAddress, {
          ...tokenData,
          lineChart: data,
        })
      }
    },
  })

  // Function to fetch chart data based on type and timeframe
  const fetchChartData = useCallback(
    async (type: ChartType, timeFrame: BirdEyeTimePeriod) => {
      if (!tokenAddress) return

      if (type === 'candlestick') {
        // Check if we already have OHLCV data for this timeframe
        if (!tokenData?.ohlcv || activeTimeFrame !== timeFrame) {
          await ohlcvMutation.mutateAsync({ timeFrame })
        }
      } else {
        // Check if we already have line chart data for this timeframe
        if (!tokenData?.lineChart || activeTimeFrame !== timeFrame) {
          await historicalPriceMutation.mutateAsync({ timeFrame })
        }
      }
    },
    [
      tokenAddress,
      tokenData,
      activeTimeFrame,
      ohlcvMutation,
      historicalPriceMutation,
    ]
  )

  // Auto-refetch chart data when token data exists but chart data is missing
  useEffect(() => {
    if (tokenData && tokenData.tokenOverview && tokenAddress) {
      const hasChartData =
        (chartType === 'candlestick' && tokenData.ohlcv) ||
        (chartType === 'line' && tokenData.lineChart)

      if (
        !hasChartData &&
        !ohlcvMutation.isPending &&
        !historicalPriceMutation.isPending
      ) {
        console.log(
          'Token data exists but chart data is missing, refetching...'
        )
        fetchChartData(chartType, activeTimeFrame)
      }
    }
  }, [
    tokenData,
    chartType,
    activeTimeFrame,
    tokenAddress,
    fetchChartData,
    ohlcvMutation.isPending,
    historicalPriceMutation.isPending,
  ])

  // Function to switch chart type
  const switchChartType = useCallback(
    async (newType: ChartType) => {
      setChartType(newType)
      await fetchChartData(newType, activeTimeFrame)
    },
    [fetchChartData, activeTimeFrame]
  )

  // Function to switch timeframe
  const switchTimeFrame = useCallback(
    async (newTimeFrame: BirdEyeTimePeriod) => {
      setActiveTimeFrame(newTimeFrame)
      await fetchChartData(chartType, newTimeFrame)
    },
    [fetchChartData, chartType]
  )

  // Get current chart data
  const chartData =
    chartType === 'candlestick' ? tokenData?.ohlcv : tokenData?.lineChart
  const isLoading = ohlcvMutation.isPending || historicalPriceMutation.isPending
  const error = ohlcvMutation.error || historicalPriceMutation.error

  return {
    chartType,
    activeTimeFrame,
    chartData,
    isLoading,
    error: error?.message,
    switchChartType,
    switchTimeFrame,
    fetchChartData,
    hasOHLCVData: !!tokenData?.ohlcv,
    hasLineChartData: !!tokenData?.lineChart,
  }
}
