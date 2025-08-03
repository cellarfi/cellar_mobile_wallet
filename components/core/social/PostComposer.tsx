import { Colors } from '@/constants/Colors';
import { UploadRequests } from '@/libs/api_requests/upload.request';
import { isMintAddress, isValidSolanaAddress } from '@/libs/solana.lib';
import { PostComposerProps, PostType } from '@/types/posts.interface';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import DateTimePickerModal from 'react-native-modal-datetime-picker';

// 10MB in bytes
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;

interface MediaItem {
  uri: string;
  type: 'image' | 'video' | 'gif';
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  thumbnail?: string;
  uploading?: boolean;
  uploadProgress?: number;
  publicId?: string;
  assetId?: string;
}

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
  const [isNotValidTokenAddress, setisNotValidTokenAddress] =
    React.useState(false);

  const updateWalletAddress = (address: string) => {
    onFieldChange('walletAddress', address);
    const check = isValidSolanaAddress(address);
    setisNotValidAddress(!check);
  };

  const [mediaItems, setMediaItems] = React.useState<MediaItem[]>([]);
  const uploadQueue = useRef<MediaItem[]>([]);
  const isProcessing = useRef(false);

  const processUploadQueue = useCallback(async () => {
    if (isProcessing.current || uploadQueue.current.length === 0) return;

    isProcessing.current = true;
    const item = uploadQueue.current.shift();

    if (!item) {
      isProcessing.current = false;
      return;
    }

    try {
      setMediaItems((prev) =>
        prev.map((m) =>
          m.uri === item.uri ? { ...m, uploading: true, uploadProgress: 0 } : m
        )
      );

      const formData = new FormData();
      formData.append('file', {
        uri: item.uri,
        type: item.mimeType || 'image/jpeg',
        name: item.fileName || `file-${Date.now()}`,
      } as any);

      const { success, data, message } = await UploadRequests.uploadSingle({
        uri: item.uri,
        type: item.mimeType || 'image/jpeg',
        name: item.fileName || `file-${Date.now()}`,
      });

      if (success && data) {
        setMediaItems((prev) =>
          prev.map((m) =>
            m.uri === item.uri
              ? {
                  ...m,
                  uploading: false,
                  uploadProgress: 100,
                  publicId: data.publicId,
                  assetId: data.assetId,
                }
              : m
          )
        );

        // Update form with the uploaded media
        const mediaUrls = [...(form.mediaUrls || []), data.secureUrl];
        onFieldChange('mediaUrls', mediaUrls);
      } else {
        throw new Error(message || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setMediaItems((prev) => prev.filter((m) => m.uri !== item.uri));
      Alert.alert('Upload Failed', 'Failed to upload media. Please try again.');
    } finally {
      isProcessing.current = false;
      processUploadQueue(); // Process next item in queue
    }
  }, [form.mediaUrls, onFieldChange]);

  const addMediaToQueue = useCallback(
    (newItems: MediaItem[]) => {
      setMediaItems((prev) => [...prev, ...newItems]);
      uploadQueue.current = [...uploadQueue.current, ...newItems];
      processUploadQueue();
    },
    [processUploadQueue]
  );

  const handleMediaPick = useCallback(async () => {
    if (mediaItems.length >= MAX_ATTACHMENTS) {
      Alert.alert(
        'Maximum Attachments Reached',
        `You can only attach up to ${MAX_ATTACHMENTS} files.`
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        selectionLimit: MAX_ATTACHMENTS - mediaItems.length,
        quality: 0.8,
      });

      if (result.canceled) return;

      const newMediaItems: MediaItem[] = [];

      for (const asset of result.assets) {
        if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
          Alert.alert(
            'File Too Large',
            `${asset.fileName || 'File'} exceeds the 10MB limit.`
          );
          continue;
        }

        const type =
          asset.type === 'video'
            ? 'video'
            : asset.uri.endsWith('.gif')
              ? 'gif'
              : 'image';

        let thumbnail = asset.uri;
        if (type === 'video') {
          try {
            const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri);
            thumbnail = uri;
          } catch (e) {
            console.warn('Failed to generate video thumbnail', e);
          }
        }

        newMediaItems.push({
          uri: asset.uri,
          type,
          fileName: asset.fileName || undefined,
          mimeType: asset.mimeType || undefined,
          fileSize: asset.fileSize,
          thumbnail,
        });
      }

      if (newMediaItems.length > 0) {
        addMediaToQueue(newMediaItems);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media. Please try again.');
    }
  }, [addMediaToQueue, mediaItems.length]);

  const removeMedia = useCallback(
    async (index: number) => {
      const item = mediaItems[index];
      if (!item) return;

      try {
        if (item.publicId) {
          await UploadRequests.deleteFile(item.publicId);
        }

        setMediaItems((prev) => prev.filter((_, i) => i !== index));

        // Update form with remaining media URLs
        const remainingUrls = (form.mediaUrls || []).filter(
          (_, i) => i !== mediaItems.findIndex((m) => m.uri === item.uri)
        );
        onFieldChange('mediaUrls', remainingUrls);
      } catch (error) {
        console.error('Failed to delete media:', error);
        Alert.alert('Error', 'Failed to remove media. Please try again.');
      }
    },
    [form.mediaUrls, mediaItems, onFieldChange]
  );

  const updateTokenAddress = (address: string) => {
    if (form.postType === 'DONATION') {
      onFieldChange('donationTokenAddress', address);
    } else {
      onFieldChange('tokenAddress', address);
    }

    const check = isMintAddress(address);
    setisNotValidTokenAddress(!check);
  };

  const renderMediaPreview = useCallback(() => {
    if (mediaItems.length === 0) return null;

    return (
      <View className="mt-2 mb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="py-2"
        >
          {mediaItems.map((item, index) => (
            <View
              key={item.uri}
              className="relative mr-2 rounded-lg overflow-hidden bg-dark-200"
              style={{
                width: 80,
                height: 80,
                borderWidth: 1,
                borderColor: '#6366f1',
              }}
            >
              {item.thumbnail ? (
                <Image
                  source={{ uri: item.thumbnail }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center bg-dark-300">
                  <Ionicons name="image" size={24} color={Colors.dark.text} />
                </View>
              )}

              {item.uploading && (
                <View className="absolute bottom-0 left-0 right-0 h-1 bg-dark-400">
                  <View
                    className="h-full bg-primary-500"
                    style={{ width: `${item.uploadProgress || 0}%` }}
                  />
                </View>
              )}

              <TouchableOpacity
                onPress={() => removeMedia(index)}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>

              {item.type === 'video' && (
                <View className="absolute top-1 left-1 bg-black/70 rounded-full p-1">
                  <Ionicons name="play" size={12} color="#fff" />
                </View>
              )}
            </View>
          ))}

          {mediaItems.length < MAX_ATTACHMENTS && (
            <TouchableOpacity
              onPress={handleMediaPick}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-500 items-center justify-center"
            >
              <Ionicons name="add" size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          )}
        </ScrollView>

        <Text className="text-xs text-gray-400 mt-1">
          {mediaItems.length}/{MAX_ATTACHMENTS} files • 10MB max per file
        </Text>
      </View>
    );
  }, [mediaItems, handleMediaPick, removeMedia]);

  return (
    <View className="rounded-2xl">
      {/* Type Selector */}
      <View className="flex-row my-3">
        {[
          { label: 'Regular', value: 'REGULAR', icon: 'chatbubble-outline' },
          { label: 'Donation', value: 'DONATION', icon: 'gift-outline' },
          {
            label: 'Token Call',
            value: 'TOKEN_CALL',
            icon: 'megaphone-outline',
          },
        ].map((t) => (
          <TouchableOpacity
            key={t.value}
            className={`flex-1 py-2 mx-1 rounded-xl flex-row items-center justify-center ${
              form.postType === t.value ? 'bg-secondary' : 'bg-secondary/20'
            }`}
            onPress={() => onTypeChange(t.value as PostType)}
          >
            <Ionicons
              name={t.icon as any}
              size={18}
              color={form.postType === t.value ? '#fff' : Colors.dark.secondary}
              style={{ marginRight: 6 }}
            />
            <Text
              className={`text-center font-medium ${
                form.postType === t.value ? 'text-white' : 'text-gray-400'
              }`}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Content Field */}
      <TextInput
        className="bg-secondary-light text-white rounded-xl px-4 py-3 mb-2"
        placeholder="What's on your mind?"
        placeholderTextColor="#888"
        multiline
        value={form.content}
        onChangeText={(text) => onFieldChange('content', text)}
        style={{
          minHeight: 120,
          borderWidth: fieldErrors?.content ? 1 : 0,
          borderColor: fieldErrors?.content ? '#ef4444' : undefined,
        }}
        editable={!loading}
      />
      {fieldErrors?.content && (
        <Text className="text-red-500 mb-2">{fieldErrors.content}</Text>
      )}
      {/* Donation Fields */}
      {form.postType === 'DONATION' && (
        <>
          <View className="flex-row gap-2 mb-2">
            <TextInput
              className="bg-secondary-light text-white rounded-xl px-4 py-3 flex-1"
              placeholder="Target Amount"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={form.targetAmount}
              onChangeText={(v) => onFieldChange('targetAmount', v)}
              editable={!loading}
              style={{
                borderWidth: fieldErrors?.target_amount ? 1 : 0,
                borderColor: fieldErrors?.target_amount ? '#ef4444' : undefined,
              }}
            />
            <TextInput
              className="bg-secondary-light text-white rounded-xl px-4 py-3 flex-1"
              placeholder="Wallet Address"
              placeholderTextColor="#888"
              value={form.walletAddress}
              onChangeText={(v) => updateWalletAddress(v)}
              editable={!loading}
              style={{
                borderWidth: fieldErrors?.wallet_address ? 1 : 0,
                borderColor: fieldErrors?.wallet_address
                  ? '#ef4444'
                  : undefined,
              }}
            />
          </View>
          <View className="flex-row gap-2 mb-2">
            <TextInput
              className="bg-secondary-light text-white rounded-xl px-4 py-3 flex-1"
              placeholder="Chain Type (e.g. Solana)"
              placeholderTextColor="#888"
              value={form.chainType}
              onChangeText={(v) => onFieldChange('chainType', v)}
              editable={!loading}
              style={{
                borderWidth: fieldErrors?.chain_type ? 1 : 0,
                borderColor: fieldErrors?.chain_type ? '#ef4444' : undefined,
              }}
            />
            <TextInput
              className="bg-secondary-light text-white rounded-xl px-4 py-3 flex-1"
              placeholder="Token Symbol (optional)"
              placeholderTextColor="#888"
              value={form.donationTokenSymbol}
              onChangeText={(v) => onFieldChange('donationTokenSymbol', v)}
              editable={!loading}
            />
          </View>
          <View className="flex-row gap-2 mb-2">
            <TextInput
              className="bg-secondary-light text-white rounded-xl px-4 py-3 flex-1"
              placeholder="Token Address (optional)"
              placeholderTextColor="#888"
              value={form.donationTokenAddress}
              onChangeText={(v) => updateTokenAddress(v)}
              editable={!loading}
            />
            <TouchableOpacity
              className="flex-1 justify-center items-center bg-secondary-light rounded-xl px-4 py-3"
              onPress={() => setShowDeadlinePicker(true)}
              disabled={loading}
            >
              <Text
                className={`${form.deadline ? 'text-white' : 'text-[#888]'}`}
              >
                {form.deadline
                  ? new Date(form.deadline).toLocaleString()
                  : 'Deadline (optional)'}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={showDeadlinePicker}
              mode="datetime"
              date={form.deadline ? new Date(form.deadline) : new Date()}
              onConfirm={(date) => {
                setShowDeadlinePicker(false);
                if (date) onFieldChange('deadline', date.toISOString());
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
          {isNotValidAddress && (
            <Text className="text-red-500 mb-2">
              Your wallet address is not a valid solana address
            </Text>
          )}
          {isNotValidTokenAddress && (
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
      {form.postType === 'TOKEN_CALL' && (
        <>
          <TextInput
            className="bg-secondary-light text-white rounded-xl px-4 py-3 mb-2"
            placeholder="Token Name"
            placeholderTextColor="#888"
            value={form.tokenName}
            onChangeText={(v) => onFieldChange('tokenName', v)}
            editable={!loading}
            style={{
              borderWidth: fieldErrors?.token_name ? 1 : 0,
              borderColor: fieldErrors?.token_name ? '#ef4444' : undefined,
            }}
          />
          <TextInput
            className="bg-secondary-light text-white rounded-xl px-4 py-3 mb-2"
            placeholder="Token Symbol"
            placeholderTextColor="#888"
            value={form.tokenSymbol}
            onChangeText={(v) => onFieldChange('tokenSymbol', v)}
            editable={!loading}
            style={{
              borderWidth: fieldErrors?.token_symbol ? 1 : 0,
              borderColor: fieldErrors?.token_symbol ? '#ef4444' : undefined,
            }}
          />
          <TextInput
            className="bg-secondary-light text-white rounded-xl px-4 py-3 mb-2"
            placeholder="Token Address"
            placeholderTextColor="#888"
            value={form.tokenAddress}
            onChangeText={(v) => updateTokenAddress(v)}
            editable={!loading}
            style={{
              borderWidth: fieldErrors?.token_address ? 1 : 0,
              borderColor: fieldErrors?.token_address ? '#ef4444' : undefined,
            }}
          />
          <TextInput
            className="bg-secondary-light text-white rounded-xl px-4 py-3 mb-2"
            placeholder="Chain Type (e.g. Solana)"
            placeholderTextColor="#888"
            value={form.tokenChainType}
            onChangeText={(v) => onFieldChange('tokenChainType', v)}
            editable={!loading}
            style={{
              borderWidth: fieldErrors?.chain_type ? 1 : 0,
              borderColor: fieldErrors?.chain_type ? '#ef4444' : undefined,
            }}
          />
          <TextInput
            className="bg-secondary-light text-white rounded-xl px-4 py-3 mb-2"
            placeholder="Logo URL (optional)"
            placeholderTextColor="#888"
            value={form.logoUrl}
            onChangeText={(v) => onFieldChange('logoUrl', v)}
            editable={!loading}
          />
          <TouchableOpacity
            className="justify-center items-center bg-secondary-light rounded-xl px-4 py-3 mb-2"
            onPress={() => setShowLaunchDatePicker(true)}
            disabled={loading}
          >
            <Text
              className={`${form.launchDate ? 'text-white' : 'text-[#888]'}`}
            >
              {form.launchDate
                ? new Date(form.launchDate).toLocaleString()
                : 'Launch Date (optional)'}
            </Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={showLaunchDatePicker}
            mode="datetime"
            date={form.launchDate ? new Date(form.launchDate) : new Date()}
            onConfirm={(date) => {
              setShowLaunchDatePicker(false);
              if (date) onFieldChange('launchDate', date.toISOString());
            }}
            onCancel={() => setShowLaunchDatePicker(false)}
            display="default"
          />
          <View className="flex-row gap-2 mb-2">
            <TextInput
              className="bg-secondary-light text-white rounded-xl px-4 py-3 flex-1"
              placeholder="Initial Price (optional)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={form.initialPrice}
              onChangeText={(v) => onFieldChange('initialPrice', v)}
              editable={!loading}
            />
            <TextInput
              className="bg-secondary-light text-white rounded-xl px-4 py-3 flex-1"
              placeholder="Target Price (optional)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={form.targetPrice}
              onChangeText={(v) => onFieldChange('targetPrice', v)}
              editable={!loading}
            />
          </View>
          <TextInput
            className="bg-secondary-light text-white rounded-xl px-4 py-3 mb-2"
            placeholder="Market Cap (optional)"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={form.marketCap}
            onChangeText={(v) => onFieldChange('marketCap', v)}
            editable={!loading}
          />
          <TextInput
            className="bg-secondary-light text-white rounded-xl px-4 py-3 mb-2"
            placeholder="Description (optional)"
            placeholderTextColor="#888"
            value={form.description}
            onChangeText={(v) => onFieldChange('description', v)}
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
          {isNotValidTokenAddress && (
            <Text className="text-red-500 mb-2">
              The Token Address inputted is not valid
            </Text>
          )}
        </>
      )}
      {/* Media Preview */}
      {renderMediaPreview()}

      <View className="mt-2">
        <TouchableOpacity
          className="bg-secondary rounded-xl px-4 py-2"
          onPress={onSubmit}
          disabled={loading || mediaItems.some((m) => m.uploading)}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading || mediaItems.some((m) => m.uploading) ? (
            <View className="flex flex-row items-center justify-center gap-2">
              <Text className="text-white">
                {mediaItems.some((m) => m.uploading)
                  ? 'Uploading...'
                  : 'Posting...'}
              </Text>
              <ActivityIndicator color="#fff" size="small" />
            </View>
          ) : (
            <View className="flex flex-row items-center justify-center gap-2">
              <Text className="text-white font-medium">Post</Text>
              <Ionicons name="send" size={18} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </View>
      {error && <Text className="text-red-500 mt-2 text-center">{error}</Text>}
    </View>
  );
};

export default PostComposer;
