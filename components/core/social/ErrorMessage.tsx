import React from "react";
import { View, Text } from "react-native";

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <View className="flex-1 justify-center items-center mt-4">
    <Text className="text-white">Error: {message}</Text>
  </View>
);

export default ErrorMessage;
