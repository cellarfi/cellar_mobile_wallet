import { TransactionCard } from '@/components/TransactionCard'
import { useTransactions } from '@/hooks/useTransactions'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { forwardRef, useImperativeHandle } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

export interface HistoryTabRef {
  refetch: () => void
}

export const HistoryTab = forwardRef<HistoryTabRef>((props, ref) => {
  const {
    transactions,
    isLoading: transactionsLoading,
    isRefetching: transactionsRefetching,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useTransactions()

  useImperativeHandle(ref, () => ({
    refetch: refetchTransactions,
  }))

  return (
    <View>
      <Text className='text-white text-lg font-semibold mb-4'>
        Transaction History
      </Text>
      {transactionsLoading && !transactionsRefetching ? (
        <View className='bg-dark-200 rounded-2xl p-6 items-center'>
          <View className='w-full h-16 bg-dark-300 rounded-xl mb-3 animate-pulse' />
          <View className='w-full h-16 bg-dark-300 rounded-xl mb-3 animate-pulse' />
          <View className='w-full h-16 bg-dark-300 rounded-xl animate-pulse' />
        </View>
      ) : transactionsError ? (
        <View className='bg-dark-200 rounded-2xl p-6 items-center'>
          <Ionicons name='alert-circle-outline' size={48} color='#ef4444' />
          <Text className='text-gray-400 text-center mt-4'>
            {transactionsError}
          </Text>
          <TouchableOpacity
            onPress={() => refetchTransactions()}
            className='mt-4 bg-primary-500 rounded-xl px-4 py-2'
          >
            <Text className='text-white font-medium'>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : transactions && transactions.length > 0 ? (
        transactions.map((transaction) => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            onPress={() =>
              router.push({
                pathname: '/(modals)/transaction-details',
                params: { transactionId: transaction.id },
              })
            }
          />
        ))
      ) : (
        <View className='bg-dark-200 rounded-2xl p-6 items-center'>
          <Ionicons name='time-outline' size={48} color='#666672' />
          <Text className='text-gray-400 text-center mt-4'>
            No transactions found
          </Text>
        </View>
      )}
    </View>
  )
})
