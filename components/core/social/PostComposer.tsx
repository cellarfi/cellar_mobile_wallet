import { UploadRequests } from '@/libs/api_requests/upload.request'
import { PostComposerProps } from '@/types/posts.interface'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import * as VideoThumbnails from 'expo-video-thumbnails'
import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import GifPicker from './GifPicker'
import {
  ContentEditor,
  DonationFields,
  MediaAttachment,
  MediaItem,
  PostTypeSelector,
  TokenCallFields,
} from './post-editor'

// 10MB in bytes
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_ATTACHMENTS = 5

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
  const [showGifPicker, setShowGifPicker] = useState(false)

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
      pathname: '/(screens)/search',
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
          })),
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

  const addMediaItems = useCallback((items: MediaItem[]) => {
    setMediaItems((prev) => {
      // Filter out any duplicate URIs
      const newItems = items.filter(
        (item) => !prev.some((existing) => existing.uri === item.uri),
      )
      return [...prev, ...newItems]
    })
  }, [])

  // Open up selector
  const handleMediaPick = useCallback(async () => {
    if (mediaItems.length >= MAX_ATTACHMENTS) {
      Alert.alert(
        'Maximum attachments reached',
        `You can only attach up to ${MAX_ATTACHMENTS} files.`,
      )
      return
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos', 'livePhotos'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_ATTACHMENTS - mediaItems.length,
        quality: 0.8,
      })

      if (result.canceled) return

      const newMediaItems: MediaItem[] = []

      for (const asset of result.assets) {
        if (!asset.uri) continue

        // Check file size
        if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
          Alert.alert(
            'File too large',
            `${asset.fileName || 'File'} exceeds the 10MB size limit.`,
          )
          continue
        }

        // Explicitly handle the media type to match our MediaItem type
        let type: 'image' | 'video' | 'gif' = 'image'
        if (asset.type === 'video') {
          type = 'video'
        } else if (
          asset.uri.endsWith('.gif') ||
          asset.type === ('gif' as typeof asset.type)
        ) {
          type = 'gif'
        }
        let thumbnail = asset.uri

        // Generate thumbnail for videos
        if (type === 'video') {
          try {
            const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, {
              time: 0,
            })
            thumbnail = uri
          } catch (e) {
            console.warn('Failed to generate video thumbnail:', e)
          }
        }

        newMediaItems.push({
          uri: asset.uri,
          type,
          fileName: asset.fileName || undefined,
          mimeType: asset.mimeType || undefined,
          fileSize: asset.fileSize,
          thumbnail,
        })
      }

      if (newMediaItems.length > 0) {
        addMediaItems(newMediaItems)
      }
    } catch (error) {
      console.error('Error picking media:', error)
      Alert.alert('Error', 'Failed to pick media. Please try again.')
    }
  }, [addMediaItems, mediaItems.length])

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
        'Failed to upload one or more media files. Please try again.',
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
          onSelectionChange={() => {}}
          onGifPress={() => setShowGifPicker(true)}
          onAttachPress={handleMediaPick}
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
          maxAttachments={MAX_ATTACHMENTS}
          maxFileSize={MAX_FILE_SIZE}
          onMediaItemsChange={setMediaItems}
          onMediaSelect={() => {}}
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
      <GifPicker
        visible={showGifPicker}
        onSelect={handleGifSelect}
        onClose={() => setShowGifPicker(false)}
      />
    </View>
  )
}

export default PostComposer
