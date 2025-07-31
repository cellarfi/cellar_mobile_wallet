import { Images } from '@/constants/Images'
import { useAuthStore } from '@/store/authStore'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { Share, Text, TouchableOpacity, View } from 'react-native'
import QRCodeStyled from 'react-native-qrcode-styled'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function QRCodeModal() {
  const { activeWallet } = useAuthStore()
  const { address } = useLocalSearchParams<{ address?: string }>()

  const walletAddress = address || activeWallet?.address || ''

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Here's my wallet address: ${walletAddress}`,
        title: 'My Wallet Address',
      })
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

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
        <Text className='text-white text-lg font-semibold'>My QR Code</Text>
        <View className='w-10' />
      </View>

      {/* QR Code Content */}
      <View className='flex-1 items-center justify-center p-6'>
        <View className='bg-white p-4 rounded-2xl shadow-lg mb-6'>
          <QRCodeStyled
            data={walletAddress}
            style={{ backgroundColor: 'white' }}
            pieceSize={8}
            pieceBorderRadius={2}
            isPiecesGlued={false}
            color='#0a0a0b'
            innerEyesOptions={{
              borderRadius: 8,
              color: '#6366f1',
            }}
            outerEyesOptions={{
              borderRadius: 8,
              color: '#0a0a0b',
            }}
            logo={{
              href: Images.appLogo,
              padding: 4,
              hidePieces: false,
            }}
          />
        </View>

        <Text
          className='text-gray-400 text-sm font-mono mb-6 max-w-[80%] text-center'
          numberOfLines={1}
          ellipsizeMode='middle'
        >
          {walletAddress}
        </Text>

        <TouchableOpacity
          className='flex-row items-center justify-center bg-secondary-light px-5 py-3 rounded-xl w-full max-w-[200px]'
          onPress={handleShare}
        >
          <Ionicons name='share-outline' size={20} color='#fff' />
          <Text className='text-white font-semibold ml-2'>Share Address</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
