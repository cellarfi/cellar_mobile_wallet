import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import * as VideoThumbnails from 'expo-video-thumbnails'
import React, { useCallback } from 'react'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'

export interface MediaItem {
  uri: string
  type: 'image' | 'video' | 'gif'
  fileName?: string
  mimeType?: string
  fileSize?: number
  thumbnail?: string
}

interface MediaAttachmentProps {
  mediaItems: MediaItem[]
  onMediaItemsChange: (items: MediaItem[]) => void
  onMediaSelect: () => void
  onGifSelect: (gifUrl: string) => void
  maxAttachments?: number
  maxFileSize?: number
  uploading?: boolean
  disabled?: boolean
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_ATTACHMENTS = 5

const MediaAttachment: React.FC<MediaAttachmentProps> = ({
  mediaItems,
  onMediaItemsChange,
  onMediaSelect,
  onGifSelect,
  maxAttachments = MAX_ATTACHMENTS,
  maxFileSize = MAX_FILE_SIZE,
  uploading = false,
  disabled = false,
}) => {
  const addMediaItems = useCallback(
    (items: MediaItem[]) => {
      // Filter out any duplicate URIs
      const newItems = items.filter(
        (item) => !mediaItems.some((existing) => existing.uri === item.uri)
      )
      onMediaItemsChange([...mediaItems, ...newItems])
    },
    [mediaItems, onMediaItemsChange]
  )

  const handleMediaPick = useCallback(async () => {
    if (mediaItems.length >= maxAttachments) {
      Alert.alert(
        'Maximum attachments reached',
        `You can only attach up to ${maxAttachments} files.`
      )
      return
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos', 'livePhotos'],
        allowsMultipleSelection: true,
        selectionLimit: maxAttachments - mediaItems.length,
        quality: 0.8,
      })

      if (result.canceled) return

      const newMediaItems: MediaItem[] = []

      for (const asset of result.assets) {
        if (!asset.uri) continue

        // Check file size
        if (asset.fileSize && asset.fileSize > maxFileSize) {
          Alert.alert(
            'File too large',
            `${asset.fileName || 'File'} exceeds the ${maxFileSize / 1024 / 1024}MB size limit.`
          )
          continue
        }

        // Handle media type
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

      onMediaSelect()
    } catch (error) {
      console.error('Error picking media:', error)
      Alert.alert('Error', 'Failed to pick media. Please try again.')
    }
  }, [
    addMediaItems,
    mediaItems.length,
    maxAttachments,
    maxFileSize,
    onMediaSelect,
  ])

  const removeMedia = useCallback(
    (index: number) => {
      const newItems = mediaItems.filter((_, i) => i !== index)
      onMediaItemsChange(newItems)
    },
    [mediaItems, onMediaItemsChange]
  )

  const renderMediaPreview = () => {
    if (mediaItems.length === 0) {
      return (
        <View className='mt-2'>
          <TouchableOpacity
            onPress={handleMediaPick}
            className='flex-row items-center py-2 px-3 bg-dark-800/50 rounded-lg border border-dashed border-gray-600'
            disabled={disabled}
            style={{ opacity: disabled ? 0.7 : 1 }}
          >
            <Ionicons
              name='attach'
              size={20}
              color={Colors.dark.text}
              style={{ marginRight: 8 }}
            />
            <Text className='text-gray-300'>Add photos or videos</Text>
          </TouchableOpacity>
          <Text className='text-xs text-gray-500 mt-1 ml-1'>
            {maxAttachments} files max • {maxFileSize / 1024 / 1024}MB per file
          </Text>
        </View>
      )
    }

    return (
      <View className='mt-2 mb-3'>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className='py-2'
        >
          {mediaItems.map((item, index) => (
            <View
              key={item.uri}
              className='relative mr-2 rounded-lg overflow-hidden bg-dark-200'
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
                  contentFit='cover'
                />
              ) : (
                <View className='flex-1 items-center justify-center bg-dark-300'>
                  <Ionicons name='image' size={24} color={Colors.dark.text} />
                </View>
              )}

              {uploading && (
                <View className='absolute bottom-0 left-0 right-0 h-1 bg-dark-400'>
                  <View
                    className='h-full bg-primary-500'
                    style={{ width: '100%' }}
                  />
                </View>
              )}

              <TouchableOpacity
                onPress={() => removeMedia(index)}
                className='absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center'
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                  elevation: 2,
                }}
                disabled={disabled}
              >
                <Ionicons name='close' size={12} color='#fff' />
              </TouchableOpacity>

              {item.type === 'video' && (
                <View className='absolute top-1 left-1 bg-black/70 rounded-full p-1'>
                  <Ionicons name='play' size={12} color='#fff' />
                </View>
              )}
            </View>
          ))}

          {mediaItems.length < maxAttachments && (
            <TouchableOpacity
              onPress={handleMediaPick}
              className='rounded-lg border-2 border-dashed border-gray-500 items-center justify-center'
              style={{ width: 80, height: 80 }}
              disabled={disabled}
            >
              <Ionicons name='add' size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          )}
        </ScrollView>

        <Text className='text-xs text-gray-400 mt-1'>
          {mediaItems.length}/{maxAttachments} files •{' '}
          {maxFileSize / 1024 / 1024}MB max per file
        </Text>
      </View>
    )
  }

  return <>{renderMediaPreview()}</>
}

export default MediaAttachment
