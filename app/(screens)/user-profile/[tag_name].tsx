import { pointsRequests } from '@/libs/api_requests/points.request'
import { userRequests } from '@/libs/api_requests/user.request'
import { User, UserPoint } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const UserProfileModal = () => {
  const { tag_name } = useLocalSearchParams<{ tag_name: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [userPoints, setUserPoints] = useState<UserPoint | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Level calculation function
  const calculateLevel = (balance: number): number => {
    if (balance < 100) return 1
    if (balance < 500) return 2
    if (balance < 1000) return 3
    if (balance < 2500) return 4
    if (balance < 5000) return 5
    if (balance < 10000) return 6
    if (balance < 25000) return 7
    if (balance < 50000) return 8
    if (balance < 100000) return 9
    return 10 // Maximum level
  }

  // Get level badge
  const getLevelBadge = (level: number) => {
    const badges = [
      { icon: 'leaf-outline', color: '#10b981', name: 'Seedling' },
      { icon: 'leaf', color: '#059669', name: 'Sprout' },
      { icon: 'flower-outline', color: '#0891b2', name: 'Bloom' },
      { icon: 'flower', color: '#0284c7', name: 'Blossom' },
      { icon: 'diamond-outline', color: '#7c3aed', name: 'Crystal' },
      { icon: 'diamond', color: '#6d28d9', name: 'Diamond' },
      { icon: 'star-outline', color: '#dc2626', name: 'Star' },
      { icon: 'star', color: '#b91c1c', name: 'Superstar' },
      { icon: 'trophy-outline', color: '#ea580c', name: 'Champion' },
      { icon: 'trophy', color: '#c2410c', name: 'Legend' },
    ]
    return badges[Math.min(level - 1, badges.length - 1)] || badges[0]
  }

  // Copy wallet address handler
  const handleCopyWallet = async (address: string) => {
    try {
      await Clipboard.setStringAsync(address)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (e) {
      console.error('Failed to copy wallet address:', e)
      Alert.alert('Error', 'Failed to copy wallet address')
    }
  }

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!tag_name) return

      setLoading(true)
      setError(null)

      try {
        // Remove @ symbol if present
        const cleanTagName = tag_name.replace('@', '')

        // Fetch user data
        const userResponse = await userRequests.getUserByTagName(cleanTagName)

        if (!userResponse.success || !userResponse.data) {
          setError(userResponse.message || 'User not found')
          return
        }

        setUser(userResponse.data)

        // Fetch user points
        try {
          const pointsResponse = await pointsRequests.getUserPoints(
            userResponse.data.id
          )
          if (pointsResponse.success && pointsResponse.data) {
            setUserPoints(pointsResponse.data)
          }
        } catch (pointsError) {
          console.log('Error fetching user points:', pointsError)
          // Don't show error for points, just continue without points data
        }
      } catch (err: any) {
        console.error('Error fetching user profile:', err)
        setError(err.message || 'Failed to load user profile')
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [tag_name])

  if (loading) {
    return (
      // <View className='flex-1 bg-dark-50'>
      <SafeAreaView className='flex-1 bg-primary-main' edges={['top']}>
        <View className='flex-row items-center justify-between px-4 py-4 border-b border-dark-300'>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name='close' size={24} color='white' />
          </TouchableOpacity>
          <Text className='text-white text-xl font-bold'>Profile</Text>
          <View className='w-10' />
        </View>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator color='#6366f1' size='large' />
          <Text className='text-white mt-4'>Loading profile...</Text>
        </View>
      </SafeAreaView>
      // </View>
    )
  }

  if (error || !user) {
    return (
      <View className='flex-1 bg-dark-50'>
        <SafeAreaView className='flex-1'>
          <View className='flex-row items-center justify-between px-4 py-4 border-b border-dark-300'>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name='close' size={24} color='white' />
            </TouchableOpacity>
            <Text className='text-white text-xl font-bold'>Profile</Text>
            <View className='w-10' />
          </View>
          <View className='flex-1 items-center justify-center'>
            <Ionicons name='person-circle-outline' size={80} color='#6b7280' />
            <Text className='text-white text-lg font-medium mt-4'>
              {error || 'User not found'}
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              className='mt-4 bg-primary-500 rounded-lg px-6 py-3'
            >
              <Text className='text-white font-medium'>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  const level = userPoints?.level || calculateLevel(userPoints?.balance || 0)
  const levelBadge = getLevelBadge(level)

  return (
    <View className='flex-1 bg-dark-50'>
      <SafeAreaView className='flex-1'>
        {/* Header */}
        <View className='flex-row items-center justify-between px-4 py-4 border-b border-dark-300'>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name='close' size={24} color='white' />
          </TouchableOpacity>
          <Text className='text-white text-xl font-bold'>Profile</Text>
          <View className='w-10' />
        </View>

        <ScrollView className='flex-1'>
          {/* Profile Header */}
          <View className='items-center px-6 py-8'>
            {/* Profile Picture */}
            <View className='relative'>
              {user.profile_picture_url ? (
                <Image
                  source={{ uri: user.profile_picture_url }}
                  className='w-24 h-24 rounded-full'
                />
              ) : (
                <View className='w-24 h-24 rounded-full bg-dark-300 items-center justify-center'>
                  <Ionicons name='person' size={40} color='#9ca3af' />
                </View>
              )}

              {/* Level Badge */}
              {userPoints && (
                <View className='absolute -bottom-2 -right-2 bg-dark-100 rounded-full p-2 border-2 border-dark-50'>
                  <Ionicons
                    name={levelBadge.icon as any}
                    size={20}
                    color={levelBadge.color}
                  />
                </View>
              )}
            </View>

            {/* User Info */}
            <Text className='text-white text-2xl font-bold mt-4'>
              {user.display_name}
            </Text>
            <Text className='text-gray-400 text-lg'>@{user.tag_name}</Text>

            {/* About */}
            {user.about && (
              <Text className='text-gray-300 text-center mt-3 px-4'>
                {user.about}
              </Text>
            )}
          </View>

          {/* Stats Section */}
          <View className='px-6 pb-6'>
            {/* Points & Level */}
            {userPoints && (
              <View className='bg-dark-200 rounded-xl p-4 mb-4'>
                <Text className='text-white text-lg font-bold mb-3'>
                  Points & Level
                </Text>
                <View className='flex-row items-center justify-between'>
                  <View className='flex-1'>
                    <View className='flex-row items-center'>
                      <Ionicons name='leaf' size={20} color='#10b981' />
                      <Text className='text-white text-xl font-bold ml-2'>
                        {userPoints.balance.toLocaleString()}
                      </Text>
                      <Text className='text-gray-400 ml-1'>points</Text>
                    </View>
                  </View>
                  <View className='items-center'>
                    <View className='flex-row items-center bg-primary-500/20 rounded-full px-3 py-1'>
                      <Ionicons
                        name={levelBadge.icon as any}
                        size={16}
                        color={levelBadge.color}
                      />
                      <Text className='text-white font-medium ml-1'>
                        Level {level}
                      </Text>
                    </View>
                    <Text className='text-gray-400 text-xs mt-1'>
                      {levelBadge.name}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Wallets Section */}
            {user.wallets && user.wallets.length > 0 && (
              <View className='bg-dark-200 rounded-xl p-4'>
                <Text className='text-white text-lg font-bold mb-3'>
                  Wallets ({user.wallets.length})
                </Text>
                {user.wallets.map((wallet, index) => (
                  <View
                    key={wallet.id}
                    className={`flex-row items-center justify-between py-3 ${
                      index < user.wallets!.length - 1
                        ? 'border-b border-dark-300'
                        : ''
                    }`}
                  >
                    <View className='flex-1'>
                      <View className='flex-row items-center'>
                        <Ionicons
                          name='wallet-outline'
                          size={20}
                          color='#6366f1'
                        />
                        <Text className='text-white font-medium ml-2'>
                          {wallet.chain_type.toUpperCase()}
                        </Text>
                        {wallet.is_default && (
                          <View className='bg-green-500/20 rounded-full px-2 py-1 ml-2'>
                            <Text className='text-green-400 text-xs font-medium'>
                              Default
                            </Text>
                          </View>
                        )}
                      </View>
                      <View className='flex-row items-center gap-2'>
                        <Text className='text-gray-400 text-sm mt-1'>
                          {wallet.address.slice(0, 6)}...
                          {wallet.address.slice(-4)}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleCopyWallet(wallet.address)}
                        >
                          {copied ? (
                            <Ionicons
                              name='checkmark'
                              size={16}
                              color='green'
                            />
                          ) : (
                            <Ionicons
                              name='copy-outline'
                              size={16}
                              color='white'
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Member Since */}
            <View className='bg-dark-200 rounded-xl p-4 mt-4'>
              <Text className='text-white text-lg font-bold mb-2'>
                Member Since
              </Text>
              <View className='flex-row items-center'>
                <Ionicons name='calendar-outline' size={20} color='#6366f1' />
                <Text className='text-gray-300 ml-2'>
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

export default UserProfileModal
