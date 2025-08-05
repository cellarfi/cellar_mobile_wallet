import { birdEyeRequests } from '@/libs/api_requests/birdeye.request'
import { BirdEyeTimePeriod } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { LineChart } from 'react-native-wagmi-charts'

const { width: screenWidth } = Dimensions.get('window')
const chartWidth = screenWidth - 48 - 32 // Screen width minus padding
const chartHeight = 180
const chartContentWidth = chartWidth - 60 + 30 // Extended chart content width

const timeFrames: { label: string; value: BirdEyeTimePeriod }[] = [
  { label: '1H', value: '1H' },
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: 'ALL', value: '1Y' },
]

interface TokenCallChartProps {
  tokenAddress: string
}

const TokenCallChart = React.memo(({ tokenAddress }: TokenCallChartProps) => {
  const [chartData, setChartData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTimeFrame, setActiveTimeFrame] =
    useState<BirdEyeTimePeriod>('1D')

  const fetchChartData = useCallback(
    async (timeFrame: BirdEyeTimePeriod) => {
      if (!tokenAddress) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await birdEyeRequests.historicalPrice(tokenAddress, {
          type: timeFrame,
          setLoading: setIsLoading,
        })

        if (response.success && response.data) {
          setChartData(response.data)
          console.log('chartData', response.data.items.slice(0, 1))
        } else {
          setError(response.message || 'Failed to load chart data')
        }
      } catch (err: any) {
        setError(err?.message || 'Error loading chart data')
      } finally {
        setIsLoading(false)
      }
    },
    [tokenAddress]
  )

  useEffect(() => {
    fetchChartData(activeTimeFrame)
  }, [tokenAddress, activeTimeFrame, fetchChartData])

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

  const renderChart = () => {
    if (isLoading && !chartData) {
      return (
        <View
          className='justify-center items-center bg-gray-900 rounded-xl mb-3'
          style={{ height: chartHeight }}
        >
          <ActivityIndicator size='large' color='#6366f1' />
          <Text className='text-gray-400 text-sm mt-2'>Loading chart...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View
          className='justify-center items-center bg-gray-900 rounded-xl mb-3'
          style={{ height: chartHeight }}
        >
          <Ionicons name='analytics-outline' size={32} color='#6b7280' />
          <Text className='text-gray-400 text-sm mt-2'>
            Could not load chart
          </Text>
        </View>
      )
    }

    if (!chartData) {
      return (
        <View
          className='justify-center items-center bg-gray-900 rounded-xl mb-3'
          style={{ height: chartHeight }}
        >
          <Ionicons name='analytics-outline' size={32} color='#6b7280' />
          <Text className='text-gray-400 text-sm mt-2'>
            Could not load chart
          </Text>
        </View>
      )
    }

    const lineData = transformLineData(chartData)

    if (lineData.length === 0) {
      return (
        <View
          className='justify-center items-center bg-gray-900 rounded-xl mb-3'
          style={{ height: chartHeight }}
        >
          <Ionicons name='analytics-outline' size={32} color='#6b7280' />
          <Text className='text-gray-400 text-sm mt-2'>
            No chart data available
          </Text>
        </View>
      )
    }

    return (
      <GestureHandlerRootView style={{ flex: 1, height: chartHeight }}>
        <LineChart.Provider data={lineData}>
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
        </LineChart.Provider>
      </GestureHandlerRootView>
    )
  }

  return (
    <View>
      {/* Chart area */}
      <View className='mb-3'>{renderChart()}</View>

      {/* Timeframes */}
      <View className='flex-row justify-center items-center px-2'>
        {timeFrames.map((timeFrame, index) => (
          <TouchableOpacity
            key={timeFrame.value}
            onPress={() => setActiveTimeFrame(timeFrame.value)}
            className={`px-3 py-1.5 rounded-lg ${index > 0 ? 'ml-1' : ''} ${
              activeTimeFrame === timeFrame.value
                ? 'bg-primary-500'
                : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
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
    </View>
  )
})

TokenCallChart.displayName = 'TokenCallChart'

export default TokenCallChart
