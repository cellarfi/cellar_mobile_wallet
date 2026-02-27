import { tapestryRequests } from '@/libs/api_requests/tapestry.request'
import { SwapActivityItem } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import SwapActivityCard from './SwapActivityCard'

interface UserSwapActivityProps {
  tagName: string
}

export default function UserSwapActivity({ tagName }: UserSwapActivityProps) {
  const [data, setData] = useState<SwapActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSwaps = useCallback(async () => {
    if (!tagName) return
    setLoading(true)
    setError(null)
    try {
      const response = await tapestryRequests.getSwapActivity(tagName)
      if (response.success && response.data) {
        const list = response.data.data ?? []
        setData(Array.isArray(list) ? list : [])
      } else {
        setData([])
        setError(response.message || 'Failed to load swap activity')
      }
    } catch (err: any) {
      setData([])
      setError(err?.message || 'Failed to load swap activity')
    } finally {
      setLoading(false)
    }
  }, [tagName])

  useEffect(() => {
    fetchSwaps()
  }, [fetchSwaps])

  if (loading) {
    return (
      <View className='px-6 py-12 items-center'>
        <ActivityIndicator color='#6366f1' size='large' />
        <Text className='text-gray-400 mt-4'>Loading swaps…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View className='px-6 py-12 items-center'>
        <Ionicons name='alert-circle-outline' size={48} color='#ef4444' />
        <Text className='text-red-400 mt-4 text-center'>{error}</Text>
        <TouchableOpacity
          onPress={fetchSwaps}
          className='mt-4 px-4 py-2 rounded-xl bg-secondary'
        >
          <Text className='text-white font-medium'>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!data.length) {
    return (
      <View className='px-6 py-12 items-center'>
        <Ionicons
          name='swap-horizontal-outline'
          size={48}
          color='#6366f1'
          style={{ opacity: 0.5 }}
        />
        <Text className='text-gray-400 mt-4 text-lg text-center'>
          No swaps activity recorded
        </Text>
      </View>
    )
  }

  return (
    <View className='px-6 mb-6'>
      <Text className='text-white text-lg font-semibold mb-4'>Swaps</Text>
      <FlatList
        data={data}
        keyExtractor={(item) =>
          item.transactionSignature ||
          String(item.id ?? Math.random())
        }
        renderItem={({ item }) => <SwapActivityCard item={item} />}
        scrollEnabled={false}
      />
    </View>
  )
}
