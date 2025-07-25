import React from "react";
import { View, Text, ActivityIndicator } from "react-native";

interface LoadingIndicatorProps {
  message?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message }) => (
  <View className="flex-1 justify-center items-center mt-4">
    <ActivityIndicator color="#6366f1" />
    {message && <Text className="text-white mt-2">{message}</Text>}
  </View>
);

export default LoadingIndicator;
