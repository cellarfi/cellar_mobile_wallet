import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useVideoPlayer, VideoView } from 'expo-video'
import * as VideoThumbnails from 'expo-video-thumbnails'
import React, { useCallback, useEffect, useState } from 'react'
import { Dimensions, Modal, Text, TouchableOpacity, View } from 'react-native'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

const MAX_IMAGES = 4
const MAX_VIDEOS = 1
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface MediaGalleryProps {
  media: string[]
  maxItems?: number
}

// Fullscreen Video Modal with controls
interface FullscreenVideoModalProps {
  visible: boolean
  uri: string
  onClose: () => void
}

const FullscreenVideoModal: React.FC<FullscreenVideoModalProps> = ({
  visible,
  uri,
  onClose,
}) => {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false
    player.play()
  })

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      animationType='fade'
      presentationStyle='fullScreen'
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className='flex-1 bg-black'>
          <TouchableOpacity
            onPress={onClose}
            className='absolute top-12 left-4 z-50 bg-black/60 rounded-full p-2'
          >
            <Ionicons name='close' size={28} color='white' />
          </TouchableOpacity>
          <VideoView
            player={player}
            style={{ flex: 1 }}
            contentFit='contain'
            nativeControls={true}
            allowsFullscreen={true}
            allowsPictureInPicture={true}
          />
        </View>
      </GestureHandlerRootView>
    </Modal>
  )
}

// Fullscreen Image Modal with zoom
interface FullscreenImageModalProps {
  visible: boolean
  uri: string
  onClose: () => void
}

const FullscreenImageModal: React.FC<FullscreenImageModalProps> = ({
  visible,
  uri,
  onClose,
}) => {
  const scale = useSharedValue(1)
  const savedScale = useSharedValue(1)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const savedTranslateX = useSharedValue(0)
  const savedTranslateY = useSharedValue(0)

  const resetZoom = useCallback(() => {
    scale.value = withTiming(1)
    translateX.value = withTiming(0)
    translateY.value = withTiming(0)
    savedScale.value = 1
    savedTranslateX.value = 0
    savedTranslateY.value = 0
  }, [
    scale,
    translateX,
    translateY,
    savedScale,
    savedTranslateX,
    savedTranslateY,
  ])

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withTiming(1)
        savedScale.value = 1
        translateX.value = withTiming(0)
        translateY.value = withTiming(0)
        savedTranslateX.value = 0
        savedTranslateY.value = 0
      } else if (scale.value > 4) {
        scale.value = withTiming(4)
        savedScale.value = 4
      } else {
        savedScale.value = scale.value
      }
    })

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX
        translateY.value = savedTranslateY.value + e.translationY
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value
      savedTranslateY.value = translateY.value
    })

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        runOnJS(resetZoom)()
      } else {
        scale.value = withTiming(2)
        savedScale.value = 2
      }
    })

  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      if (scale.value === 1) {
        runOnJS(onClose)()
      }
    })

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    Gesture.Exclusive(doubleTapGesture, singleTapGesture)
  )

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }))

  useEffect(() => {
    if (visible) {
      resetZoom()
    }
  }, [visible, resetZoom])

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      animationType='fade'
      presentationStyle='fullScreen'
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className='flex-1 bg-black'>
          <TouchableOpacity
            onPress={onClose}
            className='absolute top-12 left-4 z-50 bg-black/60 rounded-full p-2'
          >
            <Ionicons name='close' size={28} color='white' />
          </TouchableOpacity>
          <GestureDetector gesture={composedGesture}>
            <Animated.View
              className='flex-1 justify-center items-center'
              style={animatedStyle}
            >
              <Image
                source={{ uri }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                contentFit='contain'
              />
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  )
}

// Video thumbnail with play button
interface VideoThumbnailProps {
  uri: string
  onPress: () => void
}

