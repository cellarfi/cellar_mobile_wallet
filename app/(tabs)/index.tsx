import { SocialCard } from '@/components/core/home/SocialCard';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import PointsDisplay from '@/components/PointsDisplay';
import { PortfolioSummary } from '@/components/PortfolioSummary';
import { QuickActionButton } from '@/components/QuickActionButton';
import { TokenCard } from '@/components/TokenCard';
import { TokenCardSkeleton } from '@/components/TokenCardSkeleton';
import { TransactionCard } from '@/components/TransactionCard';
import { TrendingCard } from '@/components/TrendingCard';
import { TrendingCardSkeleton } from '@/components/TrendingCardSkeleton';
import { socialPosts } from '@/constants/App';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useTransactions } from '@/hooks/useTransactions';
import { useTrending } from '@/hooks/useTrending';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { profile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const { portfolio, isLoading, error, refetch } = usePortfolio();
  const {
    trending,
    isLoading: trendingLoading,
    error: trendingError,
    refetch: refetchTrending,
  } = useTrending();
  const {
    transactions,
    isLoading: transactionsLoading,
    isRefetching: transactionsRefetching,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useTransactions();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchTrending(), refetchTransactions()]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => router.push('/profile')}
              className="bg-dark-200 rounded-full p-2"
            >
              <Ionicons name="person" size={24} color="white" />
            </TouchableOpacity>
            <View>
              <Text className="text-gray-400 text-sm">
                {profile?.tag_name ? `@${profile?.tag_name}` : ''}
              </Text>
              <Text className="text-white text-lg font-bold">
                {profile?.display_name || ''}
              </Text>
            </View>
          </View>
          <View className="flex-row gap-3 items-center">
            <PointsDisplay size="small" showLabel={false} />
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(modals)/search',
                  params: {
                    mode: 'navigate',
                    title: 'Search Tokens',
                  },
                })
              }
              className="w-10 h-10 bg-dark-200 rounded-full justify-center items-center"
            >
              <Ionicons name="search" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: '/(modals)/qr-scanner' as any,
                  params: {
                    returnTo: 'send',
                    returnParam: 'scannedAddress',
                  },
                });
              }}
              className="w-10 h-10 bg-dark-200 rounded-full justify-center items-center"
            >
              <Ionicons name="scan" size={20} color="white" />
            </TouchableOpacity>
            {/* <TouchableOpacity className='w-10 h-10 bg-dark-200 rounded-full justify-center items-center'>
              <Ionicons name='person' size={20} color='white' />
            </TouchableOpacity> */}
            {/* <TouchableOpacity className='w-10 h-10 bg-dark-200 rounded-full justify-center items-center'>
              <Ionicons name='notifications-outline' size={20} color='white' />
            </TouchableOpacity> */}
          </View>
        </View>

        {/* Offline Indicator */}
        <OfflineIndicator />

        {/* Portfolio Overview */}
        <View className="px-6 mb-6">
          <PortfolioSummary />
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text className="text-white text-xl font-bold mb-4">
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            <QuickActionButton
              icon="arrow-up"
              title="Send"
              onPress={() => router.push('/(modals)/send')}
            />
            <QuickActionButton
              icon="arrow-down"
              title="Receive"
              onPress={() => router.push('/(modals)/receive')}
            />
            <QuickActionButton
              icon="swap-horizontal"
              title="Swap"
              // gradient={true}
              onPress={() => router.push('/(modals)/swap')}
            />
            <QuickActionButton
              icon="trending-up"
              title="Trade"
              onPress={() => router.push('/trading')}
            />
          </View>
        </View>

        {/* Your Tokens */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-xl font-bold">Your Tokens</Text>
            <TouchableOpacity onPress={() => router.push('/wallet')}>
              <Text className="text-primary-400 font-medium">View All</Text>
            </TouchableOpacity>
          </View>

          {isLoading && !portfolio ? (
            <TokenCardSkeleton count={3} />
          ) : error ? (
            <View className="bg-dark-200 rounded-2xl p-6 items-center">
              <Ionicons name="warning-outline" size={48} color="#ef4444" />
              <Text className="text-gray-400 text-center mt-4">{error}</Text>
              <TouchableOpacity
                onPress={() => refetch()}
                className="mt-4 bg-primary-500 rounded-xl px-4 py-2"
              >
                <Text className="text-white font-medium">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : portfolio?.items && portfolio.items.length > 0 ? (
            portfolio.items
              .slice(0, 3)
              .map((token, index) => (
                <TokenCard key={`${token.address}-${index}`} token={token} />
              ))
          ) : (
            <View className="bg-dark-200 rounded-2xl p-6 items-center">
              <Ionicons name="wallet-outline" size={48} color="#666672" />
              <Text className="text-gray-400 text-center mt-4">
                No tokens found in your wallet
              </Text>
            </View>
          )}
        </View>

        {/* Trending */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-6 mb-4">
            <Text className="text-white text-xl font-bold">Trending</Text>
            <TouchableOpacity onPress={() => router.push('/trading')}>
              <Text className="text-primary-400 font-medium">See More</Text>
            </TouchableOpacity>
          </View>
          {trendingLoading && !trending ? (
            <FlatList
              data={[]}
              renderItem={() => null}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
              ListEmptyComponent={<TrendingCardSkeleton count={3} />}
            />
          ) : trendingError ? (
            <View className="px-6">
              <View className="bg-dark-200 rounded-2xl p-6 items-center">
                <Ionicons
                  name="trending-down-outline"
                  size={48}
                  color="#ef4444"
                />
                <Text className="text-gray-400 text-center mt-4">
                  {trendingError}
                </Text>
                <TouchableOpacity
                  onPress={() => refetchTrending()}
                  className="mt-4 bg-primary-500 rounded-xl px-4 py-2"
                >
                  <Text className="text-white font-medium">Retry</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : trending?.tokens && trending.tokens.length > 0 ? (
            <FlatList
              data={trending.tokens.slice(0, 5)}
              renderItem={({ item }) => <TrendingCard token={item} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            />
          ) : (
            <View className="px-6">
              <View className="bg-dark-200 rounded-2xl p-6 items-center">
                <Ionicons
                  name="trending-up-outline"
                  size={48}
                  color="#666672"
                />
                <Text className="text-gray-400 text-center mt-4">
                  No trending tokens available
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Activity */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-xl font-bold">Activity</Text>
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: '/wallet',
                  params: { tab: 'history' },
                });
              }}
            >
              <Text className="text-primary-400 font-medium">See More</Text>
            </TouchableOpacity>
          </View>
          {transactionsLoading && !transactionsRefetching ? (
            <View className="bg-dark-200 rounded-2xl p-6 items-center">
              <View className="w-full h-16 bg-dark-300 rounded-xl mb-3 animate-pulse" />
              <View className="w-full h-16 bg-dark-300 rounded-xl mb-3 animate-pulse" />
              <View className="w-full h-16 bg-dark-300 rounded-xl animate-pulse" />
            </View>
          ) : transactionsError ? (
            <View className="bg-dark-200 rounded-2xl p-6 items-center">
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <Text className="text-gray-400 text-center mt-4">
                {transactionsError}
              </Text>
              <TouchableOpacity
                onPress={() => refetchTransactions()}
                className="mt-4 bg-primary-500 rounded-xl px-4 py-2"
              >
                <Text className="text-white font-medium">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : transactions && transactions.length > 0 ? (
            <>
              {transactions.slice(0, 3).map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onPress={() => {
                    router.push({
                      pathname: '/(modals)/transaction-details',
                      params: { transactionId: transaction.id },
                    });
                  }}
                />
              ))}
            </>
          ) : (
            <View className="bg-dark-200 rounded-2xl p-6 items-center">
              <Ionicons name="time-outline" size={48} color="#666672" />
              <Text className="text-gray-400 text-center mt-4">
                No recent activity found
              </Text>
            </View>
          )}
        </View>

        {/* Social Feed */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-xl font-bold">
              Community Pulse
            </Text>
            <TouchableOpacity onPress={() => router.push('/social')}>
              <Text className="text-primary-400 font-medium">View All</Text>
            </TouchableOpacity>
          </View>
          {socialPosts.map((post) => (
            <SocialCard key={post.id} post={post} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
