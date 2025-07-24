import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface HeaderProps {
  title: string;
  onSearch: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onSearch }) => (
  <View className="flex-row items-center justify-between px-6 py-4">
    <Text className="text-white text-2xl font-bold">{title}</Text>
    <View className="flex-row gap-3">
      <TouchableOpacity
        className="w-10 h-10 bg-dark-200 rounded-full justify-center items-center"
        onPress={onSearch}
      >
        <Ionicons name="search" size={20} color="#6366f1" />
      </TouchableOpacity>
    </View>
  </View>
);

export default Header;
