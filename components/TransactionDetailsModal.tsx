import { Transaction } from '@/types/transaction.interface';
import { Ionicons } from '@expo/vector-icons';
import { formatWalletAddress } from '@privy-io/expo';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Image } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TransactionDetailsModalProps {
  transaction: Transaction;
}

export const TransactionDetailsModal: React.FC<
  TransactionDetailsModalProps
> = ({ transaction }) => {
  const insets = useSafeAreaInsets();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'completed':
        return '#22c55e';
      case 'pending':
        return '#eab308';
      case 'failed':
        return '#ef4444';
      default:
        return '#ffffff';
    }
  };

  const getIconName = () => {
    switch (transaction.type) {
      case 'send':
        return 'arrow-up';
      case 'receive':
        return 'arrow-down';
      case 'swap':
        return 'swap-horizontal';
      case 'buy':
        return 'add-circle-outline';
      case 'sell':
        return 'remove-circle-outline';
      default:
        return 'time-outline';
    }
  };

  const getIconColor = () => {
    switch (transaction.type) {
      case 'send':
        return '#ef4444';
      case 'receive':
        return '#22c55e';
      case 'swap':
        return '#6366f1';
      case 'buy':
        return '#22c55e';
      case 'sell':
        return '#ef4444';
      default:
        return '#ffffff';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatTransactionType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getAmountPrefix = () => {
    return transaction.type === 'receive' || transaction.type === 'buy'
      ? '+'
      : transaction.type === 'send' || transaction.type === 'sell'
        ? '-'
        : '';
  };

  // Format the amount with full precision for the details view
  const formatPreciseAmount = (amount: number) => {
    // For amounts, show with full precision (up to 9 decimal places for SOL)
    return amount.toLocaleString('en-US', {
      maximumFractionDigits: 9,
      minimumFractionDigits: transaction.symbol === 'SOL' ? 9 : 2,
    });
  };

  // Copy to clipboard with animation and haptic feedback
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await Clipboard.setStringAsync(text);
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCopiedField(field);

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Open transaction in Solana Explorer
  const openInExplorer = async () => {
    try {
      const explorerUrl = `https://solscan.io/tx/${transaction.id}`;
      const canOpen = await Linking.canOpenURL(explorerUrl);

      if (canOpen) {
        await Linking.openURL(explorerUrl);
      } else {
        Alert.alert('Error', 'Cannot open explorer link');
      }
    } catch (error) {
      console.error('Failed to open explorer:', error);
      Alert.alert('Error', 'Failed to open in explorer');
    }
  };

  // Share transaction details
  const shareTransaction = async () => {
    try {
      const explorerUrl = `https://solscan.io/tx/${transaction.id}`;
      const shareContent = {
        title: 'Transaction Details',
        message:
          `Transaction Type: ${formatTransactionType(transaction.type)}\n` +
          `Amount: ${getAmountPrefix()}${formatPreciseAmount(transaction.amount)} ${transaction.symbol}\n` +
          `Status: ${transaction.status}\n` +
          `Date: ${formatDate(transaction.timestamp)}\n` +
          `View on Solscan: ${explorerUrl}`,
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error('Failed to share transaction:', error);
      Alert.alert('Error', 'Failed to share transaction');
    }
  };

  return (
    <View
      className="flex-1 bg-dark-50"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-dark-200 rounded-full justify-center items-center"
        >
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">
          Transaction Details
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Status Card */}
        <View className="bg-dark-200 rounded-2xl p-6 mb-6 items-center">
          <View
            className="w-16 h-16 rounded-full justify-center items-center mb-4"
            style={{ backgroundColor: `${getIconColor()}20` }}
          >
            {transaction.logoURI ? (
              <Image
                source={{ uri: transaction.logoURI }}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <Ionicons name={getIconName()} size={32} color={getIconColor()} />
            )}
          </View>

          <Text className="text-white text-2xl font-bold">
            {getAmountPrefix()}
            {formatPreciseAmount(transaction.amount)}{' '}
            {transaction.symbol.split('/')[0]}
          </Text>

          <View className="flex-row items-center mt-2">
            <View
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: getStatusColor() }}
            />
            <Text
              className="text-base font-medium"
              style={{ color: getStatusColor() }}
            >
              {transaction.status.charAt(0).toUpperCase() +
                transaction.status.slice(1)}
            </Text>
          </View>

          <Text className="text-gray-400 mt-2">
            {formatDate(transaction.timestamp)}
          </Text>
        </View>

        {/* Transaction Info */}
        <View className="bg-dark-200 rounded-2xl p-6 mb-6">
          <Text className="text-white text-lg font-semibold mb-4">
            Transaction Info
          </Text>

          <View className="flex-row justify-between py-3 border-b border-dark-300">
            <Text className="text-gray-400">Type</Text>
            <Text className="text-white font-medium">
              {formatTransactionType(transaction.type)}
            </Text>
          </View>

          <View className="flex-row justify-between py-3 border-b border-dark-300">
            <Text className="text-gray-400">Asset</Text>
            <Text className="text-white font-medium">{transaction.symbol}</Text>
          </View>

          <View className="flex-row justify-between py-3 border-b border-dark-300">
            <Text className="text-gray-400">Amount</Text>
            <Text
              className={`font-medium ${
                transaction.type === 'receive' || transaction.type === 'buy'
                  ? 'text-green-500'
                  : transaction.type === 'send' || transaction.type === 'sell'
                    ? 'text-red-500'
                    : 'text-white'
              }`}
            >
              {getAmountPrefix()}
              {transaction.amount} {transaction.symbol.split('/')[0]}
            </Text>
          </View>

          {transaction.fee !== undefined && (
            <View className="flex-row justify-between py-3 border-b border-dark-300">
              <Text className="text-gray-400">Network Fee</Text>
              <Text className="text-white font-medium">
                {transaction.fee} SOL
              </Text>
            </View>
          )}

          <View className="flex-row justify-between py-3 border-b border-dark-300">
            <Text className="text-gray-400">Date</Text>
            <View className="flex-1 max-w-[70%] flex-row justify-end">
              <Text
                className="text-white font-medium text-right"
                numberOfLines={3}
              >
                {formatDate(transaction.timestamp)}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center py-3 border-b border-dark-300">
            <Text className="text-gray-400">Transaction ID</Text>
            <View className="flex-row items-center">
              <Text className="text-white font-medium">
                {formatWalletAddress(transaction.id)}
              </Text>
              <TouchableOpacity
                className="ml-2 p-2"
                onPress={() => copyToClipboard(transaction.id, 'txid')}
              >
                <Ionicons
                  name={
                    copiedField === 'txid'
                      ? 'checkmark-outline'
                      : 'copy-outline'
                  }
                  size={18}
                  color="#6366f1"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Address Info */}
        {(transaction.recipientAddress || transaction.senderAddress) && (
          <View className="bg-dark-200 rounded-2xl p-6 mb-6">
            <Text className="text-white text-lg font-semibold mb-4">
              Address Details
            </Text>

            {transaction.senderAddress && (
              <View className="mb-4">
                <Text className="text-gray-400 mb-1">From</Text>
                <View className="flex-row items-center">
                  <Text
                    className="text-white font-medium flex-1"
                    numberOfLines={1}
                  >
                    {transaction.senderAddress
                      ? formatWalletAddress(transaction.senderAddress)
                      : ''}
                  </Text>
                  <TouchableOpacity
                    className="ml-2 p-2"
                    onPress={() =>
                      transaction.senderAddress &&
                      copyToClipboard(transaction.senderAddress, 'sender')
                    }
                  >
                    <Ionicons
                      name={
                        copiedField === 'sender'
                          ? 'checkmark-outline'
                          : 'copy-outline'
                      }
                      size={18}
                      color="#6366f1"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {transaction.recipientAddress && (
              <View>
                <Text className="text-gray-400 mb-1">To</Text>
                <View className="flex-row items-center">
                  <Text
                    className="text-white font-medium flex-1"
                    numberOfLines={1}
                  >
                    {transaction.recipientAddress
                      ? formatWalletAddress(transaction.recipientAddress)
                      : ''}
                  </Text>
                  <TouchableOpacity
                    className="ml-2 p-2"
                    onPress={() =>
                      transaction.recipientAddress &&
                      copyToClipboard(transaction.recipientAddress, 'recipient')
                    }
                  >
                    <Ionicons
                      name={
                        copiedField === 'recipient'
                          ? 'checkmark-outline'
                          : 'copy-outline'
                      }
                      size={18}
                      color="#6366f1"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row gap-4 mb-6">
          <TouchableOpacity
            className="flex-1 bg-dark-200 rounded-xl p-4 items-center justify-center"
            onPress={openInExplorer}
          >
            <Ionicons name="open-outline" size={20} color="#6366f1" />
            <Text className="text-white font-medium mt-1">
              View in Explorer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-dark-200 rounded-xl p-4 items-center justify-center"
            onPress={shareTransaction}
          >
            <Ionicons name="share-social-outline" size={20} color="#6366f1" />
            <Text className="text-white font-medium mt-1">Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
