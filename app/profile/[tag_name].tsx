import ProfileCard from '@/components/core/profile/ProfileCard'
import ProfileHeader from '@/components/core/profile/ProfileHeader'
import QuickActions from '@/components/core/profile/QuickActions'
import UserPosts from '@/components/core/profile/UserPosts'
import UserSwapActivity from '@/components/core/profile/UserSwapActivity'
import Tabs from '@/components/core/social/Tabs'
import { usePoints } from '@/hooks/usePoints'
import { usePortfolio } from '@/hooks/usePortfolio'
import { tapestryRequests } from '@/libs/api_requests/tapestry.request'
import { useAuthStore } from '@/store/authStore'
import { User } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ProfileScreen() {
  const { tag_name } = useLocalSearchParams()
  const { profile: currentUserProfile, isAuthenticated } = useAuthStore()
  const { portfolio } = usePortfolio()
  const { userPoints, isLoading: isLoadingPoints } = usePoints()

  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'swaps'>('posts')
  const scrollViewRef = useRef<ScrollView>(null)
  const fadeAnim = useRef(new Animated.Value(0)).current

  // Determine if viewing own profile
  const isOwnProfile = !tag_name || tag_name === currentUserProfile?.tag_name

  /* 
     Wrap in useCallback to stabilize reference 
     forceRefetch allows bypassing the existing-profile check
  */
  const fetchUserProfile = useCallback(
    async (tagName: string, forceRefetch = false) => {
      // Only set main loading state if we don't have a profile yet and aren't forcing a refresh
      if (!userProfile && !forceRefetch) {
        setLoading(true)
      }
      setError(null)
      try {
        const response = await tapestryRequests.getUserByTagNameV2(tagName)
        if (response.success) {
          setUserProfile(response.data || null)
        } else {
          setError(response.message || 'Failed to fetch user profile')
        }
        console.log('response.data', response.data)
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch user profile')
      } finally {
        if (!forceRefetch) setLoading(false)
      }
    },
    [userProfile],
  )

  useEffect(() => {
    if (!currentUserProfile) {
      // Only redirect to setup profile if user is authenticated
      // If not authenticated (e.g. logging out), let AuthProvider handle navigation
      if (isAuthenticated) {
        router.replace('/setup-profile')
      }
      return
    }

    // If viewing another user's profile, fetch their data
    if (!isOwnProfile && tag_name) {
      fetchUserProfile(tag_name as string)
    } else {
      // Use current user's profile
      setUserProfile(currentUserProfile)
    }
  }, [
    tag_name,
    currentUserProfile,
    isOwnProfile,
    isAuthenticated,
    fetchUserProfile,
  ])

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      // Trigger post refresh
      setRefreshTrigger((prev) => prev + 1)

      // Refresh user profile
      const targetTagName = (
        isOwnProfile ? currentUserProfile?.tag_name : tag_name
      ) as string
      if (targetTagName) {
        await fetchUserProfile(targetTagName)
      }
    } finally {
      // Small delay to allow post refresh to start/complete visually
      // In a real app we might want to wait for posts too, but this provides good feedback
      setTimeout(() => setRefreshing(false), 500)
    }
  }

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y
    const shouldShow = offsetY > 300 // Show button after scrolling 300px

    if (shouldShow !== showScrollToTop) {
      setShowScrollToTop(shouldShow)
      Animated.timing(fadeAnim, {
        toValue: shouldShow ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true })
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
      {/* Sticky Header */}
      <View className='bg-primary-main z-10'>
        <ProfileHeader
          isOwnProfile={isOwnProfile}
          userProfile={isOwnProfile ? undefined : userProfile}
        />
      </View>

      <ScrollView
        ref={scrollViewRef}
        className='flex-1'
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor='#6366f1'
          />
        }
      >
        {/* Profile Card */}
        <ProfileCard
          profile={userProfile}
          portfolio={isOwnProfile ? portfolio : undefined}
          userPoints={isOwnProfile ? userPoints : undefined}
          isLoading={isLoadingPoints}
          isOwnProfile={isOwnProfile}
        />

        {/* Quick Actions */}
        <QuickActions
          isOwnProfile={isOwnProfile}
          userProfile={isOwnProfile ? undefined : userProfile}
        />

        {/* Posts / Swaps Tabs */}
        <View className='px-6 mb-4'>
          <Tabs
            tabs={['posts', 'swaps']}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as 'posts' | 'swaps')}
          />
        </View>

        {/* Tab content: Posts (default) or Swaps (lazy-loaded when tab is selected) */}
        {activeTab === 'posts' && (
          <UserPosts
            tagName={userProfile.tag_name}
            isOwnProfile={isOwnProfile}
            refreshTrigger={refreshTrigger}
          />
        )}
        {activeTab === 'swaps' && (
          <UserSwapActivity tagName={userProfile.tag_name} />
        )}
      </ScrollView>

      {/* Scroll to Top Button */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          opacity: fadeAnim,
          zIndex: 1000,
          pointerEvents: showScrollToTop ? 'auto' : 'none',
        }}
      >
        <TouchableOpacity
          onPress={scrollToTop}
          disabled={!showScrollToTop}
          className='w-14 h-14 bg-secondary rounded-full justify-center items-center shadow-lg'
          activeOpacity={0.8}
          style={{
            shadowColor: '#00C2CB',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons name='arrow-up' size={24} color='white' />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  )
}
