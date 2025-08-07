import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { SuggestedAccounts } from "@/types/socialfi.interface";

interface UserCardProps {
  user: SuggestedAccounts;
  onFollow: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onFollow }) => (
  <View className="bg-dark-200 rounded-2xl p-4 mr-3 w-48">
    <View className="flex-row items-center justify-between mb-3">
      <View className="w-12 h-12 bg-primary-500/20 rounded-full justify-center items-center">
        {user.profile_picture_url ? (
          <Image
            source={{ uri: user.profile_picture_url }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
            resizeMode="cover"
          />
        ) : (
          <Text className="text-lg text-white">
            {user.display_name?.[0]?.toUpperCase() ?? "?"}
          </Text>
        )}
      </View>
      <TouchableOpacity
        className={`px-3 py-1 rounded-xl ${
          user.following ? "bg-gray-600" : "bg-primary-500"
        }`}
        onPress={() => onFollow(user.id)}
      >
        <Text className="text-white text-sm font-medium">
          {user.following ? "Following" : "Follow"}
        </Text>
      </TouchableOpacity>
    </View>
    <View className="flex-row items-center mb-1">
      <Text className="text-white font-semibold mr-2">
        {user.display_name ?? ""}
      </Text>
    </View>
    <Text className="text-gray-400 text-sm mb-2">@{user.tag_name ?? ""}</Text>
    <Text className="text-gray-500 text-xs">
      {user._count?.Followers ?? 0} followers
    </Text>
  </View>
);

export default UserCard;
