import { moderationRequests } from '@/libs/api_requests/moderation.request'
import { User } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
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

// Predefined report reasons similar to popular social apps
const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or scam' },
  { id: 'harassment', label: 'Harassment or bullying' },
  { id: 'hate', label: 'Hate speech or discrimination' },
  { id: 'violence', label: 'Violence or threats' },
  { id: 'impersonation', label: 'Impersonation or fake account' },
  { id: 'inappropriate', label: 'Inappropriate or offensive content' },
  { id: 'misinformation', label: 'Misinformation or false claims' },
  { id: 'other', label: 'Other' },
]

interface ProfileHeaderProps {
  isOwnProfile?: boolean
  userProfile?: User | null
  onBlock?: () => void
}

export default function ProfileHeader({
  isOwnProfile = true,
  userProfile,
  onBlock,
}: ProfileHeaderProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showReportInput, setShowReportInput] = useState(false)
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [reportReason, setReportReason] = useState('')
  const [reporting, setReporting] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const translateY = useSharedValue(300)
  const opacity = useSharedValue(0)

  const toggleReason = (reasonId: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reasonId)
        ? prev.filter((id) => id !== reasonId)
        : [...prev, reasonId]
    )
  }

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
    .onStart(() => {})
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

  const handleReportUser = () => {
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

    if (!userProfile?.id) {
      Alert.alert('Error', 'Unable to identify the user to report')
      return
    }

    // Build the report reason from selected options and custom text
    const selectedLabels = selectedReasons
      .filter((id) => id !== 'other')
      .map((id) => REPORT_REASONS.find((r) => r.id === id)?.label)
      .filter(Boolean)

    let fullReason = selectedLabels.join(', ')
    if (selectedReasons.includes('other') && reportReason.trim()) {
      fullReason = fullReason
        ? `${fullReason}. Additional details: ${reportReason.trim()}`
        : reportReason.trim()
    }

    setReporting(true)
    try {
      const response = await moderationRequests.reportUser(
        userProfile.id,
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

  const handleBlockUser = () => {
    closeMenu()
    if (!userProfile) return

    Alert.alert(
      'Block User',
      `Are you sure you want to block @${userProfile.tag_name}? They won't be able to see your posts or interact with you.`,
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
                userProfile.id
              )
              if (response.success) {
                Alert.alert(
                  'Blocked',
                  `@${userProfile.tag_name} has been blocked.`
                )
                onBlock?.()
              } else {
                Alert.alert('Error', response.message || 'Failed to block user')
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

  return (
    <View className='flex-row items-center justify-between px-6 py-4'>
      <View className='flex-row items-center gap-2'>
        <TouchableOpacity
          onPress={() => router.back()}
          className='rounded-full p-2'
        >
          <Ionicons name='chevron-back' size={24} color='white' />
        </TouchableOpacity>
        <Text className='text-white text-2xl font-bold'>Profile</Text>
      </View>
      {isOwnProfile ? (
        <View className='flex-row items-center gap-3'>
          <TouchableOpacity
            onPress={() => router.push('/settings' as any)}
            className='w-10 h-10 bg-secondary-light rounded-full justify-center items-center'
          >
            <Ionicons name='settings-outline' size={20} color='white' />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(modals)/qr-code')}
            className='w-10 h-10 bg-secondary-light rounded-full justify-center items-center'
          >
            <Ionicons name='qr-code' size={20} color='white' />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={handleMenu}
          className='w-10 h-10 bg-secondary-light rounded-full justify-center items-center'
        >
          <Ionicons name='ellipsis-horizontal' size={20} color='white' />
        </TouchableOpacity>
      )}

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
                  <TouchableOpacity
                    onPress={handleReportUser}
                    className='flex-row items-center py-4 border-b border-zinc-800'
                  >
                    <View className='w-10 h-10 bg-yellow-500/20 rounded-full items-center justify-center mr-4'>
                      <Ionicons name='flag' size={18} color='#eab308' />
                    </View>
                    <Text className='text-gray-100 text-lg font-medium'>
                      Report Account
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
              Report Account
            </Text>
            <Text className='text-gray-400 text-sm mb-4'>
              Why are you reporting this account? Select all that apply.
            </Text>

            <ScrollView
              className='mb-4'
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 300 }}
            >
              {REPORT_REASONS.map((reason) => (
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
