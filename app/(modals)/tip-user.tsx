import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { SocialFiRequests } from "@/libs/api_requests/socialfi.request";
import { useSocialEventsStore } from "@/store/socialEventsStore";

export default function TipUserModal() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { postId } = useLocalSearchParams();
  const triggerRefresh = useSocialEventsStore((state) => state.triggerRefresh);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Replace with actual API call
      const res = await SocialFiRequests.tipUser({
        postId,
        amount: parseFloat(amount),
      });
      if (res.success) {
        triggerRefresh();
        router.back();
      } else {
        setError(res.message || "Failed to send tip");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to send tip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-50 px-6 justify-center">
      <View className="bg-dark-200 rounded-2xl p-6">
        <Text className="text-white text-xl font-bold mb-4">Send Tip</Text>
        <TextInput
          className="bg-dark-300 text-white rounded-xl px-4 py-3 mb-4"
          placeholder="Enter amount (e.g. 1.00)"
          placeholderTextColor="#888"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
        {error && <Text className="text-red-500 mb-2">{error}</Text>}
        <TouchableOpacity
          className="bg-primary-500 rounded-xl py-3 items-center"
          onPress={handleSubmit}
          disabled={
            loading || !amount || isNaN(Number(amount)) || Number(amount) <= 0
          }
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold">Send Tip</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          className="absolute top-4 right-4"
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
