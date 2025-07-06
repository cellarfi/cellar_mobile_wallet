import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Mock data
const socialPosts = [
  {
    id: 1,
    user: {
      username: '@cryptowhale',
      displayName: 'Crypto Whale',
      avatar: '🐋',
      verified: true,
      followers: '125K',
    },
    content:
      'SOL looking bullish after breaking $200 resistance! 🚀 The ecosystem is thriving with new projects launching daily. What are your thoughts on the current price action?',
    images: [],
    timestamp: '2h ago',
    likes: 342,
    comments: 28,
    tips: {
      amount: 156.5,
      currency: 'USDC',
    },
    isLiked: false,
    isTipped: false,
  },
  {
    id: 2,
    user: {
      username: '@defi_trader',
      displayName: 'DeFi Trader',
      avatar: '💎',
      verified: false,
      followers: '45K',
    },
    content:
      'New liquidity mining opportunity on Raydium. APY looks interesting 👀\n\nRAY/SOL pool showing 85% APY right now. DYOR but this could be a good short-term opportunity for yield farmers.',
    images: [],
    timestamp: '4h ago',
    likes: 189,
    comments: 42,
    tips: {
      amount: 89.2,
      currency: 'USDC',
    },
    isLiked: true,
    isTipped: false,
  },
  {
    id: 3,
    user: {
      username: '@nft_collector',
      displayName: 'NFT Collector',
      avatar: '🎨',
      verified: true,
      followers: '89K',
    },
    content:
      'Just snagged this rare Mad Lad! 🦍 Floor is pumping hard and I think we are still early. The utility roadmap for 2024 looks incredibly promising.',
    images: ['🦍'],
    timestamp: '6h ago',
    likes: 567,
    comments: 73,
    tips: {
      amount: 234.8,
      currency: 'USDC',
    },
    isLiked: false,
    isTipped: true,
  },
]

const trendingTopics = [
  { tag: '#Solana', posts: '12.5K' },
  { tag: '#DeFi', posts: '8.9K' },
  { tag: '#NFTs', posts: '6.2K' },
  { tag: '#JupiterDAO', posts: '4.1K' },
  { tag: '#MadLads', posts: '3.8K' },
]

const suggestedUsers = [
  {
    username: '@solana',
    displayName: 'Solana',
    avatar: '◉',
    verified: true,
    followers: '2.1M',
    isFollowing: false,
  },
  {
    username: '@raydium',
    displayName: 'Raydium',
    avatar: '⚡',
    verified: true,
    followers: '456K',
    isFollowing: true,
  },
]

