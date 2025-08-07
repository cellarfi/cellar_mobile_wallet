import { useClipboard } from '@/libs/clipboard'
import { useAuthStore } from '@/store/authStore'
import { Ionicons } from '@expo/vector-icons'
import { formatWalletAddress } from '@privy-io/expo'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import {
  Image,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ShareProfileModal() {
  const { profile, activeWallet } = useAuthStore()
  const { copyToClipboard, copiedField, setCopiedField } = useClipboard()
  const profileLink = `https://cellar.so/profile/${profile?.id || 'anonymous'}`

  const handleCopy = async (text: string, field: string) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setCopiedField(field)
    await copyToClipboard(text)
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my Cellar profile: ${profileLink}`,
        title: 'My Cellar Profile',
      })
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const socialIcons = [
    { name: 'logo-twitter' as const, color: '#1DA1F2' },
    { name: 'logo-facebook' as const, color: '#1877F2' },
    { name: 'logo-instagram' as const, color: '#E1306C' },
    { name: 'logo-linkedin' as const, color: '#0077B5' },
    { name: 'logo-whatsapp' as const, color: '#25D366' },
  ]

  return (
    <SafeAreaView className='flex-1 bg-primary-main'>
      {/* Header */}
      <View className='flex-row items-center justify-between p-4 border-b border-dark-200'>
        <TouchableOpacity
          onPress={() => router.back()}
          className='w-10 h-10 bg-dark-200 rounded-full items-center justify-center'
        >
          <Ionicons name='close' size={24} color='#fff' />
        </TouchableOpacity>
        <Text className='text-white text-lg font-semibold'>Share Profile</Text>
        <View className='w-10' />
      </View>

      {/* Profile Content */}
      <ScrollView className='flex-1 p-6'>
        {/* Profile Card */}
        <View className='w-full bg-secondary-light rounded-2xl p-6 items-center mb-6'>
          <View className='relative'>
            <Image
              source={{
                uri:
                  profile?.profile_picture_url ||
                  'https://via.placeholder.com/80',
              }}
              className='w-20 h-20 rounded-full border-2 border-primary-500'
            />
            <View className='absolute -bottom-1 -right-1 bg-primary-500 rounded-full p-1'>
              <View className='bg-white rounded-full p-1'>
                <Ionicons name='checkmark' size={12} color='#3b82f6' />
              </View>
            </View>
          </View>

          <Text className='text-white text-xl font-bold mt-4 text-center'>
            {profile?.display_name || 'Anonymous User'}
          </Text>

          {profile?.tag_name && (
            <Text className='text-gray-400 text-sm mt-1'>
              @{profile.tag_name}
            </Text>
          )}

          {activeWallet?.address && (
            <TouchableOpacity
              onPress={() => handleCopy(activeWallet?.address, 'address')}
              className='flex-row items-center active:opacity-70'
              activeOpacity={0.7}
            >
              <Text className='text-white/60 text-sm font-mono'>
                {formatWalletAddress(activeWallet?.address)}{' '}
              </Text>

              <Ionicons
                name={
                  copiedField === 'address'
                    ? 'checkmark-outline'
                    : 'copy-outline'
                }
                size={15}
                color={
                  copiedField === 'address'
                    ? '#10b981'
                    : 'rgba(255,255,255,0.6)'
                }
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Link */}
        <View className='w-full mb-6'>
          <Text className='text-gray-400 text-sm mb-2 px-1'>Profile Link</Text>
          <View className='flex-row items-center bg-secondary-light rounded-xl p-3'>
            <Text
              className='text-white text-sm flex-1 font-mono mr-2'
              numberOfLines={1}
            >
              {profileLink}
            </Text>
            <TouchableOpacity
              onPress={() => handleCopy(profileLink, 'link')}
              className='p-2 -mr-2'
            >
              <Ionicons
                name={
                  copiedField === 'link' ? 'checkmark-outline' : 'copy-outline'
                }
                size={18}
                color={
                  copiedField === 'link' ? '#10b981' : 'rgba(255,255,255,0.6)'
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Share Button */}
        <TouchableOpacity
          className='flex-row items-center justify-center bg-secondary py-4 rounded-xl w-full'
          onPress={handleShare}
        >
          <Ionicons name='share-social-outline' size={20} color='#fff' />
          <Text className='text-white font-semibold ml-2'>Share Profile</Text>
        </TouchableOpacity>

        {/* Social Share Options */}
        <View className='mt-8'>
          <Text className='text-gray-400 text-sm mb-4 text-center'>
            Or share directly to
          </Text>
          <View className='flex-row justify-center gap-6'>
            {socialIcons.map((icon) => (
              <TouchableOpacity
                key={icon.name}
                className='w-12 h-12 bg-secondary-light rounded-full items-center justify-center'
              >
                <Ionicons name={icon.name} size={24} color={icon.color} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
