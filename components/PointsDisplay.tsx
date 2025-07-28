import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePoints } from '@/hooks/usePoints';
import AnimatedCounter from '@/components/AnimatedCounter';

interface PointsDisplayProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({ 
  size = 'medium', 
  showLabel = true 
}) => {
  const { userPoints, isLoading } = usePoints();

  const handlePress = () => {
    router.push('/points-history');
  };

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'px-2 py-1',
      icon: 16,
      text: 'text-sm',
      counter: { fontSize: 14, fontWeight: '600' as const },
    },
    medium: {
      container: 'px-3 py-2',
      icon: 18,
      text: 'text-base',
      counter: { fontSize: 16, fontWeight: '600' as const },
    },
    large: {
      container: 'px-4 py-3',
      icon: 20,
      text: 'text-lg',
      counter: { fontSize: 18, fontWeight: 'bold' as const },
    },
  };

  const config = sizeConfig[size];

  if (isLoading) {
    return (
      <View className={`bg-green-500/10 rounded-full flex-row items-center ${config.container}`}>
        <Ionicons name="leaf" size={config.icon} color="#10b981" />
        <Text className={`text-green-400 font-medium ml-1 ${config.text}`}>
          ...
        </Text>
      </View>
    );
  }

  if (!userPoints) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`bg-green-500/10 rounded-full flex-row items-center ${config.container} active:bg-green-500/20`}
      activeOpacity={0.7}
    >
      <Ionicons name="leaf" size={config.icon} color="#10b981" />
      <View className="ml-1">
        {showLabel ? (
          <View className="items-center">
            <AnimatedCounter
              value={userPoints.balance}
              style={{
                color: '#10b981',
                fontSize: config.counter.fontSize,
                fontWeight: config.counter.fontWeight,
              }}
            />
            <Text className="text-green-400 text-xs font-medium -mt-1">
              Points
            </Text>
          </View>
        ) : (
          <AnimatedCounter
            value={userPoints.balance}
            style={{
              color: '#10b981',
              fontSize: config.counter.fontSize,
              fontWeight: config.counter.fontWeight,
            }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default PointsDisplay;
