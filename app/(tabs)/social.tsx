import Header from '@/components/core/social/Header'
import PostCard from '@/components/core/social/PostCard'
import Tabs from '@/components/core/social/Tabs'
import { Colors } from '@/constants/Colors'
import { followsRequests } from '@/libs/api_requests/follows.request'
import { PostsRequests } from '@/libs/api_requests/posts.request'
import { SocialFiRequests } from '@/libs/api_requests/socialfi.request'
import { useAuthStore } from '@/store/authStore'
import { useSocialEventsStore } from '@/store/socialEventsStore'
import { Post } from '@/types/posts.interface'
import { SuggestedAccounts } from '@/types/socialfi.interface'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function SocialScreen() {
  const [activeTab, setActiveTab] = useState<'feed' | 'trending' | 'following'>(
    'feed'
  )
  const [refreshing, setRefreshing] = useState(false)
  const [socialPosts, setSocialPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([])
  const [loadingTrending, setLoadingTrending] = useState(false)
  const [errorTrending, setErrorTrending] = useState<string | null>(null)
  const [suggestedAccounts, setSuggestedAccounts] = useState<
    SuggestedAccounts[]
  >([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [errorSuggestions, setErrorSuggestions] = useState<string | null>(null)
  const [personalizedPosts, setPersonalizedPosts] = useState<Post[]>([])
  const [loadingPersonalized, setLoadingPersonalized] = useState(false)
  const [errorPersonalized, setErrorPersonalized] = useState<string | null>(
    null
  )
  const [trendingTopics, setTrendingTopics] = useState<
    { tag: string; count: number }[]
  >([])
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [errorTopics, setErrorTopics] = useState<string | null>(null)
  const [postTypeFilter, setPostTypeFilter] = useState<
    'ALL' | 'REGULAR' | 'DONATION' | 'TOKEN_CALL'
  >('ALL')
  const { profile } = useAuthStore()
  const [paginationData, setPaginationData] = useState<{
    pagination: {
      page: number
      pageSize: number
      totalPosts: number
      totalPages: number
    }
  } | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMorePages, setHasMorePages] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [renderedPostsCount, setRenderedPostsCount] = useState(0)

  const refreshFeed = useSocialEventsStore((state) => state.refreshFeed)
  const resetRefresh = useSocialEventsStore((state) => state.resetRefresh)
  const triggerRefresh = useSocialEventsStore((state) => state.triggerRefresh)

  const fetchPosts = async (page = 1, append = false) => {
    if (page === 1) {
      setLoading(true)
      setError(null)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const res = await PostsRequests.getPosts(String(page))
      if (res.success) {
        const newPosts = res.data || []
        // console.log('New Posts:', (res.data as Post[])[0])
        if (append) {
          setSocialPosts((prev) => [...prev, ...newPosts])
        } else {
          setSocialPosts(newPosts)
        }
        setPaginationData(res.data.pagination || null)

        // Check if there are more pages
        if (res.data.pagination) {
          setHasMorePages(page < res.data.pagination.totalPages)
        }
      } else {
        setError(res.message || 'Failed to fetch posts')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch posts')
    } finally {
      setLoading(false)
      setIsLoadingMore(false)
    }
  }

  const fetchTrendingPosts = async (page = 1, append = false) => {
    setLoadingTrending(true)
    setErrorTrending(null)

    if (page === 1) {
      setLoading(true)
      setError(null)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const res = await PostsRequests.trendingPosts(String(page))
      if (res.success) {
        const newPosts = res.data || []

        if (append) {
          setTrendingPosts((prev) => [...prev, ...newPosts])
        } else {
          setTrendingPosts(newPosts)
        }

        // Set pagination Data
        setPaginationData(res.data.pagination || null)

        // Check if there are more pages
        if (res.data.pagination) {
          setHasMorePages(page < res.data.pagination.totalPages)
        }
      } else {
        setErrorTrending(res.message || 'Failed to fetch trending posts')
      }
    } catch (err: any) {
      setErrorTrending(err?.message || 'Failed to fetch trending posts')
    } finally {
      setLoading(false)
      setLoadingTrending(false)
    }
  }

  const fetchSuggestedAccounts = async () => {
    setLoadingSuggestions(true)
    setErrorSuggestions(null)
    try {
      const res = await followsRequests.getSuggestedAccounts()
      if (res.success) {
        setSuggestedAccounts(res.data || [])
        setPaginationData(res.data.pagination || null)
      } else {
        setErrorSuggestions(res.message || 'Failed to fetch suggestions')
      }
    } catch (err: any) {
      setErrorSuggestions(err?.message || 'Failed to fetch suggestions')
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const fetchTrendingTopics = async () => {
    setLoadingTopics(true)
    setErrorTopics(null)
    try {
      const res = await SocialFiRequests.getPopularHashtags()
      if (res.success) {
        setTrendingTopics(res.data || [])
        setPaginationData(res.data.pagination || null)
      } else {
        setErrorTopics(res.message || 'Failed to fetch trending topics')
      }
    } catch (err: any) {
      setErrorTopics(err?.message || 'Failed to fetch trending topics')
    } finally {
      setLoadingTopics(false)
    }
  }

  const fetchPersonalizedPosts = async (page = 1, append = false) => {
    setLoadingPersonalized(true)
    setErrorPersonalized(null)
    try {
      const res = await PostsRequests.followingPosts(String(page))
      if (res.success) {
        const newPosts = res.data || []
        if (append) {
          setPersonalizedPosts((prev) => [...prev, ...newPosts])
        } else {
          setPersonalizedPosts(res.data || [])
        }

        // Set Pagination Data
        setPaginationData(res.data.pagination || null)

        // Check if there are more pages
        if (res.data.pagination) {
          setHasMorePages(page < res.data.pagination.totalPages)
        }
      } else {
        setErrorPersonalized(
          res.message || 'Failed to fetch personalized posts'
        )
      }
    } catch (err: any) {
      setErrorPersonalized(err?.message || 'Failed to fetch personalized posts')
    } finally {
      setLoadingPersonalized(false)
    }
  }

  useEffect(() => {
    fetchPosts()
    fetchTrendingTopics()
  }, [])

  useEffect(() => {
    if (activeTab === 'trending') {
      fetchTrendingPosts()
      fetchTrendingTopics()
    }
  }, [activeTab])

  useEffect(() => {
    if (refreshFeed) {
      fetchPosts()
      resetRefresh()
    }
  }, [refreshFeed])

  useEffect(() => {
    if (activeTab === 'following') {
      fetchSuggestedAccounts()
      fetchPersonalizedPosts()
    }
  }, [activeTab, profile?.id])

  const getCurrentPosts = useCallback(() => {
    switch (activeTab) {
      case 'feed':
        return socialPosts
      case 'trending':
        return trendingPosts
      case 'following':
        return personalizedPosts
      default:
        return []
    }
  }, [activeTab, personalizedPosts, socialPosts, trendingPosts])

  const filterPosts = useCallback(
    (posts: Post[]) => {
      if (postTypeFilter === 'ALL') return posts
      return posts.filter((post) => post.post_type === postTypeFilter)
    },
    [postTypeFilter]
  )

  // Track when 10 posts have been rendered
  useEffect(() => {
    const filteredPosts = filterPosts(getCurrentPosts())
    if (filteredPosts.length >= 10 && renderedPostsCount < 10) {
      setRenderedPostsCount(10)
      // Your state increment logic here
    }
  }, [
    socialPosts,
    trendingPosts,
    personalizedPosts,
    activeTab,
    postTypeFilter,
    filterPosts,
    getCurrentPosts,
    renderedPostsCount,
  ])

  const onRefresh = async () => {
    setRefreshing(true)
    setCurrentPage(1)
    setHasMorePages(true)

    if (activeTab === 'feed') {
      await fetchPosts(1, false)
    } else if (activeTab === 'trending') {
      await fetchTrendingPosts()
    } else if (activeTab === 'following') {
      await fetchPersonalizedPosts()
    }
    setRefreshing(false)
  }

  // Handle pagination for feed tab
  const handleEndReached = useCallback(() => {
    if (hasMorePages && !isLoadingMore) {
      console.log('User reached the end, loading more posts...')
      //let nextPage = currentPage
      //if(currentPage < p){
      const nextPage = currentPage + 1
      //}
      setCurrentPage(nextPage)
      if (activeTab == 'feed') {
        fetchPosts(nextPage, true)
      } else if (activeTab == 'trending') {
        fetchTrendingPosts(nextPage, true)
      } else {
        fetchPersonalizedPosts(nextPage, true)
      }
    }
  }, [activeTab, hasMorePages, isLoadingMore, currentPage])

  const handleLike = async (postId: string) => {
    console.log('Handle Like for', postId)
    const currentPosts = getCurrentPosts()
    const post = currentPosts.find((post) => post.id === postId)
    if (!post) return

    const updatedPost = {
      ...post,
      like: {
        ...post?.like,
        status: !post?.like?.status,
      },
      _count: {
        ...post._count,
        like: post?.like?.status ? post._count.like - 1 : post._count.like + 1,
      },
    }

    // Optimistically update the UI based on active tab
    const updatePosts = (prevPosts: Post[]) =>
      prevPosts.map((p) => (p.id === postId ? updatedPost : p))

    if (activeTab === 'feed') {
      setSocialPosts(updatePosts)
    } else if (activeTab === 'trending') {
      setTrendingPosts(updatePosts)
    } else if (activeTab === 'following') {
      setPersonalizedPosts(updatePosts)
    }

    try {
      if (post?.like?.status) {
        const response = await PostsRequests.unlikePost(post.like.id, postId)
        if (!response.success) {
          throw new Error('Failed to unlike post')
        }
      } else {
        const response = await PostsRequests.likePost(postId)
        if (!response.success) {
          throw new Error('Failed to like post')
        }

        // Update the like id with the response data
        const updateLikeId = (prevPosts: Post[]) =>
          prevPosts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  like: { ...p.like, id: response.data.id },
                }
              : p
          )

        if (activeTab === 'feed') {
          setSocialPosts(updateLikeId)
        } else if (activeTab === 'trending') {
          setTrendingPosts(updateLikeId)
        } else if (activeTab === 'following') {
          setPersonalizedPosts(updateLikeId)
        }
      }
      triggerRefresh()
    } catch (error) {
      // Revert the changes if the API call fails
      const revertPosts = (prevPosts: Post[]) =>
        prevPosts.map((p) => (p.id === postId ? post : p))

      if (activeTab === 'feed') {
        setSocialPosts(revertPosts)
      } else if (activeTab === 'trending') {
        setTrendingPosts(revertPosts)
      } else if (activeTab === 'following') {
        setPersonalizedPosts(revertPosts)
      }
      alert('Failed to update like status')
    }
  }

  const handleFollow = async (userId: string) => {
    setSuggestedAccounts((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, following: !user.following } : user
      )
    )
    try {
      const res = await followsRequests.followUser(userId)
      if (!res.success) {
        setSuggestedAccounts((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, following: !user.following } : user
          )
        )
        alert(res.message || 'Failed to follow/unfollow')
      } else {
        fetchSuggestedAccounts()
        fetchPersonalizedPosts()
      }
    } catch (err: any) {
      setSuggestedAccounts((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, following: !user.following } : user
        )
      )
      alert('Failed to follow/unfollow')
    }
  }

  const handleHashtagPress = (tag: string) => {
    router.push({
      pathname: '/(modals)/hashtag-posts',
      params: { hashtag: tag },
    })
  }

  const TrendingCard = ({ topic }: any) => (
    <TouchableOpacity
      className='bg-secondary-light rounded-2xl p-4 mr-3 w-40'
      onPress={() => handleHashtagPress(topic.tag)}
    >
      <Text className='text-primary-400 font-semibold text-lg mb-1'>
        #{topic.tag ?? ''}
      </Text>
      <Text className='text-gray-400 text-sm'>{topic.count ?? 0} posts</Text>
    </TouchableOpacity>
  )

  const UserCard = ({ user }: { user: SuggestedAccounts }) => (
    <TouchableOpacity
      className='bg-secondary-light rounded-2xl p-4 mr-3 w-48'
      onPress={() => router.push(`/profile/${user.tag_name}` as any)}
    >
      <View className='flex-row items-center justify-between mb-3'>
        <View className='w-12 h-12 bg-primary-500/20 rounded-full justify-center items-center'>
          {user.profile_picture_url ? (
            <Image
              source={{ uri: user.profile_picture_url }}
              style={{ width: 48, height: 48, borderRadius: 24 }}
              resizeMode='cover'
            />
          ) : (
            <Text className='text-lg text-white'>
              {user.display_name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          )}
        </View>
        <TouchableOpacity
          className={`px-3 py-1 rounded-xl ${
            user.following ? 'bg-gray-600' : 'bg-secondary'
          }`}
          onPress={(e) => {
            e.stopPropagation()
            handleFollow(user.id)
          }}
        >
          <Text className='text-white text-sm font-medium'>
            {user.following ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
      <View className='flex-row items-center mb-1'>
        <Text className='text-white font-semibold mr-2'>
          {user.display_name ?? ''}
        </Text>
      </View>
      <Text className='text-gray-400 text-sm mb-2'>@{user.tag_name ?? ''}</Text>
      <Text className='text-gray-500 text-xs'>
        {user._count?.followers ?? 0} followers
      </Text>
    </TouchableOpacity>
  )

  const renderPostItem = ({ item }: { item: Post }) => (
    <PostCard key={item.id} post={item} onLike={handleLike} />
  )

  const renderFooter = () => {
    if (!isLoadingMore) return null

    return (
      <View className='flex-1 justify-center items-center py-4'>
        <ActivityIndicator color='#6366f1' />
      </View>
    )
  }

  // Header component with all the UI above posts
  const renderListHeader = () => (
    <View>
      {/* Post Composer Trigger */}
      <TouchableOpacity
        className='bg-secondary-light rounded-xl py-3 px-6 mb-6 flex-row items-center border'
        activeOpacity={0.85}
        onPress={() => router.push('/(modals)/create-post')}
      >
        <View className='w-9 h-9 bg-primary-main rounded-full justify-center items-center mr-3'>
          <Ionicons name='pencil' size={16} color={Colors.dark.text} />
        </View>
        <Text className='text-gray-400 font-medium flex-1'>
          What&apos;s happening in crypto?
        </Text>
        <View className='px-3 py-1.5 bg-primary-main rounded-lg'>
          <Text className='text-white text-xs font-medium'>Post</Text>
        </View>
      </TouchableOpacity>

      {/* Tabs */}
      <View>
        <Tabs
          tabs={['feed', 'trending', 'following']}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab)
            setCurrentPage(1)
            setPostTypeFilter('ALL')
            setCurrentPage(1)
            setHasMorePages(true)
          }}
        />
      </View>

      {/* Following tab specific content */}
      {activeTab === 'following' && (
        <View>
          <Text className='text-white text-lg font-semibold mb-4'>
            Suggested for You
          </Text>
          {loadingSuggestions ? (
            <View className='flex-1 justify-center items-center mt-4'>
              <Text className='text-white'>Loading suggestions...</Text>
            </View>
          ) : errorSuggestions ? (
            <View className='flex-1 justify-center items-center mt-4'>
              <Text className='text-white'>Error: {errorSuggestions}</Text>
            </View>
          ) : suggestedAccounts.length === 0 ? (
            <View className='flex-1 justify-center items-center mt-4'>
              <Text className='text-white'>No suggestions found.</Text>
            </View>
          ) : (
            <FlatList
              data={suggestedAccounts}
              renderItem={({ item }) => <UserCard user={item} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 24 }}
              keyExtractor={(item) => item.id}
            />
          )}

          <Text className='text-white text-lg font-semibold mb-4 mt-6'>
            From People You Follow
          </Text>
        </View>
      )}
    </View>
  )

  const getCurrentData = () => {
    const posts = filterPosts(getCurrentPosts())

    if (activeTab === 'feed') {
      return {
        data: posts,
        loading: loading,
        error: error,
        emptyMessage: 'No posts yet.',
      }
    } else if (activeTab === 'trending') {
      return {
        data: posts,
        loading: loadingTrending,
        error: errorTrending,
        emptyMessage: 'No trending posts yet.',
      }
    } else {
      return {
        data: posts,
        loading: loadingPersonalized,
        error: errorPersonalized,
        emptyMessage: 'No personalized posts found.',
      }
    }
  }

  const {
    data,
    loading: currentLoading,
    error: currentError,
    emptyMessage,
  } = getCurrentData()

  if (currentLoading && data.length === 0) {
    return (
      <SafeAreaView className='flex-1 bg-primary-main' edges={['top']}>
        <Header
          title='Social'
          onSearch={() => router.push('/(modals)/find-posts')}
        />
        <View className='flex-1 justify-center items-center'>
          <ActivityIndicator color='#6366f1' />
          <Text className='text-white'>Loading Posts</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (currentError && data.length === 0) {
    return (
      <SafeAreaView className='flex-1 bg-primary-main' edges={['top']}>
        <Header
          title='Social'
          onSearch={() => router.push('/(modals)/find-posts')}
        />
        <View className='flex-1 justify-center items-center'>
          <Text className='text-white'>Error: {currentError}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className='flex-1 bg-primary-main' edges={['top']}>
      <Header
        title='Social'
        onSearch={() => router.push('/(modals)/find-posts')}
        activeFilter={postTypeFilter}
        onFilter={(filter) => setPostTypeFilter(filter)}
      />

      {data.length === 0 ? (
        <View className='px-6 flex-1'>
          {renderListHeader()}
          <View className='flex-1 justify-center items-center'>
            <Text className='text-white'>{emptyMessage}</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={data}
          className='px-6 mb-4'
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor='#6366f1'
            />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  )
}
