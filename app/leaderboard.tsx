import { usePoints } from '@/hooks/usePoints'
import { formatNumber } from '@/libs/string.helpers'
import { LeaderboardEntry, LeaderboardTimeFrame } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Level badges with their color schemes
// Define the type for the icon names to ensure TypeScript compatibility
type IconName = 'star-outline' | 'star-half' | 'star' | 'ribbon' | 'trophy'

const levelBadges = {
  1: {
    bg: 'bg-zinc-500/20',
    text: 'text-zinc-400',
    icon: 'star-outline' as IconName,
  },
  2: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    icon: 'star-half' as IconName,
  },
  3: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    icon: 'star' as IconName,
  },
  4: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    icon: 'ribbon' as IconName,
  },
  5: { bg: 'bg-red-500/20', text: 'text-red-400', icon: 'trophy' as IconName },
}

// Get level badge based on user level
const getLevelBadge = (level: number) => {
  if (level >= 5) return levelBadges[5]
  if (level >= 4) return levelBadges[4]
  if (level >= 3) return levelBadges[3]
  if (level >= 2) return levelBadges[2]
  return levelBadges[1]
}

const LeaderboardScreen = () => {
  const { leaderboard, fetchLeaderboard, userPoints, isLoading } = usePoints()
  const [selectedTimeFrame, setSelectedTimeFrame] =
    useState<LeaderboardTimeFrame>('all_time')
  const [page, setPage] = useState(0)
  const itemsPerPage = 10

  // Load leaderboard data
  const loadLeaderboard = useCallback(
    async (resetPagination = true) => {
      try {
        if (resetPagination) {
          setPage(0)
        }

        await fetchLeaderboard({
          timeFrame: selectedTimeFrame,
          limit: itemsPerPage,
          offset: resetPagination ? 0 : page * itemsPerPage,
        })
      } catch (error) {
        console.error('Error loading leaderboard:', error)
      }
    },
    [fetchLeaderboard, page, selectedTimeFrame]
  )

  // Get leaderboard data when component mounts or time frame changes
  useEffect(() => {
    loadLeaderboard()
  }, [loadLeaderboard, selectedTimeFrame])

  // Handle loading more entries
  const handleLoadMore = async () => {
    if (isLoading || !leaderboard) return

    // Check if we've loaded all items
    if ((page + 1) * itemsPerPage >= leaderboard.pagination.total) return

    try {
      const nextPage = page + 1
      setPage(nextPage)
      await fetchLeaderboard({
        timeFrame: selectedTimeFrame,
        limit: itemsPerPage,
        offset: nextPage * itemsPerPage,
      })
    } catch (error) {
      console.error('Error loading more leaderboard entries:', error)
    }
  }

  // Determine if the current user is in the displayed leaderboard
  const isCurrentUserInLeaderboard = () => {
    if (!leaderboard?.leaderboard || !userPoints) return false
    return leaderboard.leaderboard.some(
      (entry) => entry.user_id === userPoints.user_id
    )
  }

  // Find current user's rank in the leaderboard
  const getCurrentUserRank = () => {
    if (!leaderboard?.leaderboard || !userPoints) return null
    return leaderboard.leaderboard.find(
      (entry) => entry.user_id === userPoints.user_id
    )
  }

  // Render an individual leaderboard entry
  const renderLeaderboardItem = ({
    item,
    index,
  }: {
    item: LeaderboardEntry
    index: number
  }) => {
    const isCurrentUser = userPoints && item.user_id === userPoints.user_id
    const levelBadge = getLevelBadge(item.level)

    return (
      <TouchableOpacity
        className={`flex-row items-center p-4 border-b border-dark-300 ${
          isCurrentUser ? 'bg-primary-500/10' : ''
        }`}
        onPress={() => router.push(`/(screens)/user-profile/${item.tag_name}`)}
      >
        {/* Rank */}
        <View className='w-10 items-center'>
          {index < 3 ? (
            <Ionicons
              name='trophy'
              size={24}
              color={
                index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'
              }
            />
          ) : (
            <Text className='text-white text-lg font-bold'>{item.rank}</Text>
          )}
        </View>

        {/* User info */}
        <View className='flex-row flex-1 items-center ml-3'>
          {item.profile_picture_url ? (
            <Image
              source={{ uri: item.profile_picture_url }}
              className='w-10 h-10 rounded-full'
            />
          ) : (
            <View className='w-10 h-10 bg-dark-300 rounded-full items-center justify-center'>
              <Text className='text-white text-lg'>
                {item.display_name.charAt(0)}
              </Text>
            </View>
          )}

          <View className='ml-3 flex-1'>
            <View className='flex-row items-center'>
              <Text className='text-white font-medium text-base'>
                {item.display_name}
              </Text>
              {isCurrentUser && (
                <View className='bg-primary-500/30 rounded-full px-2 py-0.5 ml-2'>
                  <Text className='text-primary-300 text-xs'>You</Text>
                </View>
              )}
            </View>
            <Text className='text-gray-400 text-sm'>@{item.tag_name}</Text>
          </View>
        </View>

        {/* Points & Level */}
        <View className='items-end'>
          <Text className='text-white font-bold'>
            {formatNumber(item.balance)}
          </Text>
          <View
            className={`flex-row items-center rounded-full px-2 py-0.5 mt-1 ${levelBadge.bg}`}
          >
            <Ionicons name={levelBadge.icon} size={12} color='#a78bfa' />
            <Text className={`${levelBadge.text} text-xs ml-1`}>
              Level {item.level}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  // Time frame filter buttons
  const TimeFrameButton = ({
    timeFrame,
    label,
  }: {
    timeFrame: LeaderboardTimeFrame
    label: string
  }) => (
    <Pressable
      onPress={() => setSelectedTimeFrame(timeFrame)}
      className={`px-4 py-2 rounded-full mr-2 ${
        selectedTimeFrame === timeFrame ? 'bg-primary-500' : 'bg-dark-300'
      }`}
    >
      <Text
        className={`font-medium ${
          selectedTimeFrame === timeFrame ? 'text-white' : 'text-gray-400'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  )

  return (
    <SafeAreaView className='flex-1 bg-primary-main' edges={['top']}>
      {/* Header */}
      <View className='flex-row items-center justify-between py-4'>
        <View className='flex-row items-center gap-2'>
          <TouchableOpacity
            onPress={() => router.back()}
            className='rounded-full p-2'
          >
            <Ionicons name='chevron-back' size={24} color='white' />
          </TouchableOpacity>
          <Text className='text-white text-2xl font-bold'>Leaderboard</Text>
        </View>
      </View>

      {/* Time Frame Filter */}
      <View className='px-4 py-2'>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className='flex-row'
          contentContainerStyle={{ paddingHorizontal: 2 }}
        >
          <TimeFrameButton timeFrame='all_time' label='All Time' />
          <TimeFrameButton timeFrame='monthly' label='This Month' />
          <TimeFrameButton timeFrame='weekly' label='This Week' />
        </ScrollView>
      </View>

      {/* Current User Rank Highlight (if not in top) */}
      {userPoints && !isCurrentUserInLeaderboard() && (
        <View className='bg-dark-200 mx-4 mb-4 rounded-xl overflow-hidden'>
          <View className='bg-primary-500/10 p-2 border-l-4 border-primary-500'>
            <Text className='text-white font-medium'>Your Ranking</Text>
          </View>
          {getCurrentUserRank() ? (
            <View className='p-4 flex-row items-center'>
              <Text className='text-white text-lg font-bold w-10 text-center'>
                #{getCurrentUserRank()!.rank}
              </Text>
              <View className='flex-row flex-1 items-center ml-3'>
                <View className='w-10 h-10 bg-primary-500/20 rounded-full items-center justify-center'>
                  <Text className='text-white text-lg'>
                    {userPoints?.user_id?.charAt(0)}
                  </Text>
                </View>
                <View className='ml-3'>
                  <Text className='text-white font-medium'>You</Text>
                  <Text className='text-primary-300 text-sm'>
                    {formatNumber(userPoints.balance)} points
                  </Text>
                </View>
              </View>
              <View className='items-end'>
                <View className='bg-primary-500/20 rounded-full px-2 py-1'>
                  <Text className='text-primary-300 text-xs'>
                    Level {userPoints.level}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View className='p-4 items-center justify-center'>
              <Text className='text-gray-400'>
                Earn points to appear on the leaderboard!
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Leaderboard List */}
      {isLoading && !leaderboard ? (
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator color='#6366f1' size='large' />
          <Text className='text-white mt-4'>Loading leaderboard...</Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard?.leaderboard || []}
          keyExtractor={(item) => item.user_id}
          renderItem={renderLeaderboardItem}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <View className='px-4 py-2 bg-secondary-light'>
              <Text className='text-white font-semibold'>
                Top {leaderboard?.pagination.total || 0} Users •{' '}
                {selectedTimeFrame === 'all_time'
                  ? 'All Time'
                  : selectedTimeFrame === 'monthly'
                    ? 'This Month'
                    : 'This Week'}
              </Text>
            </View>
          }
          ListFooterComponent={
            isLoading ? (
              <View className='py-4 items-center'>
                <ActivityIndicator color='#6366f1' size='small' />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className='flex-1 items-center justify-center py-8'>
              <Ionicons name='trophy-outline' size={48} color='#6366f1' />
              <Text className='text-white text-lg mt-4'>No data available</Text>
              <Text className='text-gray-400 text-center mx-8 mt-2'>
                Be the first to appear on the leaderboard!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

export default LeaderboardScreen
