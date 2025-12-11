import { followsRequests } from '@/libs/api_requests/follows.request'
import { moderationRequests } from '@/libs/api_requests/moderation.request'
import { PostsRequests } from '@/libs/api_requests/posts.request'
import { useAuthStore } from '@/store/authStore'
import { useBlockedUserStore } from '@/store/socialEventsStore'
import { Post } from '@/types/posts.interface'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

// Predefined post report reasons similar to popular social apps
const POST_REPORT_REASONS = [
  { id: 'spam', label: 'Spam or scam' },
  { id: 'harassment', label: 'Harassment or bullying' },
  { id: 'hate', label: 'Hate speech or discrimination' },
  { id: 'violence', label: 'Violence or threats' },
  { id: 'nudity', label: 'Nudity or sexual content' },
  { id: 'misinformation', label: 'False information or misinformation' },
  { id: 'copyright', label: 'Intellectual property violation' },
  { id: 'other', label: 'Other' },
]

interface PostHeaderProps {
  post: Post
  onEdit?: () => void
  onDelete?: () => void
  onBlock?: () => void
  onFollowChange?: (isFollowing: boolean) => void
  showFollowButton?: boolean
}

const PostHeader = React.memo(
  ({
    post,
    onEdit,
    onDelete,
    onBlock,
    onFollowChange,
    showFollowButton = false,
  }: PostHeaderProps) => {
    const { profile } = useAuthStore()
    const [showMenu, setShowMenu] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [blocking, setBlocking] = useState(false)
    const [showReportInput, setShowReportInput] = useState(false)
    const [selectedReasons, setSelectedReasons] = useState<string[]>([])
    const [reportReason, setReportReason] = useState('')
    const [reporting, setReporting] = useState(false)
    const [isFollowing, setIsFollowing] = useState(post.is_following ?? false)
    const [followLoading, setFollowLoading] = useState(false)
    const translateY = useSharedValue(300)
    const opacity = useSharedValue(0)

    const toggleReason = (reasonId: string) => {
      setSelectedReasons((prev) =>
        prev.includes(reasonId)
          ? prev.filter((id) => id !== reasonId)
          : [...prev, reasonId]
      )
    }
    const isOwner = profile?.id === post.user_id

    const handleMenu = () => {
      setShowMenu(true)
      translateY.value = withSpring(0, { damping: 20, stiffness: 100 })
      opacity.value = withSpring(1)
    }

    const closeMenu = () => {
      translateY.value = withSpring(300, { damping: 20, stiffness: 100 })
      opacity.value = withSpring(0)
      setTimeout(() => setShowMenu(false), 200)
    }

    const gesture = Gesture.Pan()
      .onStart(() => {
        // Store initial position
      })
      .onUpdate((event) => {
        translateY.value = Math.max(0, event.translationY)
      })
      .onEnd((event) => {
        if (event.translationY > 50 || event.velocityY > 500) {
          translateY.value = withSpring(300, { damping: 20, stiffness: 100 })
          opacity.value = withSpring(0)
          runOnJS(setTimeout)(() => runOnJS(setShowMenu)(false), 200)
        } else {
          translateY.value = withSpring(0, { damping: 20, stiffness: 100 })
        }
      })

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }))

    const backdropStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }))

    const handleEdit = () => {
      closeMenu()
      onEdit?.()
    }

    const handleDelete = () => {
      closeMenu()
      Alert.alert(
        'Delete Post',
        'Are you sure you want to delete this post? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setDeleting(true)
              try {
                const response = await PostsRequests.deletePost(post.id)
                if (response.success) {
                  onDelete?.()
                } else {
                  Alert.alert(
                    'Error',
                    response.message || 'Failed to delete post'
                  )
                }
              } catch (err: any) {
                Alert.alert('Error', err?.message || 'Failed to delete post')
              } finally {
                setDeleting(false)
              }
            },
          },
        ]
      )
    }

    const handleViewProfile = () => {
      closeMenu()
      router.push(`/profile/${post.user.tag_name}` as any)
    }

    const handleBlockUser = () => {
      closeMenu()
      Alert.alert(
        'Block User',
        `Are you sure you want to block @${post.user.tag_name}? They won't be able to see your posts or interact with you.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Block',
            style: 'destructive',
            onPress: async () => {
              setBlocking(true)
              try {
                const response = await moderationRequests.blockUser(
                  post.user_id
                )
                if (response.success) {
                  // Trigger removal of blocked user's posts from feed
                  useBlockedUserStore.getState().blockUser(post.user_id)
                  Alert.alert(
                    'Blocked',
                    `@${post.user.tag_name} has been blocked.`
                  )
                  onBlock?.()
                } else {
                  Alert.alert(
                    'Error',
                    response.message || 'Failed to block user'
                  )
                }
              } catch (err: any) {
                Alert.alert('Error', err?.message || 'Failed to block user')
              } finally {
                setBlocking(false)
              }
            },
          },
        ]
      )
    }

    const handleReportPost = () => {
      closeMenu()
      // Wait for the menu to close before showing the report modal
      setTimeout(() => {
        setShowReportInput(true)
      }, 250)
    }

    const submitReport = async () => {
      if (selectedReasons.length === 0 && !reportReason.trim()) {
        Alert.alert('Error', 'Please select at least one reason for the report')
        return
      }

      // Build the report reason from selected options and custom text
      const selectedLabels = selectedReasons
        .filter((id) => id !== 'other')
        .map((id) => POST_REPORT_REASONS.find((r) => r.id === id)?.label)
        .filter(Boolean)

      let fullReason = selectedLabels.join(', ')
      if (selectedReasons.includes('other') && reportReason.trim()) {
        fullReason = fullReason
          ? `${fullReason}. Additional details: ${reportReason.trim()}`
          : reportReason.trim()
      }

      setReporting(true)
      try {
        const response = await moderationRequests.reportPost(
          post.id,
          fullReason
        )
        if (response.success) {
          Alert.alert(
            'Report Submitted',
            'Thank you for your report. Our team will review it.'
          )
          setShowReportInput(false)
          setSelectedReasons([])
          setReportReason('')
        } else {
          Alert.alert('Error', response.message || 'Failed to submit report')
        }
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Failed to submit report')
      } finally {
        setReporting(false)
      }
    }

    const formatTimeAgo = (dateString: string) => {
      const now = new Date()
      const date = new Date(dateString)
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
      const diffInDays = Math.floor(diffInSeconds / 86400)

      // Less than 60 seconds
      if (diffInSeconds < 60) return `${diffInSeconds}s`
      // Less than 60 minutes
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
      // Less than 24 hours
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
      // Less than 7 days
      if (diffInDays < 7) return `${diffInDays}d`

      // Format date
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ]
      const day = date.getDate().toString().padStart(2, '0')
      const month = months[date.getMonth()]
      const year = date.getFullYear()
      const currentYear = now.getFullYear()

      // Same year: show "03 Dec"
      if (year === currentYear) {
        return `${day} ${month}`
      }
      // Different year: show "03 Dec 23"
      return `${day} ${month} ${year.toString().slice(-2)}`
    }

    return (
      <View className='flex-row items-center mb-3'>
        {/* Profile Picture */}
        <TouchableOpacity onPress={handleViewProfile}>
          <View className='w-11 h-11 bg-gray-700 rounded-full justify-center items-center mr-3 overflow-hidden'>
            {post.user?.profile_picture_url ? (
              <Image
                source={{ uri: post.user.profile_picture_url }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
              />
            ) : (
              <Text className='text-white text-base font-bold'>
                {post.user?.display_name?.[0]?.toUpperCase() || '?'}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* User Info */}
        <View className='flex-1'>
          <TouchableOpacity onPress={handleViewProfile}>
            <Text className='text-gray-100 font-bold text-base'>
              {post.user?.display_name || 'Unknown User'}
            </Text>
          </TouchableOpacity>
          <View className='flex-row items-center'>
            <TouchableOpacity onPress={handleViewProfile}>
              <Text className='text-gray-400 text-sm'>
                @{post.user?.tag_name || 'unknown'}
              </Text>
            </TouchableOpacity>
            <Text className='text-gray-500 text-sm ml-2'>
              · {formatTimeAgo(post.created_at)}
            </Text>
          </View>
        </View>

        {/* Follow Button and Menu Button */}
        <View className='flex-row items-center'>
          {showFollowButton && !isOwner && !isFollowing && (
            <TouchableOpacity
              onPress={async () => {
                setFollowLoading(true)
                try {
                  const response = await followsRequests.followUser(
                    post.user_id
                  )
                  if (response.success) {
                    setIsFollowing(true)
                    onFollowChange?.(true)
                  } else {
                    Alert.alert(
                      'Error',
                      response.message || 'Failed to follow user'
                    )
                  }
                } catch (err: any) {
                  Alert.alert('Error', err?.message || 'Failed to follow user')
                } finally {
                  setFollowLoading(false)
                }
              }}
              disabled={followLoading}
              className='bg-primary-500 px-4 py-1.5 rounded-full mr-2'
            >
              {followLoading ? (
                <ActivityIndicator size='small' color='white' />
              ) : (
                <Text className='text-white font-semibold text-sm'>Follow</Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleMenu}
            className='w-8 h-8 rounded-full justify-center items-center'
          >
            <Ionicons name='ellipsis-horizontal' size={20} color='#9ca3af' />
          </TouchableOpacity>
        </View>

        {/* Bottom Sheet Modal */}
        <Modal visible={showMenu} transparent animationType='none'>
          <GestureHandlerRootView className='flex-1'>
            <Animated.View className='flex-1' style={backdropStyle}>
              <TouchableOpacity
                className='flex-1 bg-black/50'
                onPress={closeMenu}
                activeOpacity={1}
              />
              <GestureDetector gesture={gesture}>
                <Animated.View
                  className='bg-primary-main rounded-t-3xl border-t border-zinc-800'
                  style={[animatedStyle, { paddingBottom: 20 }]}
                >
                  {/* Handle bar */}
                  <View className='w-12 h-1 bg-zinc-600 rounded-full self-center mt-3 mb-4' />

                  {/* Menu Items */}
                  <View className='px-6'>
                    {isOwner && (
                      <>
                        <TouchableOpacity
                          onPress={handleEdit}
                          className='flex-row items-center py-4 border-b border-zinc-800'
                        >
                          <View className='w-10 h-10 bg-blue-500/20 rounded-full items-center justify-center mr-4'>
                            <Ionicons name='pencil' size={18} color='#3b82f6' />
                          </View>
                          <Text className='text-gray-100 text-lg font-medium'>
                            Edit Post
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleDelete}
                          disabled={deleting}
                          className='flex-row items-center py-4 border-b border-zinc-800'
                        >
                          <View className='w-10 h-10 bg-red-500/20 rounded-full items-center justify-center mr-4'>
                            <Ionicons name='trash' size={18} color='#ef4444' />
                          </View>
                          <Text className='text-gray-100 text-lg font-medium'>
                            {deleting ? 'Deleting...' : 'Delete Post'}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                    <TouchableOpacity
                      onPress={handleViewProfile}
                      className='flex-row items-center py-4 border-b border-zinc-800'
                    >
                      <View className='w-10 h-10 bg-green-500/20 rounded-full items-center justify-center mr-4'>
                        <Ionicons name='person' size={18} color='#10b981' />
                      </View>
                      <Text className='text-gray-100 text-lg font-medium'>
                        View Profile
                      </Text>
                    </TouchableOpacity>
                    {!isOwner && (
                      <>
                        <TouchableOpacity
                          onPress={handleReportPost}
                          className='flex-row items-center py-4 border-b border-zinc-800'
                        >
                          <View className='w-10 h-10 bg-yellow-500/20 rounded-full items-center justify-center mr-4'>
                            <Ionicons name='flag' size={18} color='#eab308' />
                          </View>
                          <Text className='text-gray-100 text-lg font-medium'>
                            Report Post
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleBlockUser}
                          disabled={blocking}
                          className='flex-row items-center py-4'
                        >
                          <View className='w-10 h-10 bg-red-500/20 rounded-full items-center justify-center mr-4'>
                            <Ionicons name='ban' size={18} color='#ef4444' />
                          </View>
                          <Text className='text-gray-100 text-lg font-medium'>
                            {blocking ? 'Blocking...' : 'Block User'}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </Animated.View>
              </GestureDetector>
            </Animated.View>
          </GestureHandlerRootView>
        </Modal>

        {/* Report Input Modal */}
        <Modal visible={showReportInput} transparent animationType='fade'>
          <View className='flex-1 bg-black/80 justify-center p-5'>
            <View className='bg-secondary-light rounded-2xl p-5 max-h-[80%]'>
              <Text className='text-white text-lg font-bold mb-2'>
                Report Post
              </Text>
              <Text className='text-gray-400 text-sm mb-4'>
                Why are you reporting this post? Select all that apply.
              </Text>

              <ScrollView
                className='mb-4'
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 300 }}
              >
                {POST_REPORT_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.id}
                    onPress={() => toggleReason(reason.id)}
                    className='flex-row items-center py-3 border-b border-gray-700'
                  >
                    <View
                      className={`w-6 h-6 rounded-md border-2 mr-3 items-center justify-center ${
                        selectedReasons.includes(reason.id)
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-gray-500'
                      }`}
                    >
                      {selectedReasons.includes(reason.id) && (
                        <Ionicons name='checkmark' size={16} color='white' />
                      )}
                    </View>
                    <Text className='text-gray-100 text-base flex-1'>
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Show text input when "Other" is selected */}
                {selectedReasons.includes('other') && (
                  <View className='mt-3'>
                    <Text className='text-gray-400 text-sm mb-2'>
                      Please describe the issue:
                    </Text>
                    <TextInput
                      value={reportReason}
                      onChangeText={setReportReason}
                      multiline
                      placeholder='Describe the issue...'
                      placeholderTextColor='#666'
                      className='text-white bg-gray-800 rounded-lg p-3 min-h-[80px]'
                      style={{ textAlignVertical: 'top' }}
                    />
                  </View>
                )}
              </ScrollView>

              <View className='flex-row justify-end'>
                <TouchableOpacity
                  onPress={() => {
                    setShowReportInput(false)
                    setSelectedReasons([])
                    setReportReason('')
                  }}
                  className='px-4 py-2 mr-2'
                >
                  <Text className='text-gray-400'>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={submitReport}
                  disabled={reporting || selectedReasons.length === 0}
                  className={`px-4 py-2 rounded-lg ${
                    selectedReasons.length === 0
                      ? 'bg-gray-600'
                      : 'bg-primary-500'
                  }`}
                >
                  <Text className='text-white font-bold'>
                    {reporting ? 'Submitting...' : 'Submit'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    )
  }
)

PostHeader.displayName = 'PostHeader'

export default PostHeader
