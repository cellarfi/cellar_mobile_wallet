import { eventEmitter } from '@/libs/EventEmitter.lib'
import {
  NATIVE_SOL_ADDRESS,
  NATIVE_SOL_MINT,
  WRAPPED_SOL_MINT,
} from '@/libs/solana.lib'
import { BalanceChange } from '@/service/TransactionAnalyzer2'
import { ConnectionModalAction } from '@/types/app.interface'
import { Ionicons } from '@expo/vector-icons'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { router, useLocalSearchParams } from 'expo-router'
import React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function SignTransactionModal() {
  // Accept params from navigation (all as string)
  const {
    logoUrl,
    websiteName,
    domain,
    isVerified,
    balanceChanges,
    actionType,
    activeWallet,
  } = useLocalSearchParams<{
    logoUrl: string
    websiteName: string
    domain: string
    isVerified: string
    balanceChanges: string // JSON stringified array
    actionType: 'sign' | 'signAndSend'
    activeWallet: string
  }>()

  let parsedTokenChanges: BalanceChange[] = []
  try {
    parsedTokenChanges = balanceChanges ? JSON.parse(balanceChanges) : []
    console.log('parsedTokenChanges', parsedTokenChanges)
    parsedTokenChanges = parsedTokenChanges
      .filter((change) => change.owner === activeWallet)
      .map((change) => ({
        ...change,
        amount: [
          NATIVE_SOL_MINT,
          NATIVE_SOL_ADDRESS,
          WRAPPED_SOL_MINT,
        ].includes(change.mint)
          ? change.amount / LAMPORTS_PER_SOL
          : change.amount / Math.pow(10, 6),
      }))
    console.log('parsedTokenChanges', parsedTokenChanges)
  } catch (e) {
    parsedTokenChanges = []
  }

  const handleClose = (action: ConnectionModalAction) => {
    eventEmitter.emit('sign-transaction-modal-closed', {
      action,
      // tokenChanges: parsedTokenChanges,
    })
    router.dismissAll()
  }

  return (
    <SafeAreaView
      className='flex-1 justify-end bg-black/40'
      edges={['bottom']}
      style={{ justifyContent: 'flex-end' }}
    >
      <View className='bg-primary-main rounded-t-3xl px-6 pt-6 pb-8 shadow-2xl border-t border-dark-300'>
        {/* Drag handle */}
        <View className='w-12 h-1.5 bg-dark-300 rounded-full self-center mb-4' />

        {/* Dapp Info */}
        <View className='flex-row items-center mb-4'>
          <View className='w-14 h-14 bg-dark-200 rounded-2xl justify-center items-center mr-4 overflow-hidden'>
            {logoUrl ? (
              <Image
                source={{ uri: logoUrl }}
                style={{ width: 44, height: 44, borderRadius: 16 }}
                resizeMode='contain'
              />
            ) : (
              <Ionicons name='globe-outline' size={32} color='#6366f1' />
            )}
          </View>
          <View className='flex-1'>
            <Text
              className='text-white text-lg font-semibold'
              numberOfLines={1}
            >
              {websiteName}
            </Text>
            <View className='flex-row items-center mt-1'>
              <Text className='text-gray-400 text-xs mr-2' numberOfLines={1}>
                {domain}
              </Text>
              {isVerified ? (
                <View className='flex-row items-center bg-success-500/20 px-2 py-0.5 rounded-full ml-1'>
                  <Ionicons name='checkmark-circle' size={14} color='#22c55e' />
                  <Text className='text-success-500 text-xs font-medium ml-1'>
                    Verified
                  </Text>
                </View>
              ) : (
                <View className='flex-row items-center bg-warning-500/20 px-2 py-0.5 rounded-full ml-1'>
                  <Ionicons name='alert-circle' size={14} color='#f59e42' />
                  <Text className='text-warning-500 text-xs font-medium ml-1'>
                    Unverified
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Warning for unverified dapp */}
        {!isVerified && (
          <View className='bg-warning-500/10 border border-warning-500/20 rounded-xl p-3 mb-4 flex-row items-center'>
            <Ionicons
              name='warning'
              size={18}
              color='#f59e42'
              style={{ marginRight: 8 }}
            />
            <Text className='text-warning-400 text-xs flex-1'>
              This dapp is not verified. Only sign if you trust this website.
            </Text>
          </View>
        )}

        {/* Token Changes Section */}
        <View className='mb-6'>
          <Text className='text-white text-base font-semibold mb-2'>
            Token Changes
          </Text>
          {parsedTokenChanges.length === 0 ? (
            <Text className='text-gray-400 text-sm'>
              No token changes detected.
            </Text>
          ) : (
            parsedTokenChanges.map((token, idx) => (
              <View
                key={token?.mint + idx}
                className='flex-row items-center mb-2'
              >
                <View className='w-8 h-8 bg-dark-300 rounded-full justify-center items-center mr-3 overflow-hidden'>
                  {token?.logoUrl ? (
                    <Image
                      source={{ uri: token?.logoUrl }}
                      style={{ width: 28, height: 28, borderRadius: 14 }}
                      resizeMode='contain'
                    />
                  ) : (
                    <Ionicons name='logo-bitcoin' size={18} color='#6366f1' />
                  )}
                </View>
                <Text className='text-white text-sm flex-1'>
                  {token?.name || 'Unknown Name'}
                </Text>
                <Text
                  className={`text-sm font-semibold ${token.amount < 0 ? 'text-danger-400' : 'text-success-400'}`}
                >
                  {token.amount > 0 ? '+' : ''}
                  {token.amount}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Action Buttons */}
        <View className='flex-row gap-3'>
          <TouchableOpacity
            className='flex-1 bg-dark-200 rounded-xl py-4 items-center border border-dark-300'
            onPress={() => handleClose('reject')}
          >
            <Text className='text-white font-medium'>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className='flex-1 bg-primary-500 rounded-xl py-4 items-center'
            onPress={() => handleClose('accept')}
          >
            <Text className='text-white font-semibold'>
              {actionType === 'signAndSend'
                ? 'Confirm Transaction'
                : 'Sign Transaction'}
            </Text>
          </TouchableOpacity>
        </View>
        {actionType === 'signAndSend' && (
          <Text className='text-gray-400 text-xs mt-2 text-center'>
            This will sign and send your transaction to the Solana network.
          </Text>
        )}
      </View>
    </SafeAreaView>
  )
}