export default function SocialScreen() {
  const [activeTab, setActiveTab] = useState<'feed' | 'trending' | 'following'>(
    'feed'
  )
  const [refreshing, setRefreshing] = useState(false)
  const [postText, setPostText] = useState('')

  const onRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 2000)
  }

  const handleLike = (postId: number) => {
    // Handle like functionality
    console.log('Like post:', postId)
  }

  const handleTip = (postId: number) => {
    // Navigate to tip modal
    router.push('/(modals)/tip-user')
  }

  const handleComment = (postId: number) => {
    // Navigate to comments
    router.push('/(modals)/post-comments')
  }

  const PostCard = ({ post }: any) => (
    <View className='bg-dark-200 rounded-2xl p-4 mb-4'>
      {/* User Header */}
      <View className='flex-row items-center justify-between mb-3'>
        <View className='flex-row items-center flex-1'>
          <View className='w-12 h-12 bg-primary-500/20 rounded-full justify-center items-center mr-3'>
            <Text className='text-lg'>{post.user.avatar}</Text>
          </View>
          <View className='flex-1'>
            <View className='flex-row items-center'>
              <Text className='text-white font-semibold mr-2'>
                {post.user.displayName}
              </Text>
              {post.user.verified && (
                <Ionicons name='checkmark-circle' size={16} color='#6366f1' />
              )}
            </View>
            <Text className='text-gray-400 text-sm'>
              {post.user.username} • {post.timestamp}
            </Text>
          </View>
        </View>
        <TouchableOpacity className='p-2'>
          <Ionicons name='ellipsis-horizontal' size={20} color='#666672' />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Text className='text-white leading-6 mb-3'>{post.content}</Text>

      {/* Images */}
      {post.images.length > 0 && (
        <View className='mb-3'>
          <View className='w-full h-48 bg-dark-300 rounded-xl justify-center items-center'>
            <Text className='text-6xl'>{post.images[0]}</Text>
          </View>
        </View>
      )}

      {/* Engagement Stats */}
      <View className='flex-row items-center justify-between py-3 border-t border-dark-300'>
        <View className='flex-row items-center gap-6'>
          <TouchableOpacity
            onPress={() => handleLike(post.id)}
            className='flex-row items-center'
          >
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={post.isLiked ? '#ef4444' : '#666672'}
            />
            <Text className='text-gray-400 text-sm ml-2'>{post.likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleComment(post.id)}
            className='flex-row items-center'
          >
            <Ionicons name='chatbubble-outline' size={20} color='#666672' />
            <Text className='text-gray-400 text-sm ml-2'>{post.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity className='flex-row items-center'>
            <Ionicons name='arrow-redo-outline' size={20} color='#666672' />
            <Text className='text-gray-400 text-sm ml-2'>Share</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => handleTip(post.id)}
          className={`flex-row items-center px-3 py-2 rounded-xl ${
            post.isTipped ? 'bg-success-500/20' : 'bg-dark-300'
          }`}
        >
          <Ionicons
            name='cash'
            size={18}
            color={post.isTipped ? '#10b981' : '#666672'}
          />
          <Text
            className={`text-sm ml-2 font-medium ${
              post.isTipped ? 'text-success-400' : 'text-gray-400'
            }`}
          >
            ${post.tips.amount}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const TrendingCard = ({ topic }: any) => (
    <TouchableOpacity className='bg-dark-200 rounded-2xl p-4 mr-3 w-40'>
      <Text className='text-primary-400 font-semibold text-lg mb-1'>
        {topic.tag}
      </Text>
      <Text className='text-gray-400 text-sm'>{topic.posts} posts</Text>
    </TouchableOpacity>
  )

  const UserCard = ({ user }: any) => (
    <View className='bg-dark-200 rounded-2xl p-4 mr-3 w-48'>
      <View className='flex-row items-center justify-between mb-3'>
        <View className='w-12 h-12 bg-primary-500/20 rounded-full justify-center items-center'>
          <Text className='text-lg'>{user.avatar}</Text>
        </View>
        <TouchableOpacity
          className={`px-3 py-1 rounded-xl ${
            user.isFollowing ? 'bg-gray-600' : 'bg-primary-500'
          }`}
        >
          <Text className='text-white text-sm font-medium'>
            {user.isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
      <View className='flex-row items-center mb-1'>
        <Text className='text-white font-semibold mr-2'>
          {user.displayName}
        </Text>
        {user.verified && (
          <Ionicons name='checkmark-circle' size={14} color='#6366f1' />
        )}
      </View>
      <Text className='text-gray-400 text-sm mb-2'>{user.username}</Text>
      <Text className='text-gray-500 text-xs'>{user.followers} followers</Text>
    </View>
  )

  return (
    <SafeAreaView className='flex-1 bg-dark-50' edges={['top']}>
      <View className='flex-1'>
        {/* Header */}
        <View className='flex-row items-center justify-between px-6 py-4'>
          <Text className='text-white text-2xl font-bold'>Social</Text>
          <View className='flex-row gap-3'>
            <TouchableOpacity className='w-10 h-10 bg-dark-200 rounded-full justify-center items-center'>
              <Ionicons name='search' size={20} color='#6366f1' />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(modals)/create-post')}
              className='w-10 h-10 bg-primary-500 rounded-full justify-center items-center'
            >
              <Ionicons name='add' size={20} color='white' />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View className='px-6 mb-4'>
          <View className='flex-row bg-dark-200 rounded-2xl p-1'>
            {(['feed', 'trending', 'following'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-xl ${
                  activeTab === tab ? 'bg-primary-500' : ''
                }`}
              >
                <Text
                  className={`text-center font-medium capitalize ${
                    activeTab === tab ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content */}
        <ScrollView
          className='flex-1 px-6'
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor='#6366f1'
            />
          }
        >
          {activeTab === 'feed' && (
            <View>
              {/* Quick Post */}
              <View className='bg-dark-200 rounded-2xl p-4 mb-6'>
                <View className='flex-row items-center mb-3'>
                  <View className='w-10 h-10 bg-primary-500/20 rounded-full justify-center items-center mr-3'>
                    <Text>🎯</Text>
                  </View>
                  <Text className='text-white font-medium'>
                    Share your thoughts...
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/(modals)/create-post')}
                  className='bg-dark-300 rounded-xl px-4 py-3'
                >
                  <Text className='text-gray-400'>
                    What is happening in crypto today?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Posts */}
              {socialPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </View>
          )}

          {activeTab === 'trending' && (
            <View>
              <Text className='text-white text-lg font-semibold mb-4'>
                Trending Topics
              </Text>
              <FlatList
                data={trendingTopics}
                renderItem={({ item }) => <TrendingCard topic={item} />}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 24 }}
              />

              <Text className='text-white text-lg font-semibold mb-4 mt-6'>
                Trending Posts
              </Text>
              {socialPosts.slice(0, 2).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </View>
          )}

          {activeTab === 'following' && (
            <View>
              <Text className='text-white text-lg font-semibold mb-4'>
                Suggested for You
              </Text>
              <FlatList
                data={suggestedUsers}
                renderItem={({ item }) => <UserCard user={item} />}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 24 }}
              />

              <Text className='text-white text-lg font-semibold mb-4 mt-6'>
                From People You Follow
              </Text>
              {socialPosts.slice(1, 3).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}