const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const VideoThumbnailView: React.FC<VideoThumbnailProps> = ({
  uri,
  onPress,
}) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [duration, setDuration] = useState<number | null>(null)

  // Create a player just to get duration
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false
    player.muted = true
  })

  useEffect(() => {
    // Listen for duration changes
    const checkDuration = () => {
      if (player.duration && player.duration > 0) {
        setDuration(player.duration)
      }
    }

    // Check immediately and set up interval for when metadata loads
    checkDuration()
    const interval = setInterval(checkDuration, 100)

    // Clear after 3 seconds max
    const timeout = setTimeout(() => clearInterval(interval), 3000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [player])

  const generateThumbnail = useCallback(async () => {
    try {
      const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(
        uri,
        { time: 1000 }
      )
      setThumbnail(thumbnailUri)
    } catch (e) {
      console.log('Error generating thumbnail:', e)
    }
  }, [uri])

  useEffect(() => {
    generateThumbnail()
  }, [generateThumbnail])

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className='w-full h-full'
    >
      {thumbnail ? (
        <Image
          source={{ uri: thumbnail }}
          style={{ width: '100%', height: '100%' }}
          contentFit='cover'
        />
      ) : (
        <View className='w-full h-full bg-gray-800' />
      )}
      {/* Play button overlay */}
      <View className='absolute inset-0 justify-center items-center'>
        <View className='w-14 h-14 rounded-full bg-black/60 justify-center items-center'>
          <Ionicons
            name='play'
            size={28}
            color='white'
            style={{ marginLeft: 3 }}
          />
        </View>
      </View>
      {/* Duration badge - bottom left like X/Twitter */}
      {duration !== null && (
        <View className='absolute bottom-2 left-2 bg-black/80 rounded px-1.5 py-0.5'>
          <Text className='text-white text-xs font-medium'>
            {formatDuration(duration)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const isGif = (uri: string): boolean => {
  return (
    uri.toLowerCase().endsWith('.gif') || uri.toLowerCase().includes('.gif')
  )
}

const isVideo = (uri: string): boolean => {
  const lowerUri = uri.toLowerCase()
  return (
    lowerUri.endsWith('.mp4') ||
    lowerUri.endsWith('.mov') ||
    lowerUri.endsWith('.webm')
  )
}

const MediaGallery: React.FC<MediaGalleryProps> = ({
  media = [],
  maxItems = MAX_IMAGES,
}) => {
  const [fullscreenVideo, setFullscreenVideo] = useState<string | null>(null)
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)

  const videoUris = media.filter(isVideo)
  const imageUris = media.filter((uri) => !isVideo(uri))

  // Show videos first, then images
  const displayMedia = [...videoUris.slice(0, MAX_VIDEOS), ...imageUris].slice(
    0,
    maxItems
  )
  const remainingCount = media.length - displayMedia.length

  const handleMediaPress = (uri: string) => {
    if (isVideo(uri)) {
      setFullscreenVideo(uri)
    } else {
      setFullscreenImage(uri)
    }
  }

  const getItemClassName = (index: number, total: number): string => {
    const baseClass = 'relative overflow-hidden rounded-lg bg-gray-900'

    switch (total) {
      case 1:
        return `${baseClass} w-full aspect-[4/3]`
      case 2:
        return `${baseClass} w-[49%] aspect-square`
      case 3:
        if (index === 0) return `${baseClass} w-full h-[200px] mb-1`
        return `${baseClass} w-[49%] h-[120px]`
      case 4:
        return `${baseClass} w-[49%] aspect-square`
      default:
        return `${baseClass} w-full aspect-[4/3]`
    }
  }

  const renderMediaItem = (uri: string, index: number, total: number) => {
    const isGifImage = isGif(uri)
    const isVideoFile = isVideo(uri)
    const isLastWithMore =
      index === displayMedia.length - 1 && remainingCount > 0

    return (
      <View key={uri} className={getItemClassName(index, total)}>
        {isVideoFile ? (
          <VideoThumbnailView uri={uri} onPress={() => handleMediaPress(uri)} />
        ) : isGifImage ? (
          <TouchableOpacity
            onPress={() => handleMediaPress(uri)}
            activeOpacity={0.9}
            className='w-full h-full'
          >
            <Image
              source={{ uri }}
              style={{ width: '100%', height: '100%' }}
              contentFit='cover'
              transition={300}
              autoplay={true}
            />
            {/* GIF indicator */}
            <View className='absolute top-2 left-2 bg-secondary rounded-md px-2 py-1'>
              <Text className='text-white text-xs font-bold'>GIF</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => handleMediaPress(uri)}
            activeOpacity={0.9}
            className='w-full h-full'
          >
            <Image
              source={{ uri }}
              style={{ width: '100%', height: '100%' }}
              contentFit='cover'
              transition={300}
            />
          </TouchableOpacity>
        )}

        {/* Remaining count overlay */}
        {isLastWithMore && (
          <View className='absolute inset-0 bg-black/60 justify-center items-center pointer-events-none'>
            <Text className='text-white font-bold text-2xl'>
              +{remainingCount}
            </Text>
          </View>
        )}
      </View>
    )
  }

  const renderMediaGrid = () => {
    const total = Math.min(displayMedia.length, maxItems)

    if (total === 3) {
      return (
        <View className='flex-col'>
          {renderMediaItem(displayMedia[0], 0, total)}
          <View className='flex-row justify-between'>
            {renderMediaItem(displayMedia[1], 1, total)}
            {renderMediaItem(displayMedia[2], 2, total)}
          </View>
        </View>
      )
    }

    // Default grid layout for 1, 2, 4 items
    return (
      <View
        className={total > 1 ? 'flex-row flex-wrap justify-between gap-1' : ''}
      >
        {displayMedia.map((uri, index) => renderMediaItem(uri, index, total))}
      </View>
    )
  }

  if (!media.length) return null

  return (
    <View className='mt-2 rounded-xl overflow-hidden'>
      {renderMediaGrid()}

      {/* Fullscreen video modal */}
      <FullscreenVideoModal
        visible={!!fullscreenVideo}
        uri={fullscreenVideo || ''}
        onClose={() => setFullscreenVideo(null)}
      />

      {/* Fullscreen image modal with zoom */}
      <FullscreenImageModal
        visible={!!fullscreenImage}
        uri={fullscreenImage || ''}
        onClose={() => setFullscreenImage(null)}
      />
    </View>
  )
}

export default MediaGallery
