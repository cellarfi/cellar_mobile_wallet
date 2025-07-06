import { useTokenChart } from '@/hooks/useTokenChart'
import { BirdEyeTimePeriod } from '@/types'
import React, { useEffect } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { CandlestickChart, LineChart } from 'react-native-wagmi-charts'

interface TokenChartProps {
  tokenAddress: string
}

const { width: screenWidth } = Dimensions.get('window')
const chartWidth = screenWidth - 48 - 32 // Screen width minus padding
const chartHeight = 240
const labelWidth = 60 // Reduced from 80 to bring labels closer
const chartContentWidth = chartWidth - labelWidth + 30 // Extended chart content width

const timeFrames: { label: string; value: BirdEyeTimePeriod }[] = [
  { label: '1H', value: '1H' },
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '1Y', value: '1Y' },
]

export function TokenChart({ tokenAddress }: TokenChartProps) {
  const {
    chartType,
    activeTimeFrame,
    chartData,
    isLoading,
    error,
    switchChartType,
    switchTimeFrame,
    fetchChartData,
  } = useTokenChart(tokenAddress)

  // Initial data fetch
  useEffect(() => {
    fetchChartData(chartType, activeTimeFrame)
  }, [tokenAddress, activeTimeFrame, chartType])

  // Transform OHLCV data for candlestick chart
  const transformOHLCVData = (data: any) => {
    if (!data?.items || !Array.isArray(data.items)) return []

    return data.items
      .filter((item: any) => item && typeof item.unixTime === 'number')
      .map((item: any) => ({
        timestamp: item.unixTime * 1000,
        open: Number(item.o) || 0,
        high: Number(item.h) || 0,
        low: Number(item.l) || 0,
        close: Number(item.c) || 0,
        volume: Number(item.v) || 0,
      }))
      .sort((a: any, b: any) => a.timestamp - b.timestamp)
  }

  // Transform historical price data for line chart
  const transformLineData = (data: any) => {
    if (!data?.items || !Array.isArray(data.items)) return []

    return data.items
      .filter((item: any) => item && typeof item.unixTime === 'number')
      .map((item: any) => ({
        timestamp: item.unixTime * 1000,
        value: Number(item.value) || 0,
      }))
      .sort((a: any, b: any) => a.timestamp - b.timestamp)
  }

  // Calculate static price labels for Y-axis
  const calculatePriceLabels = (data: any[]) => {
    if (!data || data.length === 0) return []

    let prices: number[] = []

    if (chartType === 'candlestick') {
      prices = data.reduce((acc: number[], item) => {
        acc.push(item.high, item.low, item.close)
        return acc
      }, [])
    } else {
      prices = data.map((item) => item.value)
    }

    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const midPrice = (minPrice + maxPrice) / 2

    return [
      { value: maxPrice, position: 'top' },
      { value: midPrice, position: 'middle' },
      { value: minPrice, position: 'bottom' },
    ]
  }

  // Calculate static time labels for X-axis
  const calculateTimeLabels = (data: any[]) => {
    if (!data || data.length === 0) return []

    const startTime = data[0].timestamp
    const endTime = data[data.length - 1].timestamp
    const midTime = startTime + (endTime - startTime) / 2

    const formatTime = (timestamp: number) => {
      const date = new Date(timestamp)
      if (activeTimeFrame === '1H') {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: false,
        })
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      }
    }

    return [
      { label: formatTime(startTime), position: 'start' },
      { label: formatTime(midTime), position: 'middle' },
      { label: formatTime(endTime), position: 'end' },
    ]
  }

  const renderChart = () => {
    if (isLoading && !chartData) {
      return (
        <View
          className='flex-1 justify-center items-center'
          style={{ height: chartHeight }}
        >
          <ActivityIndicator size='large' color='#6366f1' />
          <Text className='text-gray-400 text-sm mt-2'>
            Loading chart data...
          </Text>
        </View>
      )
    }

    if (error) {
      return (
        <View
          className='flex-1 justify-center items-center'
          style={{ height: chartHeight }}
        >
          <Text className='text-red-400 text-sm text-center'>{error}</Text>
          <TouchableOpacity
            onPress={() => fetchChartData(chartType, activeTimeFrame)}
            className='mt-2 bg-primary-500/20 px-4 py-2 rounded-lg'
          >
            <Text className='text-primary-400 text-sm'>Retry</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (!chartData) {
      return (
        <View
          className='flex-1 justify-center items-center'
          style={{ height: chartHeight }}
        >
          <Text className='text-gray-500 text-sm text-center'>
            No chart data available
          </Text>
          <TouchableOpacity
            onPress={() => fetchChartData(chartType, activeTimeFrame)}
            className='mt-2 bg-primary-500/20 px-4 py-2 rounded-lg'
          >
            <Text className='text-primary-400 text-sm'>Load Chart</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (chartType === 'candlestick') {
      const candlestickData = transformOHLCVData(chartData)

      if (candlestickData.length === 0) {
        return (
          <View
            className='flex-1 justify-center items-center'
            style={{ height: chartHeight }}
          >
            <Text className='text-gray-500 text-sm'>No candlestick data</Text>
          </View>
        )
      }

      const priceLabels = calculatePriceLabels(candlestickData)
      const timeLabels = calculateTimeLabels(candlestickData)

      return (
        <View style={{ flex: 1, height: chartHeight }}>
          <CandlestickChart.Provider data={candlestickData}>
            {/* Static price labels on the right */}
            <View
              className='absolute right-0 top-0 bottom-8 justify-between z-10 py-2'
              style={{ width: labelWidth }}
            >
              {priceLabels.map((label, index) => (
                <Text
                  key={index}
                  className='text-gray-400 text-xs text-right font-medium'
                  style={{ fontSize: 11 }}
                >
                  ${label.value.toFixed(label.value > 1 ? 2 : 4)}
                </Text>
              ))}
            </View>

            <CandlestickChart
              height={chartHeight - 32}
              width={chartContentWidth}
            >
              <CandlestickChart.Candles
                positiveColor='#10b981'
                negativeColor='#ef4444'
              />
              <CandlestickChart.Crosshair>
                <CandlestickChart.Tooltip
                  textStyle={{
                    color: '#000',
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                />
              </CandlestickChart.Crosshair>
            </CandlestickChart>

            {/* Static time labels at the bottom */}
            <View
              className='absolute bottom-0 left-0 h-8 flex-row justify-between items-center px-2'
              style={{ right: labelWidth }}
            >
              {timeLabels.map((label, index) => (
                <Text
                  key={index}
                  className='text-gray-400 text-xs font-medium'
                  style={{ fontSize: 11 }}
                >
                  {label.label}
                </Text>
              ))}
            </View>
          </CandlestickChart.Provider>
        </View>
      )
    } else {
      const lineData = transformLineData(chartData)

      if (lineData.length === 0) {
        return (
          <View
            className='flex-1 justify-center items-center'
            style={{ height: chartHeight }}
          >
            <Text className='text-gray-500 text-sm'>No line data</Text>
          </View>
        )
      }

      const priceLabels = calculatePriceLabels(lineData)
      const timeLabels = calculateTimeLabels(lineData)

      return (
        <View style={{ flex: 1, height: chartHeight }}>
          <LineChart.Provider data={lineData}>
            {/* Static price labels on the right */}
            <View
              className='absolute right-0 top-0 bottom-8 justify-between z-10 py-2'
              style={{ width: labelWidth }}
            >
              {priceLabels.map((label, index) => (
                <Text
                  key={index}
                  className='text-gray-400 text-xs text-right font-medium'
                  style={{ fontSize: 11 }}
                >
                  ${label.value.toFixed(label.value > 1 ? 2 : 4)}
                </Text>
              ))}
            </View>

            <LineChart height={chartHeight - 32} width={chartContentWidth}>
              <LineChart.Path color='#6366f1' width={2}>
                <LineChart.Gradient />
              </LineChart.Path>
              <LineChart.CursorCrosshair color='#6366f1'>
                <LineChart.Tooltip
                  textStyle={{
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                />
              </LineChart.CursorCrosshair>
            </LineChart>

            {/* Static time labels at the bottom */}
            <View
              className='absolute bottom-0 left-0 h-8 flex-row justify-between items-center px-2'
              style={{ right: labelWidth }}
            >
              {timeLabels.map((label, index) => (
                <Text
                  key={index}
                  className='text-gray-400 text-xs font-medium'
                  style={{ fontSize: 11 }}
                >
                  {label.label}
                </Text>
              ))}
            </View>
          </LineChart.Provider>
        </View>
      )
    }
  }

  return (
    <View className='px-6 mb-6'>
      {/* Integrated Chart Widget */}
      <View className='bg-dark-200 rounded-2xl overflow-hidden'>
        {/* Header with timeframes and chart toggle */}
        <View className='flex-row items-center justify-between px-4 py-3 border-b border-dark-300'>
          {/* Timeframes */}
          <View className='flex-row'>
            {timeFrames.map((timeFrame, index) => (
              <TouchableOpacity
                key={timeFrame.value}
                onPress={() => switchTimeFrame(timeFrame.value)}
                className={`px-3 py-1.5 rounded-md ${index > 0 ? 'ml-1' : ''} ${
                  activeTimeFrame === timeFrame.value
                    ? 'bg-primary-500'
                    : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    activeTimeFrame === timeFrame.value
                      ? 'text-white'
                      : 'text-gray-400'
                  }`}
                >
                  {timeFrame.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chart type toggle */}
          <View className='flex-row items-center'>
            {/* Loading indicator for background updates */}
            {isLoading && chartData && (
              <View className='mr-3'>
                <ActivityIndicator size={14} color='#6366f1' />
              </View>
            )}

            {/* Chart toggle buttons */}
            <View className='flex-row bg-dark-300 rounded-lg p-0.5'>
              <TouchableOpacity
                onPress={() => switchChartType('candlestick')}
                className={`px-2 py-1.5 rounded-md ${
                  chartType === 'candlestick'
                    ? 'bg-primary-500'
                    : 'bg-transparent'
                }`}
              >
                <Text className='text-lg'>📊</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => switchChartType('line')}
                className={`px-2 py-1.5 rounded-md ${
                  chartType === 'line' ? 'bg-primary-500' : 'bg-transparent'
                }`}
              >
                <Text className='text-lg'>📈</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Chart area */}
        <View className='relative' style={{ height: chartHeight + 32 }}>
          <View className='absolute inset-0 p-4'>{renderChart()}</View>
        </View>
      </View>
    </View>
  )
}
