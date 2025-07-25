import React from "react";
import { TouchableOpacity, Text } from "react-native";

interface TrendingCardProps {
  topic: { tag: string; count: number };
  onPress: (tag: string) => void;
}

const TrendingCard: React.FC<TrendingCardProps> = ({ topic, onPress }) => (
  <TouchableOpacity
    className="bg-dark-200 rounded-2xl p-4 mr-3 w-40"
    onPress={() => onPress(topic.tag)}
  >
    <Text className="text-primary-400 font-semibold text-lg mb-1">
      #{topic.tag ?? ""}
    </Text>
    <Text className="text-gray-400 text-sm">{topic.count ?? 0} posts</Text>
  </TouchableOpacity>
);

export default TrendingCard;
