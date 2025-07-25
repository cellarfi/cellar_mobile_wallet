import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { UserProfile } from "@/types/user.interface";
import { userRequests } from "@/libs/api_requests/user.request";
import { followsRequests } from "@/libs/api_requests/follows.request";

const DUMMY_BIO = "Building the future of finance on Solana blockchain.";

export default function UserProfileModal() {
  const { tagName } = useLocalSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await userRequests.getUserProfile(String(tagName));
        if (res.success) {
          setProfile(res.data);
          setIsFollowing(res.data.isFollowing);
        } else {
          setError(res.message || "Failed to fetch user profile");
        }
      } catch (err: any) {
        setError(err?.message || "Failed to fetch user profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [tagName, isFollowing]);

  const handleFollow = async (userId: string) => {
    try {
      const res = await followsRequests.followUser(String(userId));
      if (res.success) {
        if (isFollowing) {
          alert("Unfollowed");
        } else {
          alert("Followed");
        }
        setIsFollowing(!!isFollowing);
      } else {
        alert("Couldn't not follow");
      }
    } catch (error) {
      alert("An error occured while performining this request");
    }

    // Here you would call the follow/unfollow API
  };

  const user = profile?.user;
  const posts = profile?.user.post || [];

  return (
    <SafeAreaView className="flex-1 bg-dark-50 px-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          className="absolute top-4 right-4 z-10"
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        {loading ? (
          <View className="flex-1 justify-center items-center mt-16">
            <ActivityIndicator color="#6366f1" />
            <Text className="text-white mt-2">Loading profile...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center mt-16">
            <Text className="text-red-500">{error}</Text>
          </View>
        ) : user ? (
          <>
            {/* User Header */}
            <View className="items-center mt-10 mb-6">
              <View className="w-24 h-24 bg-primary-500/20 rounded-full justify-center items-center overflow-hidden mb-3">
                {user.profile_picture_url ? (
                  <Image
                    source={{ uri: user.profile_picture_url }}
                    style={{ width: 96, height: 96, borderRadius: 48 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-3xl text-white">
                    {user.display_name?.[0]?.toUpperCase() ?? "?"}
                  </Text>
                )}
              </View>
              <View className="flex-row items-center mb-1">
                <Text className="text-white text-2xl font-bold mr-2">
                  {user.display_name}
                </Text>
                {false && (
                  <Ionicons name="checkmark-circle" size={18} color="#6366f1" />
                )}
              </View>
              <Text className="text-gray-400 text-lg mb-2">
                @{user.tag_name}
              </Text>
              <Text className="text-gray-300 text-center mb-3">
                {DUMMY_BIO}
              </Text>
              <View className="flex-row items-center gap-6 mb-4">
                <Text className="text-gray-400 text-sm">
                  <Text className="text-white font-semibold">
                    {user._count.followers.toLocaleString()}
                  </Text>{" "}
                  Followers
                </Text>
                <Text className="text-gray-400 text-sm">
                  <Text className="text-white font-semibold">
                    {user._count.following.toLocaleString()}
                  </Text>{" "}
                  Following
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleFollow(user.id)}
                className={`px-6 py-2 rounded-xl ${
                  isFollowing ? "bg-gray-600" : "bg-primary-500"
                }`}
              >
                <Text className="text-white text-base font-medium">
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
            </View>
            {/* User's Posts */}
            <Text className="text-white text-lg font-semibold mb-4 mt-2">
              Posts
            </Text>
            {posts.length === 0 ? (
              <View className="flex-1 justify-center items-center mt-8">
                <Ionicons
                  name="chatbubble-outline"
                  size={48}
                  color="#6366f1"
                  style={{ opacity: 0.5 }}
                />
                <Text className="text-gray-400 mt-4 text-lg">No posts yet</Text>
              </View>
            ) : (
              <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="bg-dark-200 rounded-2xl p-4 mb-3"
                    onPress={() =>
                      router.push({
                        pathname: "/(modals)/post-details",
                        params: { postId: item.id },
                      })
                    }
                  >
                    <View className="flex-row items-center mb-2">
                      <Text className="text-white font-semibold mr-2">
                        {user.display_name}
                      </Text>
                      <Text className="text-gray-400 text-xs ml-2">
                        {(() => {
                          const date: any = new Date(item.created_at);
                          const now: any = new Date();
                          const diffInSeconds = Math.floor((now - date) / 1000);
                          if (diffInSeconds < 60) {
                            return `${diffInSeconds} seconds ago`;
                          }
                          const diffInMinutes = Math.floor(diffInSeconds / 60);
                          if (diffInMinutes < 60) {
                            return `${diffInMinutes} minute${
                              diffInMinutes > 1 ? "s" : ""
                            } ago`;
                          }
                          const diffInHours = Math.floor(diffInMinutes / 60);
                          if (diffInHours < 24) {
                            return `${diffInHours} hour${
                              diffInHours > 1 ? "s" : ""
                            } ago`;
                          }
                          const diffInDays = Math.floor(diffInHours / 24);
                          if (diffInDays < 7) {
                            return `${diffInDays} day${
                              diffInDays > 1 ? "s" : ""
                            } ago`;
                          }
                          const diffInWeeks = Math.floor(diffInDays / 7);
                          if (diffInWeeks < 4) {
                            return `${diffInWeeks} week${
                              diffInWeeks > 1 ? "s" : ""
                            } ago`;
                          }
                          return date.toLocaleDateString();
                        })()}
                      </Text>
                    </View>
                    <Text className="text-gray-200">{item.content}</Text>
                  </TouchableOpacity>
                )}
                scrollEnabled={false}
              />
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
