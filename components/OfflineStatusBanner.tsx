import { useAuthContext } from '@/contexts/AuthProvider'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Text, View } from 'react-native'

export const OfflineStatusBanner = () => {
  const { isOffline, isAuthenticated, getStatusText } = useAuthContext()

  if (!isOffline) return null

  return (
    <LinearGradient
      colors={['#f59e0b', '#d97706']}
      className='mx-4 mb-4 rounded-xl overflow-hidden'
    >
      <View className='flex-row items-center justify-between px-4 py-3'>
        <View className='flex-row items-center flex-1'>
          <Ionicons name='wifi-outline' size={20} color='white' />
          <Text className='text-white font-medium ml-2'>{getStatusText()}</Text>
        </View>
        {isAuthenticated && (
          <View className='bg-white/20 px-3 py-1 rounded-full'>
            <Text className='text-white text-sm font-medium'>Cached Data</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  )
}
