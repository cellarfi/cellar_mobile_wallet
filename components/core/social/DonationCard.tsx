import { formatValue } from '@/libs/string.helpers'
import { Post } from '@/types/posts.interface'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface DonationCardProps {
  funding_meta: Post['funding_meta']
}

const DonationCard = React.memo(({ funding_meta }: DonationCardProps) => {
  if (!funding_meta) return null

  const targetAmount = parseFloat(funding_meta.target_amount || '0')
  const currentAmount = parseFloat(funding_meta.current_amount || '0')
  const progressPercentage =
    targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0
  const remainingAmount = Math.max(0, targetAmount - currentAmount)

  const getStatusColor = () => {
    if (funding_meta.status === 'COMPLETED') return 'text-green-400'
    if (funding_meta.status === 'CANCELLED') return 'text-red-400'
    if (funding_meta.status === 'EXPIRED') return 'text-orange-400'
    return 'text-blue-400'
  }

  const getStatusText = () => {
    switch (funding_meta.status) {
      case 'COMPLETED':
        return 'Completed'
      case 'CANCELLED':
        return 'Cancelled'
      case 'EXPIRED':
        return 'Expired'
      case 'ACTIVE':
      default:
        return 'Active'
    }
  }

  const handleDonatePress = () => {
    if (funding_meta.token_address && funding_meta.status === 'ACTIVE') {
      router.push({
        pathname: '/(modals)/swap',
        params: {
          outputToken: JSON.stringify({
            name: funding_meta.token_symbol || 'SOL',
            symbol: funding_meta.token_symbol || 'SOL',
            address: funding_meta.token_address,
            network: 'solana',
            decimals: 9,
            logo_uri: '',
            verified: true,
          }),
          recipientAddress: funding_meta.wallet_address,
        },
      })
    }
  }

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return null
    const date = new Date(deadline)
    const now = new Date()
    const timeDiff = date.getTime() - now.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

    if (daysDiff < 0) return 'Expired'
    if (daysDiff === 0) return 'Ends today'
    if (daysDiff === 1) return 'Ends tomorrow'
    return `${daysDiff} days left`
  }

  return (
    <View className='bg-secondary/5 border border-zinc-800 rounded-2xl p-4'>
      {/* Header */}
      <View className='flex-row items-center justify-between mb-4'>
        <View className='flex-row items-center'>
          <View className='w-10 h-10 bg-blue-500/20 rounded-full justify-center items-center mr-3'>
            <Ionicons name='heart' size={20} color='#3b82f6' />
          </View>
          <View>
            <Text className='text-gray-100 font-bold text-base'>
              Donation Campaign
            </Text>
            <Text className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        {funding_meta.deadline && (
          <View className='bg-zinc-800 rounded-lg px-2 py-1'>
            <Text className='text-gray-400 text-xs'>
              {formatDeadline(funding_meta.deadline)}
            </Text>
          </View>
        )}
      </View>

      {/* Progress Section */}
      <View className='mb-4'>
        <View className='flex-row justify-between items-center mb-2'>
          <Text className='text-gray-100 font-bold text-lg'>
            {formatValue(currentAmount)}
          </Text>
          <Text className='text-gray-400 text-sm'>
            of ${formatValue(targetAmount)} goal
          </Text>
        </View>

        {/* Progress Bar */}
        <View className='w-full h-2 bg-zinc-800 rounded-full mb-2'>
          <View
            className={`h-full rounded-full ${
              progressPercentage >= 100
                ? 'bg-green-500'
                : progressPercentage >= 75
                  ? 'bg-blue-500'
                  : progressPercentage >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </View>

        <View className='flex-row justify-between items-center'>
          <Text className='text-gray-400 text-xs'>
            {progressPercentage.toFixed(1)}% funded
          </Text>
          {remainingAmount > 0 && (
            <Text className='text-gray-400 text-xs'>
              ${formatValue(remainingAmount)} remaining
            </Text>
          )}
        </View>
      </View>

      {/* Statistics */}
      <View className='flex-row justify-between mb-4 py-3 border-t border-zinc-800'>
        <View className='items-center'>
          <Text className='text-gray-400 text-xs mb-1'>Target</Text>
          <Text className='text-gray-100 font-bold text-sm'>
            ${formatValue(targetAmount)}
          </Text>
        </View>
        <View className='items-center'>
          <Text className='text-gray-400 text-xs mb-1'>Raised</Text>
          <Text className='text-gray-100 font-bold text-sm'>
            {formatValue(currentAmount)}
          </Text>
        </View>
        <View className='items-center'>
          <Text className='text-gray-400 text-xs mb-1'>Progress</Text>
          <Text className='text-gray-100 font-bold text-sm'>
            {progressPercentage.toFixed(1)}%
          </Text>
        </View>
        <View className='items-center'>
          <Text className='text-gray-400 text-xs mb-1'>Token</Text>
          <Text className='text-gray-100 font-bold text-sm'>
            {funding_meta.token_symbol || 'SOL'}
          </Text>
        </View>
      </View>

      {/* Action Button */}
      {funding_meta.status === 'ACTIVE' ? (
        <TouchableOpacity
          className='bg-blue-500 rounded-xl py-3 px-6 items-center flex-row justify-center'
          onPress={handleDonatePress}
        >
          <Ionicons name='heart' size={18} color='#ffffff' />
          <Text className='text-white font-bold text-base ml-2'>
            Donate Now
          </Text>
        </TouchableOpacity>
      ) : (
        <View className='bg-zinc-800 rounded-xl py-3 px-6 items-center'>
          <Text className='text-gray-400 font-medium text-base'>
            {funding_meta.status === 'COMPLETED'
              ? 'Campaign Completed'
              : funding_meta.status === 'EXPIRED'
                ? 'Campaign Expired'
                : 'Campaign Cancelled'}
          </Text>
        </View>
      )}
    </View>
  )
})

DonationCard.displayName = 'DonationCard'

export default DonationCard
