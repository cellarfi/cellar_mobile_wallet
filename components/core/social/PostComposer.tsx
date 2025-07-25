import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { PostComposerProps, PostType } from "@/types/posts.interface";
import { isMintAddress, isValidSolanaAddress } from "@/libs/solana.lib";
import { add } from "date-fns";
import { boolean } from "zod";

const PostComposer: React.FC<PostComposerProps> = ({
  form,
  onFieldChange,
  onTypeChange,
  onSubmit,
  loading,
  error,
  fieldErrors,
}) => {
  // Date picker state for deadline and launchDate
  const [showDeadlinePicker, setShowDeadlinePicker] = React.useState(false);
  const [showLaunchDatePicker, setShowLaunchDatePicker] = React.useState(false);
  const [isNotValidAddress, setisNotValidAddress] = React.useState(false);
  const [isNotValidTokenAddress, setisNotValidTokenAddress] = React.useState(false)

  const updateWalletAddress = (address: string) => {
    onFieldChange("walletAddress", address);
    const check = isValidSolanaAddress(address);
    setisNotValidAddress(!check);
  };

  const updateTokenAddress = (address: string) => {
    if(form.postType == 'DONATION'){
        onFieldChange("donationTokenAddress", address); 
    } else {
        onFieldChange("tokenAddress", address)
    }
   
    const check = isMintAddress(address);
    setisNotValidTokenAddress(!check);
  };

  return (
    <View className="bg-dark-200 rounded-2xl p-4 mb-6 mx-6 shadow-lg">
      {/* Type Selector */}
      <View className="flex-row mb-3">
        {[
          { label: "Regular", value: "REGULAR", icon: "chatbubble-outline" },
          { label: "Donation", value: "DONATION", icon: "gift-outline" },
          {
            label: "Token Call",
            value: "TOKEN_CALL",
            icon: "megaphone-outline",
          },
        ].map((t) => (
          <TouchableOpacity
            key={t.value}
            className={`flex-1 py-2 mx-1 rounded-xl flex-row items-center justify-center ${
              form.postType === t.value ? "bg-primary-500" : "bg-dark-300"
            }`}
            onPress={() => onTypeChange(t.value as PostType)}
          >
            <Ionicons
              name={t.icon as any}
              size={18}
              color={form.postType === t.value ? "#fff" : "#6366f1"}
              style={{ marginRight: 6 }}
            />
            <Text
              className={`text-center font-medium ${
                form.postType === t.value ? "text-white" : "text-gray-400"
              }`}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Content Field */}
      <TextInput
        className="bg-dark-300 text-white rounded-xl px-4 py-3 mb-2"
        placeholder="What's on your mind?"
        placeholderTextColor="#888"
        multiline
        value={form.content}
        onChangeText={(text) => onFieldChange("content", text)}
        style={{
          minHeight: 40,
          maxHeight: 120,
          borderWidth: fieldErrors?.content ? 1 : 0,
          borderColor: fieldErrors?.content ? "#ef4444" : undefined,
        }}
        editable={!loading}
      />
      {fieldErrors?.content && (
        <Text className="text-red-500 mb-2">{fieldErrors.content}</Text>
      )}
      {/* Donation Fields */}
      {form.postType === "DONATION" && (
        <>
          <View className="flex-row gap-2 mb-2">
            <TextInput
              className="bg-dark-300 text-white rounded-xl px-4 py-3 flex-1"
              placeholder="Target Amount"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={form.targetAmount}
              onChangeText={(v) => onFieldChange("targetAmount", v)}
              editable={!loading}
              style={{
                borderWidth: fieldErrors?.target_amount ? 1 : 0,
                borderColor: fieldErrors?.target_amount ? "#ef4444" : undefined,
              }}
            />
            <TextInput
              className="bg-dark-300 text-white rounded-xl px-4 py-3 flex-1"
              placeholder="Wallet Address"
              placeholderTextColor="#888"
              value={form.walletAddress}
              onChangeText={(v) => updateWalletAddress(v)}
              editable={!loading}
              style={{
                borderWidth: fieldErrors?.wallet_address ? 1 : 0,
                borderColor: fieldErrors?.wallet_address
                  ? "#ef4444"
                  : undefined,
              }}
            />
          </View>
          <View className="flex-row gap-2 mb-2">
            <TextInput
              className="bg-dark-300 text-white rounded-xl px-4 py-3 flex-1"
              placeholder="Chain Type (e.g. Solana)"
              placeholderTextColor="#888"
              value={form.chainType}
              onChangeText={(v) => onFieldChange("chainType", v)}
              editable={!loading}
              style={{
                borderWidth: fieldErrors?.chain_type ? 1 : 0,
                borderColor: fieldErrors?.chain_type ? "#ef4444" : undefined,
              }}
            />
            <TextInput
              className="bg-dark-300 text-white rounded-xl px-4 py-3 flex-1"
              placeholder="Token Symbol (optional)"
              placeholderTextColor="#888"
              value={form.donationTokenSymbol}
              onChangeText={(v) => onFieldChange("donationTokenSymbol", v)}
              editable={!loading}
            />
          </View>
          <View className="flex-row gap-2 mb-2">
            <TextInput
              className="bg-dark-300 text-white rounded-xl px-4 py-3 flex-1"
              placeholder="Token Address (optional)"
              placeholderTextColor="#888"
              value={form.donationTokenAddress}
              onChangeText={(v) => updateTokenAddress(v)}
              editable={!loading}
            />
            <TouchableOpacity
              className="flex-1 justify-center items-center bg-dark-300 rounded-xl px-4 py-3"
              onPress={() => setShowDeadlinePicker(true)}
              disabled={loading}
            >
              <Text
                className={`text-white ${form.deadline ? "" : "text-gray-400"}`}
              >
                {form.deadline
                  ? new Date(form.deadline).toLocaleString()
                  : "Deadline (optional)"}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={showDeadlinePicker}
              mode="datetime"
              date={form.deadline ? new Date(form.deadline) : new Date()}
              onConfirm={(date) => {
                setShowDeadlinePicker(false);
                if (date) onFieldChange("deadline", date.toISOString());
              }}
              onCancel={() => setShowDeadlinePicker(false)}
              display="default"
            />
          </View>
          {fieldErrors?.target_amount && (
            <Text className="text-red-500 mb-2">
              {fieldErrors.target_amount}
            </Text>
          )}
          {fieldErrors?.wallet_address && (
            <Text className="text-red-500 mb-2">
              {fieldErrors.wallet_address}
            </Text>
          )}
          {isNotValidAddress &&(
            <Text className="text-red-500 mb-2">
              Your wallet address is not a valid solana address
            </Text>
          )}
                    {isNotValidTokenAddress &&(
            <Text className="text-red-500 mb-2">
              The Token Address inputted is not valid
            </Text>
          )}
          {fieldErrors?.chain_type && (
            <Text className="text-red-500 mb-2">{fieldErrors.chain_type}</Text>
          )}
        </>
      )}
      {/* Token Call Fields */}
      {form.postType === "TOKEN_CALL" && (
        <>
          <TextInput
            className="bg-dark-300 text-white rounded-xl px-4 py-3 mb-2"
            placeholder="Token Name"
            placeholderTextColor="#888"
            value={form.tokenName}
            onChangeText={(v) => onFieldChange("tokenName", v)}
            editable={!loading}
            style={{
              borderWidth: fieldErrors?.token_name ? 1 : 0,
              borderColor: fieldErrors?.token_name ? "#ef4444" : undefined,
            }}
          />
          <TextInput
            className="bg-dark-300 text-white rounded-xl px-4 py-3 mb-2"
            placeholder="Token Symbol"
            placeholderTextColor="#888"
            value={form.tokenSymbol}
            onChangeText={(v) => onFieldChange("tokenSymbol", v)}
            editable={!loading}
            style={{
              borderWidth: fieldErrors?.token_symbol ? 1 : 0,
              borderColor: fieldErrors?.token_symbol ? "#ef4444" : undefined,
            }}
          />
          <TextInput
            className="bg-dark-300 text-white rounded-xl px-4 py-3 mb-2"
            placeholder="Token Address"
            placeholderTextColor="#888"
            value={form.tokenAddress}
            onChangeText={(v) => updateTokenAddress(v)}
            editable={!loading}
            style={{
              borderWidth: fieldErrors?.token_address ? 1 : 0,
              borderColor: fieldErrors?.token_address ? "#ef4444" : undefined,
            }}
          />
          <TextInput
            className="bg-dark-300 text-white rounded-xl px-4 py-3 mb-2"
            placeholder="Chain Type (e.g. Solana)"
            placeholderTextColor="#888"
            value={form.tokenChainType}
            onChangeText={(v) => onFieldChange("tokenChainType", v)}
            editable={!loading}
            style={{
              borderWidth: fieldErrors?.chain_type ? 1 : 0,
              borderColor: fieldErrors?.chain_type ? "#ef4444" : undefined,
            }}
          />
          <TextInput
            className="bg-dark-300 text-white rounded-xl px-4 py-3 mb-2"
            placeholder="Logo URL (optional)"
            placeholderTextColor="#888"
            value={form.logoUrl}
            onChangeText={(v) => onFieldChange("logoUrl", v)}
            editable={!loading}
          />
          <TouchableOpacity
            className="justify-center items-center bg-dark-300 rounded-xl px-4 py-3 mb-2"
            onPress={() => setShowLaunchDatePicker(true)}
            disabled={loading}
          >
            <Text
              className={`text-white ${form.launchDate ? "" : "text-gray-400"}`}
            >
              {form.launchDate
                ? new Date(form.launchDate).toLocaleString()
                : "Launch Date (optional)"}
            </Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={showLaunchDatePicker}
            mode="datetime"
            date={form.launchDate ? new Date(form.launchDate) : new Date()}
            onConfirm={(date) => {
              setShowLaunchDatePicker(false);
              if (date) onFieldChange("launchDate", date.toISOString());
            }}
            onCancel={() => setShowLaunchDatePicker(false)}
            display="default"
          />
          <View className="flex-row gap-2 mb-2">
            <TextInput
              className="bg-dark-300 text-white rounded-xl px-4 py-3 flex-1"
              placeholder="Initial Price (optional)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={form.initialPrice}
              onChangeText={(v) => onFieldChange("initialPrice", v)}
              editable={!loading}
            />
            <TextInput
              className="bg-dark-300 text-white rounded-xl px-4 py-3 flex-1"
              placeholder="Target Price (optional)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={form.targetPrice}
              onChangeText={(v) => onFieldChange("targetPrice", v)}
              editable={!loading}
            />
          </View>
          <TextInput
            className="bg-dark-300 text-white rounded-xl px-4 py-3 mb-2"
            placeholder="Market Cap (optional)"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={form.marketCap}
            onChangeText={(v) => onFieldChange("marketCap", v)}
            editable={!loading}
          />
          <TextInput
            className="bg-dark-300 text-white rounded-xl px-4 py-3 mb-2"
            placeholder="Description (optional)"
            placeholderTextColor="#888"
            value={form.description}
            onChangeText={(v) => onFieldChange("description", v)}
            editable={!loading}
            multiline
            style={{ minHeight: 40, maxHeight: 120 }}
          />
          {fieldErrors?.token_name && (
            <Text className="text-red-500 mb-2">{fieldErrors.token_name}</Text>
          )}
          {fieldErrors?.token_symbol && (
            <Text className="text-red-500 mb-2">
              {fieldErrors.token_symbol}
            </Text>
          )}
          {fieldErrors?.token_address && (
            <Text className="text-red-500 mb-2">
              {fieldErrors.token_address}
            </Text>
          )}
          {fieldErrors?.chain_type && (
            <Text className="text-red-500 mb-2">{fieldErrors.chain_type}</Text>
          )}
                    {isNotValidTokenAddress &&(
            <Text className="text-red-500 mb-2">
              The Token Address inputted is not valid
            </Text>
          )}
        </>
      )}
      <View className="flex-row justify-end mt-2">
        <TouchableOpacity
          className="bg-gradient-to-r from-primary-500 to-indigo-500 rounded-xl px-6 py-3 justify-center items-center shadow-md"
          onPress={onSubmit}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name="send" size={22} color="white" />
          )}
        </TouchableOpacity>
      </View>
      {error && <Text className="text-red-500 mt-2 text-center">{error}</Text>}
    </View>
  );
};

export default PostComposer;
