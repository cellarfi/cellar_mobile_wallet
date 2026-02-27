import PointsDisplay from '@/components/PointsDisplay'
import StatCard from '@/components/core/profile/StatCard'
import { tapestryRequests } from '@/libs/api_requests/tapestry.request'
import { formatNumber } from '@/libs/string.helpers'
import { useSettingsStore } from '@/store/settingsStore'
import { User } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState } from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'

interface ProfileCardProps {
  profile: User
  portfolio?: any
  userPoints?: any
  isLoading: boolean
  isOwnProfile?: boolean
}

const userData = {
  avatar: '🎯',
  stats: {
    wallets: 1,
  },
}

export default function ProfileCard({
  profile,
  portfolio,
  userPoints,
  isLoading,
  isOwnProfile = true,
}: ProfileCardProps) {
  const { settings } = useSettingsStore()
  const { hidePortfolioBalance } = settings
  /* Initialize with profile value, defaulting to false */
  /* Using key prop on component or useEffect might be safer if profile can change while mounted, 
     but assuming clean mount because of parent loading state */

  const [isFollowing, setIsFollowing] = useState(profile?.is_following || false)
  const [followersCount, setFollowersCount] = useState(
    profile?._count?.followers || 0
  )
  const [loading, setLoading] = useState(false)

  /* Update isFollowing and followersCount when profile changes (e.g. refreshing) */
  useEffect(() => {
    setIsFollowing(profile?.is_following || false)
    setFollowersCount(profile?._count?.followers || 0)
  }, [profile])

  const walletsCount = profile?.wallets?.length || 1
  const followingCount = profile?._count?.following || 0
  const postsCount = profile?._count?.post || 0

  const credibilityScore =
    typeof profile.credibility_score === 'number'
      ? Math.round(profile.credibility_score)
      : null

  const credibilityLabel =
    credibilityScore === null
      ? 'Building'
      : credibilityScore >= 70
        ? 'High'
        : credibilityScore >= 40
          ? 'Medium'
          : 'Low'

  const handleFollow = async () => {
    if (!profile?.tag_name) return

    const tagName = profile.tag_name
    const nextIsFollowing = !isFollowing

    // Optimistic update
    setIsFollowing(nextIsFollowing)
    setFollowersCount((prev) =>
      nextIsFollowing ? prev + 1 : Math.max(0, prev - 1)
    )

    setLoading(true)
    try {
      const res = nextIsFollowing
        ? await tapestryRequests.followUser(tagName)
        : await tapestryRequests.unfollowUser(tagName)

      if (!res.success) {
        throw new Error(res.message || 'Failed to follow/unfollow')
      }
    } catch (err: any) {
      console.error('Failed to follow/unfollow:', err)
      // Revert optimistic update on error
      setIsFollowing(!nextIsFollowing)
      setFollowersCount((prev) =>
        nextIsFollowing ? Math.max(0, prev - 1) : prev + 1
      )
    } finally {
      setLoading(false)
    }
  }

  console.log('profile', profile._count)

  return (
    <View className='px-6 mb-6'>
      <LinearGradient
        colors={['#122C41', '#1A2741']}
        style={{
          borderRadius: 24,
          padding: 24,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className='items-center mb-6'>
          <View className='w-24 h-24 bg-white/20 rounded-full justify-center items-center mb-4 overflow-hidden'>
            {profile.profile_picture_url ? (
              <Image
                source={{ uri: profile.profile_picture_url }}
                style={{ width: 96, height: 96, borderRadius: 48 }}
                resizeMode='cover'
              />
            ) : (
              <Text className='text-4xl'>{userData.avatar}</Text>
            )}
          </View>
          <View className='items-center'>
            <View className='flex-row items-center mb-2'>
              <Text className='text-white text-2xl font-bold mr-2'>
                {profile.display_name}
              </Text>
              <Ionicons name='checkmark-circle' size={24} color='white' />
              {isOwnProfile && (
                <View className='ml-2'>
                  <PointsDisplay size='small' showLabel={false} />
                </View>
              )}
            </View>
            <Text className='text-white/80 text-lg mb-1'>
              @{profile.tag_name}
            </Text>
            {profile.about && (
              <Text className='text-white/70 text-center text-base my-2 px-4'>
                {profile.about}
              </Text>
            )}
            <Text className='text-white/60 text-sm'>
              Member since{' '}
              {profile.created_at
                ? format(new Date(profile.created_at), 'MMMM dd, yyyy')
                : 'Unknown'}
            </Text>

            {/* Follow/Unfollow Button for other users */}
            {!isOwnProfile && (
              <TouchableOpacity
                onPress={handleFollow}
                disabled={loading}
                className={`mt-4 px-6 py-2 rounded-xl ${
                  isFollowing ? 'bg-gray-600' : 'bg-primary-500'
                }`}
              >
                <Text className='text-white text-base font-medium'>
                  {loading
                    ? 'Loading...'
                    : isFollowing
                      ? 'Following'
                      : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats */}
        {/* <View className='flex-row justify-around flex-wrap'>
          {isOwnProfile && portfolio ? (
            <StatCard
              label='Portfolio'
              value={
                hidePortfolioBalance
                  ? '••••••'
                  : '$' + formatNumber(portfolio?.totalUsd || 0)
              }
            />
          ) : (
            <StatCard label='Posts' value={postsCount} />
          )} */}

        <View className='flex-row justify-around flex-wrap'>
          {isOwnProfile && portfolio && (
            <StatCard
              label='Portfolio'
              value={
                hidePortfolioBalance
                  ? '••••••'
                  : '$' + formatNumber(portfolio?.totalUsd || 0)
              }
            />
          )}

          <StatCard label='Posts' value={postsCount} />

          {/* {isOwnProfile ? (
            <View className='items-center'>
              {isLoading ? (
                <Text className='text-white text-xl font-bold'>...</Text>
              ) : (
                <Text className='text-white text-xl font-bold'>
                  {userPoints?.level || 0}
                </Text>
              )}
              <Text className='text-gray-400 text-sm'>Level</Text>
            </View>
          ) : (
            <StatCard label='Following' value={followingCount} />
          )} */}

          {isOwnProfile ? (
            <StatCard label='Following' value={followingCount} />
          ) : (
            <StatCard label='Followers' value={followersCount} />
          )}

          {isOwnProfile && (
            <StatCard label='Followers' value={followersCount} />
          )}

          {credibilityScore !== null && (
            <StatCard
              label='Credibility'
              value={`${credibilityScore}`}
              extra={credibilityLabel}
            />
          )}
        </View>
      </LinearGradient>
    </View>
  )
}
