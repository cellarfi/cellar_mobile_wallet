import { SwapActivityItem } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { formatDistanceToNow } from 'date-fns'
import React from 'react'
import {
  Linking,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const EXPLORER_TX_URL = 'https://explorer.solana.com/tx/'

function truncateAddress(address: string, head = 4, tail = 4): string {
  if (!address || address.length <= head + tail) return address
  return `${address.slice(0, head)}…${address.slice(-tail)}`
}

function formatAmount(n: number | undefined): string {
  if (n === undefined || n === null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K'
  if (n >= 1) return n.toFixed(2)
  if (n > 0) return n.toFixed(4)
  return '0'
}

function formatUsd(n: number | undefined): string {
  if (n === undefined || n === null || n === 0) return ''
  return `~$${formatAmount(n)}`
}

function getTimeLabel(item: SwapActivityItem): string {
  const ts = item.timestamp
  const created = item.createdAt
  if (ts != null) {
    const date = ts < 1e12 ? new Date(ts * 1000) : new Date(ts)
    return formatDistanceToNow(date, { addSuffix: true })
  }
  if (created) {
    return formatDistanceToNow(new Date(created), { addSuffix: true })
  }
  return ''
}

interface SwapActivityCardProps {
  item: SwapActivityItem
}

export default function SwapActivityCard({ item }: SwapActivityCardProps) {
  const isBuy =
    item.tradeType === 'buy' ||
    (typeof item.tradeType === 'string' && item.tradeType.toLowerCase() === 'buy')
  const tradeLabel = isBuy ? 'Buy' : 'Sell'
  const inputLabel =
    item.inputMint ? truncateAddress(item.inputMint) : 'Token A'
  const outputLabel =
    item.outputMint ? truncateAddress(item.outputMint) : 'Token B'
  const amounts =
    item.inputAmount != null && item.outputAmount != null
      ? `${formatAmount(item.inputAmount)} ${inputLabel} → ${formatAmount(item.outputAmount)} ${outputLabel}`
      : `${inputLabel} → ${outputLabel}`
  const usdIn = formatUsd(item.inputValueUSD)
  const usdOut = formatUsd(item.outputValueUSD)
  const usdLine =
    usdIn || usdOut ? [usdIn, usdOut].filter(Boolean).join(' → ') : null
  const timeLabel = getTimeLabel(item)
  const explorerUrl =
    item.transactionSignature &&
    `${EXPLORER_TX_URL}${item.transactionSignature}`

  const openExplorer = () => {
    if (explorerUrl) Linking.openURL(explorerUrl)
  }

  return (
    <View className='mb-3 rounded-2xl overflow-hidden border border-white/10 bg-white/5'>
      <View className='flex-row items-start justify-between p-4'>
        <View className='flex-1'>
          <View className='flex-row items-center flex-wrap gap-2 mb-2'>
            <View
              className={`rounded-lg px-2.5 py-1 ${
                isBuy ? 'bg-emerald-500/30' : 'bg-rose-500/30'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  isBuy ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {tradeLabel}
              </Text>
            </View>
            {item.platform ? (
              <Text className='text-gray-400 text-xs'>{item.platform}</Text>
            ) : null}
          </View>
          <Text className='text-white font-medium mb-0.5' numberOfLines={2}>
            {amounts}
          </Text>
          {usdLine ? (
            <Text className='text-gray-400 text-sm mb-1'>{usdLine}</Text>
          ) : null}
          {timeLabel ? (
            <Text className='text-gray-500 text-xs'>{timeLabel}</Text>
          ) : null}
        </View>
        {explorerUrl ? (
          <TouchableOpacity
            onPress={openExplorer}
            className='ml-2 p-2 rounded-xl bg-white/10'
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name='open-outline' size={20} color='#94a3b8' />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  )
}
