import ProfileCard from '@/components/core/profile/ProfileCard'
import ProfileHeader from '@/components/core/profile/ProfileHeader'
import QuickActions from '@/components/core/profile/QuickActions'
import UserPosts from '@/components/core/profile/UserPosts'
import { usePoints } from '@/hooks/usePoints'
import { usePortfolio } from '@/hooks/usePortfolio'
import { userRequests } from '@/libs/api_requests/user.request'
import { useAuthStore } from '@/store/authStore'
import { User } from '@/types'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ProfileScreen() {
  const { tag_name } = useLocalSearchParams()
  const { profile: currentUserProfile } = useAuthStore()
  const { portfolio } = usePortfolio()
  const { userPoints, isLoading: isLoadingPoints } = usePoints()

  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Determine if viewing own profile
  const isOwnProfile = !tag_name || tag_name === currentUserProfile?.tag_name

  useEffect(() => {
    if (!currentUserProfile) {
      router.replace('/setup-profile')
      return
    }

    // If viewing another user's profile, fetch their data
    if (!isOwnProfile && tag_name) {
      fetchUserProfile(tag_name as string)
    } else {
      // Use current user's profile
      setUserProfile(currentUserProfile)
    }
  }, [tag_name, currentUserProfile, isOwnProfile])

  const fetchUserProfile = async (tagName: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await userRequests.getUserByTagName(tagName)
      if (response.success) {
        setUserProfile(response.data)
      } else {
        setError(response.message || 'Failed to fetch user profile')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch user profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView className='flex-1 bg-primary-main' edges={['top']}>
        <ProfileHeader isOwnProfile={isOwnProfile} />
        <View className='flex-1 justify-center items-center'>
          <ActivityIndicator color='#6366f1' size='large' />
          <Text className='text-gray-400 mt-4'>Loading profile...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView className='flex-1 bg-primary-main' edges={['top']}>
        <ProfileHeader isOwnProfile={isOwnProfile} />
        <View className='flex-1 justify-center items-center px-6'>
          <Text className='text-red-400 text-center'>{error}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!userProfile) {
    return (
      <SafeAreaView className='flex-1 bg-primary-main' edges={['top']}>
        <ProfileHeader isOwnProfile={isOwnProfile} />
        <View className='flex-1 justify-center items-center'>
          <Text className='text-gray-400'>Profile not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className='flex-1 bg-primary-main' edges={['top']}>
      <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
        {/* Header */}
        <ProfileHeader isOwnProfile={isOwnProfile} />

        {/* Profile Card */}
        <ProfileCard
          profile={userProfile}
          portfolio={isOwnProfile ? portfolio : undefined}
          userPoints={isOwnProfile ? userPoints : undefined}
          isLoading={isLoadingPoints}
          isOwnProfile={isOwnProfile}
        />

        {/* Quick Actions */}
        <QuickActions isOwnProfile={isOwnProfile} />

        {/* User Posts */}
        <UserPosts tagName={userProfile.tag_name} isOwnProfile={isOwnProfile} />
      </ScrollView>
    </SafeAreaView>
  )
}
