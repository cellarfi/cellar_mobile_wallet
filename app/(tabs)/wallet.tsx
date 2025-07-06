import { ActionButton } from '@/components/core/wallet/ActionButton'
import { HistoryTab, HistoryTabRef } from '@/components/core/wallet/HistoryTab'
import { NFTsTab, NFTsTabRef } from '@/components/core/wallet/NFTsTab'
import { TokensTab, TokensTabRef } from '@/components/core/wallet/TokensTab'
import { OfflineIndicator } from '@/components/OfflineIndicator'
import { PortfolioSummary } from '@/components/PortfolioSummary'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function WalletScreen() {
  const [activeTab, setActiveTab] = useState<'tokens' | 'nfts' | 'history'>(
    'tokens'
  )
  const [refreshing, setRefreshing] = useState(false)
  const { tab } = useLocalSearchParams()

  // Refs for each tab component
  const tokensTabRef = useRef<TokensTabRef>(null)
  const nftsTabRef = useRef<NFTsTabRef>(null)
  const historyTabRef = useRef<HistoryTabRef>(null)

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      // Only refresh the currently active tab
      switch (activeTab) {
        case 'tokens':
          tokensTabRef.current?.refetch()
          break
        case 'nfts':
          nftsTabRef.current?.refetch()
          break
        case 'history':
          historyTabRef.current?.refetch()
          break
      }
    } finally {
      setRefreshing(false)
    }
  }

  // Update active tab if tab is passed in URL
  useEffect(() => {
    if (
      tab &&
      typeof tab === 'string' &&
      ['tokens', 'nfts', 'history'].includes(tab)
    ) {
      setActiveTab(tab as 'tokens' | 'nfts' | 'history')
    } else setActiveTab('tokens')
  }, [tab])

  return (
    <SafeAreaView className='flex-1 bg-dark-50' edges={['top']}>
      <ScrollView
        className='flex-1'
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor='#6366f1'
          />
        }
      >
        {/* Header */}
        <View className='flex-row items-center justify-between px-6 py-4'>
          <Text className='text-white text-2xl font-bold'>Wallet</Text>
          <View className='flex-row gap-3'>
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
              className='w-10 h-10 bg-dark-200 rounded-full justify-center items-center'
            >
              {/* <Ionicons name='search' size={20} color='#6366f1' /> */}
              <Ionicons name='search' size={20} color='white' />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: '/(modals)/qr-scanner' as any,
                  params: {
                    returnTo: 'send',
                    returnParam: 'scannedAddress',
                  },
                })
              }}
              className='w-10 h-10 bg-dark-200 rounded-full justify-center items-center'
            >
              <Ionicons name='scan' size={20} color='white' />
            </TouchableOpacity>
          </View>
        </View>

        {/* Offline Indicator */}
        <OfflineIndicator />

        {/* Active Wallet */}
        <View className='px-6 mb-6'>
          <PortfolioSummary />
        </View>

        {/* Quick Actions */}
        <View className='px-6 mb-6'>
          <Text className='text-white text-xl font-bold mb-4'>
            Quick Actions
          </Text>
          <View className='flex-row gap-3'>
            <ActionButton
              icon='arrow-down'
              title='Receive'
              onPress={() => router.push('/(modals)/receive')}
            />
            <ActionButton
              icon='arrow-up'
              title='Send'
              onPress={() => router.push('/(modals)/send')}
            />
            <ActionButton
              icon='swap-horizontal'
              title='Swap'
              // gradient={true}
              onPress={() => router.push('/(modals)/swap')}
            />
            <ActionButton
              icon='add-circle-outline'
              title='Buy'
              onPress={() => router.push('/(modals)/buy-crypto')}
            />
          </View>
        </View>

        {/* Tabs */}
        <View className='px-6 mb-4'>
          <View className='flex-row bg-dark-200 rounded-2xl p-1'>
            {(['tokens', 'nfts', 'history'] as const).map((tab) => (
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
        <View className='px-6'>
          {activeTab === 'tokens' && <TokensTab ref={tokensTabRef} />}
          {activeTab === 'nfts' && <NFTsTab ref={nftsTabRef} />}
          {activeTab === 'history' && <HistoryTab ref={historyTabRef} />}
        </View>

        {/* Bottom Spacing */}
        {/* <View className='h-8' /> */}
      </ScrollView>
    </SafeAreaView>
  )
}
