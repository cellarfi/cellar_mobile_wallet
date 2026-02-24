import {
  BlockedUser,
  moderationRequests,
} from '@/libs/api_requests/moderation.request'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function BlockedUsersScreen() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [unblocking, setUnblocking] = useState<string | null>(null)

  const fetchBlockedUsers = useCallback(async () => {
    try {
      const response = await moderationRequests.getBlockedUsers()
      if (response.success) {
        setBlockedUsers(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching blocked users:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchBlockedUsers()
  }, [fetchBlockedUsers])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchBlockedUsers()
  }

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock @${user.blocked_user?.tag_name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unblock',
          style: 'default',
          onPress: async () => {
            setUnblocking(user.blocked_id)
            try {
              const response = await moderationRequests.unblockUser(
                user.blocked_id
              )
              if (response.success) {
                setBlockedUsers((prev) =>
                  prev.filter((u) => u.blocked_id !== user.blocked_id)
                )
                Alert.alert(
                  'Unblocked',
                  `@${user.blocked_user?.tag_name} has been unblocked.`
                )
              } else {
                Alert.alert(
                  'Error',
                  response.message || 'Failed to unblock user'
                )
              }
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to unblock user')
            } finally {
              setUnblocking(null)
            }
          },
        },
      ]
    )
  }

  const handleViewProfile = (tagName: string) => {
    router.push(`/profile/${tagName}` as any)
  }

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => {
    const user = item.blocked_user
    if (!user) return null

    return (
      <View className='flex-row items-center bg-secondary-light rounded-2xl p-4 mb-3 mx-4'>
        {/* Profile Picture */}
        <TouchableOpacity onPress={() => handleViewProfile(user.tag_name)}>
          <View className='w-12 h-12 bg-gray-700 rounded-full justify-center items-center mr-3 overflow-hidden'>
            {user.profile_picture_url ? (
              <Image
                source={{ uri: user.profile_picture_url }}
                style={{ width: 48, height: 48, borderRadius: 24 }}
              />
            ) : (
              <Text className='text-white text-lg font-bold'>
                {user.display_name?.[0]?.toUpperCase() || '?'}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* User Info */}
        <View className='flex-1'>
          <TouchableOpacity onPress={() => handleViewProfile(user.tag_name)}>
            <Text className='text-gray-100 font-bold text-base'>
              {user.display_name}
            </Text>
            <Text className='text-gray-400 text-sm'>@{user.tag_name}</Text>
          </TouchableOpacity>
        </View>

        {/* Unblock Button */}
        <TouchableOpacity
          onPress={() => handleUnblock(item)}
          disabled={unblocking === item.blocked_id}
          className='bg-primary-500/20 border border-primary-500/40 px-4 py-2 rounded-xl'
        >
          {unblocking === item.blocked_id ? (
            <ActivityIndicator size='small' color='#6366f1' />
          ) : (
            <Text className='text-primary-400 font-medium'>Unblock</Text>
          )}
        </TouchableOpacity>
      </View>
    )
  }

  const renderEmpty = () => (
    <View className='flex-1 justify-center items-center px-6'>
      <View className='w-20 h-20 bg-gray-800/50 rounded-full justify-center items-center mb-4'>
        <Ionicons name='ban-outline' size={40} color='#6b7280' />
      </View>
      <Text className='text-gray-400 text-lg font-medium text-center'>
        No blocked users
      </Text>
      <Text className='text-gray-500 text-sm text-center mt-2'>
        You haven't blocked anyone yet. When you block a user, they'll appear
        here.
      </Text>
    </View>
  )

  return (
    <SafeAreaView className='flex-1 bg-primary-main' edges={['top']}>
      {/* Header */}
      <View className='flex-row items-center px-4 py-4 border-b border-zinc-800'>
        <TouchableOpacity
          onPress={() => router.back()}
          className='w-10 h-10 rounded-full justify-center items-center mr-3'
        >
          <Ionicons name='chevron-back' size={24} color='white' />
        </TouchableOpacity>
        <Text className='text-white text-xl font-bold'>Blocked Users</Text>
      </View>

      {/* Content */}
      {loading ? (
        <View className='flex-1 justify-center items-center'>
          <ActivityIndicator size='large' color='#6366f1' />
          <Text className='text-gray-400 mt-4'>Loading blocked users...</Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderBlockedUser}
          contentContainerStyle={{
            paddingTop: 16,
            flexGrow: 1,
          }}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor='#6366f1'
            />
          }
        />
      )}
    </SafeAreaView>
  )
}
