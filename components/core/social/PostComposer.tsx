import { Colors } from '@/constants/Colors';
import { UploadRequests } from '@/libs/api_requests/upload.request';
import { isMintAddress, isValidSolanaAddress } from '@/libs/solana.lib';
import { PostComposerProps, PostType } from '@/types/posts.interface';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import EmojiPicker from '../EmojiPicker';

import DateTimePickerModal from 'react-native-modal-datetime-picker';

// 10MB in bytes
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;

export interface MediaItem {
  uri: string;
  type: 'image' | 'video' | 'gif';
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  thumbnail?: string;
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
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  const addMediaItems = useCallback((items: MediaItem[]) => {
    setMediaItems((prev) => {
      // Filter out any duplicate URIs
      const newItems = items.filter(
        (item) => !prev.some((existing) => existing.uri === item.uri)
      );
      return [...prev, ...newItems];
    });
  }, []);

  const handleMediaPick = useCallback(async () => {
    if (mediaItems.length >= MAX_ATTACHMENTS) {
      Alert.alert(
        'Maximum attachments reached',
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
        if (!asset.uri) continue;

        // Check file size
        if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
          Alert.alert(
            'File too large',
            `${asset.fileName || 'File'} exceeds the 10MB size limit.`
          );
          continue;
        }

        // Explicitly handle the media type to match our MediaItem type
        let type: 'image' | 'video' | 'gif' = 'image';
        if (asset.type === 'video') {
          type = 'video';
        } else if (
          asset.uri.endsWith('.gif') ||
          asset.type === ('gif' as typeof asset.type)
        ) {
          type = 'gif';
        }
        let thumbnail = asset.uri;

        // Generate thumbnail for videos
        if (type === 'video') {
          try {
            const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, {
              time: 0,
            });
            thumbnail = uri;
          } catch (e) {
            console.warn('Failed to generate video thumbnail:', e);
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
        addMediaItems(newMediaItems);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media. Please try again.');
    }
  }, [addMediaItems, mediaItems.length]);

  const removeMedia = useCallback((index: number) => {
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const uploadMedia = useCallback(async () => {
    setUploading(true);
    const uploadedMediaUrls: string[] = [];

    try {
      if (mediaItems.length === 1) {
        const { success, data, message } = await UploadRequests.uploadSingle({
          uri: mediaItems[0].uri,
          type: mediaItems[0].mimeType || 'image/jpeg',
          name: mediaItems[0].fileName || `file-${Date.now()}`,
        });

        if (success && data) {
          uploadedMediaUrls.push(data.url);
        } else {
          throw new Error(message || 'Failed to upload file');
        }
      } else {
        // Use batch upload
        const { success, data, message } = await UploadRequests.uploadMultiple(
          mediaItems.map((item) => ({
            uri: item.uri,
            type: item.mimeType || 'image/jpeg',
            name: item.fileName || `file-${Date.now()}`,
          }))
        );

        if (success && data) {
          uploadedMediaUrls.push(
            ...data.map((item: { data: { url: string } }) => item.data.url)
          );
        } else {
          throw new Error(message || 'Failed to upload files');
        }
      }
      return uploadedMediaUrls;
    } finally {
      setUploading(false);
    }
  }, [mediaItems]);

  const handleSubmit = useCallback(async () => {
    if (loading || uploading) return;

    try {
      let mediaUrls: string[] = [];

      // Only upload if there are media items
      if (mediaItems.length > 0) {
        mediaUrls = await uploadMedia();
      }

      // Submit the form
      onSubmit(mediaUrls);
    } catch (error) {
      console.error('Error uploading media:', error);
      Alert.alert(
        'Upload Error',
        'Failed to upload one or more media files. Please try again.'
      );
    }
  }, [loading, uploading, mediaItems, uploadMedia, onSubmit]);

  const updateTokenAddress = (address: string) => {
    if (form.postType === 'DONATION') {
      onFieldChange('donationTokenAddress', address);
    } else {
      onFieldChange('tokenAddress', address);
    }

    const check = isMintAddress(address);
    setisNotValidTokenAddress(!check);
  };

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      const newText =
        form.content.slice(0, cursorPosition) +
        emoji +
        form.content.slice(cursorPosition);
      onFieldChange('content', newText);
      setShowEmojiPicker(false);
      // Move cursor after the inserted emoji
      setTimeout(() => {
        textInputRef.current?.setNativeProps({
          selection: {
            start: cursorPosition + emoji.length,
            end: cursorPosition + emoji.length,
          },
        });
      }, 0);
    },
    [form.content, cursorPosition, onFieldChange]
  );

  const renderMediaPreview = useCallback(() => {
    if (mediaItems.length === 0)
      return (
        <View className="mt-2">
          <TouchableOpacity
            onPress={handleMediaPick}
            className="flex-row items-center py-2 px-3 bg-dark-800/50 rounded-lg border border-dashed border-gray-600"
          >
            <Ionicons
              name="attach"
              size={20}
              color={Colors.dark.text}
              style={{ marginRight: 8 }}
            />
            <Text className="text-gray-300">Add photos or videos</Text>
          </TouchableOpacity>
          <Text className="text-xs text-gray-500 mt-1 ml-1">
            {MAX_ATTACHMENTS} files max • 10MB per file
          </Text>
        </View>
      );

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

              {uploading && (
                <View className="absolute bottom-0 left-0 right-0 h-1 bg-dark-400">
                  <View
                    className="h-full bg-primary-500"
                    style={{ width: '100%' }}
                  />
                </View>
              )}

              <TouchableOpacity
                onPress={() => removeMedia(index)}
                className="absolute -top-5 -right-5 bg-red-500 rounded-full w-5 h-5 items-center justify-center"
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
              className="rounded-lg border-2 border-dashed border-gray-500 items-center justify-center"
              style={{ width: 80, height: 80 }}
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
      {/* Type Selector and Media Button */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row flex-1">
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
                color={
                  form.postType === t.value ? '#fff' : Colors.dark.secondary
                }
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
      </View>
      {/* Content Field */}
      <View className="relative mb-2">
        <TextInput
          ref={textInputRef}
          className="bg-secondary-light text-white rounded-xl px-4 py-3"
          placeholder="What's on your mind?"
          placeholderTextColor="#888"
          multiline
          value={form.content}
          onChangeText={(text) => onFieldChange('content', text)}
          onSelectionChange={({ nativeEvent: { selection } }) => {
            // Keep track of cursor position for emoji insertion
            setCursorPosition(selection.start);
          }}
          style={{
            minHeight: 120,
            borderWidth: fieldErrors?.content ? 1 : 0,
            borderColor: fieldErrors?.content ? '#ef4444' : undefined,
          }}
          editable={!loading}
          maxLength={1000}
        />
        {fieldErrors?.content && (
          <Text className="text-red-500 mb-2">{fieldErrors.content}</Text>
        )}

        <View className="gap-1 flex-row absolute bottom-2 right-2 left-2 items-center">
          {/* Emoji Picker */}
          <EmojiPicker
            visible={showEmojiPicker}
            onSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />

          {/* Attach Media Button */}
          <TouchableOpacity
            onPress={() => setShowEmojiPicker(true)}
            className="p-1"
            disabled={loading}
          >
            <Ionicons name="happy-outline" size={24} color={Colors.dark.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleMediaPick}
            className="p-1"
            disabled={mediaItems.length >= MAX_ATTACHMENTS}
          >
            <Ionicons
              name="attach"
              size={24}
              color={
                mediaItems.length >= MAX_ATTACHMENTS
                  ? Colors.dark.text + '80'
                  : Colors.dark.text
              }
            />
          </TouchableOpacity>

          {/* Character Counter */}
          <View className="ml-auto">
            <Text className="text-gray-400">{form.content.length}/1000</Text>
          </View>
        </View>
      </View>
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
      {/* Media Preview - Only show if there are media items */}
      {mediaItems.length > 0 && renderMediaPreview()}

      <View className="mt-2">
        <TouchableOpacity
          className="bg-secondary rounded-xl px-4 py-2"
          onPress={handleSubmit}
          disabled={loading || uploading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading || uploading ? (
            <View className="flex flex-row items-center justify-center gap-2">
              <Text className="text-white">Posting</Text>
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

      {/* Error message */}
      {error && <Text className="text-red-500 mt-2 text-center">{error}</Text>}
    </View>
  );
};

export default PostComposer;
