import { UploadRequests } from '@/libs/api_requests/upload.request'
import { PostComposerProps } from '@/types/posts.interface'
import { router } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import EmojiPicker from '../EmojiPicker'
import GifPicker from './GifPicker'
import {
  ContentEditor,
  DonationFields,
  MediaAttachment,
  MediaItem,
  PostTypeSelector,
  TokenCallFields,
} from './post-editor'

const PostComposer: React.FC<PostComposerProps> = ({
  form,
  onFieldChange,
  onTypeChange,
  onSubmit,
  loading,
  error,
  fieldErrors,
  selectedToken,
}) => {
  // Media and UI state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)

  // Handle content selection change for emoji insertion
  const handleSelectionChange = (start: number, end: number) => {
    setCursorPosition(start)
  }

  // Handle emoji selection
  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      const newText =
        form.content.slice(0, cursorPosition) +
        emoji +
        form.content.slice(cursorPosition)
      onFieldChange('content', newText)
      setShowEmojiPicker(false)
    },
    [form.content, cursorPosition, onFieldChange]
  )

  // Handle GIF selection
  const handleGifSelect = useCallback((gifUrl: string) => {
    const newMediaItem: MediaItem = {
      uri: gifUrl,
      type: 'gif',
    }
    setMediaItems((prev) => [...prev, newMediaItem])
    setShowGifPicker(false)
  }, [])

  // Handle token selector press
  const handleTokenSelectorPress = useCallback(() => {
    router.push({
      pathname: '/(modals)/search',
      params: {
        mode: 'select',
        returnTo: 'post-composer',
        returnParam: 'selectedToken',
        title: 'Select Token for Call',
      },
    })
  }, [])

  // Upload media function
  const uploadMedia = useCallback(async (): Promise<string[]> => {
    if (mediaItems.length === 0) return []

    setUploading(true)
    try {
      if (mediaItems.length === 1) {
        const { success, data, message } = await UploadRequests.uploadSingle({
          uri: mediaItems[0].uri,
          type: mediaItems[0].mimeType || 'image/jpeg',
          name: mediaItems[0].fileName || `file-${Date.now()}`,
        })

        if (success && data) {
          return [data.url]
        } else {
          throw new Error(message || 'Failed to upload file')
        }
      } else {
        const { success, data, message } = await UploadRequests.uploadMultiple(
          mediaItems.map((item) => ({
            uri: item.uri,
            type: item.mimeType || 'image/jpeg',
            name: item.fileName || `file-${Date.now()}`,
          }))
        )

        if (success && data) {
          return data.map((item: { data: { url: string } }) => item.data.url)
        } else {
          throw new Error(message || 'Failed to upload files')
        }
      }
    } finally {
      setUploading(false)
    }
  }, [mediaItems])

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (loading || uploading) return

    try {
      const mediaUrls = await uploadMedia()
      onSubmit(mediaUrls)
    } catch (error) {
      console.error('Error uploading media:', error)
      Alert.alert(
        'Upload Error',
        'Failed to upload one or more media files. Please try again.'
      )
    }
  }, [loading, uploading, uploadMedia, onSubmit])

  // Render type-specific fields
  const renderTypeSpecificFields = () => {
    switch (form.postType) {
      case 'DONATION':
        return (
          <DonationFields
            targetAmount={form.targetAmount}
            deadline={form.deadline}
            onFieldChange={onFieldChange}
            fieldErrors={fieldErrors}
            disabled={loading}
          />
        )

      case 'TOKEN_CALL':
        return (
          <TokenCallFields
            selectedToken={selectedToken || null}
            targetPrice={form.targetPrice}
            onTokenSelectorPress={handleTokenSelectorPress}
            onFieldChange={onFieldChange}
            fieldErrors={fieldErrors}
            disabled={loading}
          />
        )

      default:
        return null
    }
  }

  return (
    <View className='rounded-2xl'>
      {/* Post Type Selector */}
      <PostTypeSelector
        selectedType={form.postType}
        onTypeChange={onTypeChange}
        disabled={loading}
      />

      {/* Content Editor */}
      <View className='mb-4'>
        <ContentEditor
          value={form.content}
          onChangeText={(text) => onFieldChange('content', text)}
          onSelectionChange={handleSelectionChange}
          onEmojiPress={() => setShowEmojiPicker(true)}
          onGifPress={() => setShowGifPicker(true)}
          onAttachPress={() => {}}
          error={fieldErrors?.content}
          disabled={loading}
          mediaCount={mediaItems.length}
        />
      </View>

      {/* Type-specific Fields */}
      {renderTypeSpecificFields()}

      {/* Media Attachment */}
      {mediaItems.length > 0 && (
        <MediaAttachment
          mediaItems={mediaItems}
          onMediaItemsChange={setMediaItems}
          onMediaSelect={() => {}}
          onGifSelect={handleGifSelect}
          uploading={uploading}
          disabled={loading}
        />
      )}

      {/* Submit Button */}
      <View className='mt-2'>
        <TouchableOpacity
          className='bg-secondary rounded-xl px-4 py-2'
          onPress={handleSubmit}
          disabled={loading || uploading}
          style={{ opacity: loading || uploading ? 0.7 : 1 }}
        >
          {loading || uploading ? (
            <View className='flex flex-row items-center justify-center gap-2'>
              <Text className='text-white'>Posting</Text>
              <ActivityIndicator color='#fff' size='small' />
            </View>
          ) : (
            <View className='flex flex-row items-center justify-center gap-2'>
              <Text className='text-white font-medium'>Post</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Error message */}
      {error && <Text className='text-red-500 mt-2 text-center'>{error}</Text>}

      {/* Modals */}
      <EmojiPicker
        visible={showEmojiPicker}
        onSelect={handleEmojiSelect}
        onClose={() => setShowEmojiPicker(false)}
      />

      <GifPicker
        visible={showGifPicker}
        onSelect={handleGifSelect}
        onClose={() => setShowGifPicker(false)}
      />
    </View>
  )
}

export default PostComposer
