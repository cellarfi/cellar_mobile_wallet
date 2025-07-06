import { TransactionDetailsModal } from '@/components/TransactionDetailsModal';
import { useTransactions } from '@/hooks/useTransactions';
import { Transaction } from '@/types/transaction.interface';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function TransactionDetailsScreen() {
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();
  const { transactions, isLoading, isRefetching, error } = useTransactions();
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!isLoading && transactions.length > 0 && transactionId) {
      const foundTransaction = transactions.find(
        (tx) => tx.id === transactionId
      );
      if (foundTransaction) {
        setTransaction(foundTransaction);
      }
    }
  }, [transactionId, transactions, isLoading]);

  if (isLoading && !isRefetching) {
    return (
      <View className="flex-1 bg-dark-50 justify-center items-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-white mt-4">Loading transaction details...</Text>
      </View>
    );
  }

  if (error || !transaction) {
    return (
      <View className="flex-1 bg-dark-50 justify-center items-center p-6">
        <Text className="text-white text-lg text-center">
          {error || 'Transaction not found'}
        </Text>
      </View>
    );
  }

  return <TransactionDetailsModal transaction={transaction} />;
}
