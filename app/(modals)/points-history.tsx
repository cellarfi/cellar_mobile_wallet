import { usePoints } from '@/hooks/usePoints';
import { PointTransaction } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Interface for grouped transactions by date
interface TransactionGroup {
  date: string;
  formattedDate: string;
  transactions: PointTransaction[];
}

const PointsHistoryModal = () => {
  const { userPoints, pointsHistory, fetchPointsHistory } = usePoints();
  const [historyPage, setHistoryPage] = useState(0);
  const historyLimit = 10;
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);



  // Get level thresholds
  const getLevelThresholds = (level: number): { current: number; next: number } => {
    const thresholds = [0, 100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
    return {
      current: thresholds[level - 1] || 0,
      next: thresholds[level] || 100000, // Max threshold for level 10
    };
  };

  // Calculate progress to next level
  const calculateProgress = (balance: number, level: number): number => {
    if (level >= 10) return 100; // Max level reached
    
    const { current, next } = getLevelThresholds(level);
    const progress = ((balance - current) / (next - current)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  // Define loadPointsHistory function with useCallback
  const loadPointsHistory = useCallback(
    async (resetPagination = true) => {
      setIsLoadingHistory(true);
      setError(null);
      try {
        if (resetPagination) {
          setHistoryPage(0);
        }

        console.log('Loading points history with params:', {
          limit: historyLimit,
          offset: resetPagination ? 0 : historyPage * historyLimit,
        });

        await fetchPointsHistory({
          limit: historyLimit,
          offset: resetPagination ? 0 : historyPage * historyLimit,
        });
      } catch (error) {
        console.error('Error fetching points history:', error);
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load points history'
        );
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [fetchPointsHistory, historyLimit, historyPage]
  );

  // Load more points history (pagination)
  const handleLoadMoreHistory = async () => {
    if (isLoadingHistory || !pointsHistory) return;

    // Check if we've loaded all items
    if ((historyPage + 1) * historyLimit >= pointsHistory.pagination.total)
      return;

    setIsLoadingHistory(true);
    try {
      const nextPage = historyPage + 1;
      setHistoryPage(nextPage);
      await fetchPointsHistory({
        limit: historyLimit,
        offset: nextPage * historyLimit,
      });
    } catch (error) {
      console.error('Error loading more history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load points history when the modal opens
  useEffect(() => {
    loadPointsHistory(true);
  }, [loadPointsHistory]);

  // Early return with basic UI if there's a critical error
  if (!fetchPointsHistory) {
    return (
      <View className="flex-1 bg-dark-50">
        <SafeAreaView className="flex-1">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-dark-300">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Points History</Text>
            <View className="w-10" />
          </View>
          <View className="flex-1 items-center justify-center">
            <Text className="text-white">Unable to load points data</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Group transactions by date
  const getGroupedTransactions = (): TransactionGroup[] => {
    if (!pointsHistory?.points) return [];

    const grouped = pointsHistory.points.reduce(
      (acc: Record<string, PointTransaction[]>, transaction) => {
        const date = format(parseISO(transaction.created_at), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(transaction);
        return acc;
      },
      {}
    );

    return Object.entries(grouped)
      .map(([date, transactions]) => ({
        date,
        formattedDate: format(parseISO(date), 'MMMM d, yyyy'),
        transactions,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return (
    <View className="flex-1 bg-dark-50">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-dark-300">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full"
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Points History</Text>
          <View className="w-10" />
        </View>

        {/* Points Summary */}
        <View className="px-4 py-4">
          {userPoints && (
            <View className="flex-row items-center bg-primary-500/20 rounded-full px-3 py-1">
              <Ionicons name="star" size={16} color="#6366f1" />
              <Text className="text-white font-medium text-base ml-2">
                {userPoints.balance} Points • Level {userPoints.level}
              </Text>
            </View>
          )}

          {/* Points Progress to Next Level */}
          <View className="py-3 bg-dark-200 mt-4 mb-2 rounded-lg">
            <View className="px-3 flex-row justify-between items-center mb-2">
              <Text className="text-white font-medium">
                Level {userPoints?.level || 0}
              </Text>
              <Text className="text-white font-medium">
                Level {(userPoints?.level || 0) + 1}
              </Text>
            </View>
            <View className="mx-3 h-2 bg-dark-300 rounded-full overflow-hidden">
              <View
                className="h-full bg-primary-500"
                style={{ 
                  width: `${calculateProgress(
                    userPoints?.balance || 0, 
                    userPoints?.level || 1
                  )}%` 
                }}
              />
            </View>
            <Text className="text-gray-400 text-xs px-3 mt-2">
              Keep earning points to reach the next level!
            </Text>
          </View>
        </View>

        {/* Error State */}
        {error && (
          <View className="px-4 py-4">
            <View className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <Text className="text-red-400 font-medium">Error</Text>
              <Text className="text-red-300 text-sm mt-1">{error}</Text>
              <TouchableOpacity
                onPress={() => loadPointsHistory(true)}
                className="mt-3 bg-red-500/20 rounded-lg px-3 py-2 self-start"
              >
                <Text className="text-red-300 text-sm font-medium">Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Points History List */}
        {isLoadingHistory && !pointsHistory ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#6366f1" size="large" />
            <Text className="text-white mt-4">Loading points history...</Text>
          </View>
        ) : error ? null : (
          <FlatList
            data={getGroupedTransactions()}
            keyExtractor={(item) => item.date}
            renderItem={({ item }: { item: TransactionGroup }) => (
              <View className="mb-4">
                <View className="px-4 py-2 bg-dark-200">
                  <Text className="text-white font-bold">
                    {item.formattedDate}
                  </Text>
                </View>
                {item.transactions.map((transaction) => {
                  const isIncrement = transaction.action === 'increment';
                  const description = transaction.metadata?.description || transaction.source || 'Points transaction';
                  
                  return (
                    <View
                      key={transaction.id}
                      className="flex-row items-center justify-between py-3 px-4 border-b border-dark-300/50"
                    >
                      <View className="flex-1">
                        <Text className="text-white font-medium">
                          {description}
                        </Text>
                        <Text className="text-gray-400 text-sm">
                          {format(parseISO(transaction.created_at), 'HH:mm')}
                        </Text>
                      </View>
                      <Text
                        className={`font-bold ${
                          isIncrement ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {isIncrement ? '+' : '-'}
                        {transaction.amount}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
            onEndReached={handleLoadMoreHistory}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoadingHistory ? (
                <View className="py-4 items-center">
                  <ActivityIndicator color="#6366f1" size="small" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-8">
                <Ionicons name="star-outline" size={48} color="#6366f1" />
                <Text className="text-white text-lg mt-4">
                  No points history yet
                </Text>
                <Text className="text-gray-400 text-center mx-8 mt-2">
                  Complete actions to earn points and they will appear here.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default PointsHistoryModal;
