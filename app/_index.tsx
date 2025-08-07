import CreativeLoader from '@/components/ui/CreativeLoader'
import { useAuthContext } from '@/contexts/AuthProvider'
import { LinearGradient } from 'expo-linear-gradient'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Index = () => {
  const { isInitialized, isLoading } = useAuthContext()

  // Show loading screen while AuthProvider determines auth state and navigates
  if (!isInitialized || isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-dark-50'>
        <LinearGradient
          colors={['#0a0a0b', '#1a1a1f', '#0a0a0b']}
          style={{ flex: 1 }}
        >
          <View className='flex-1 justify-center items-center'>
            <CreativeLoader />
          </View>
        </LinearGradient>
      </SafeAreaView>
    )
  }

  // This component should rarely reach this point since AuthProvider
  // handles navigation, but we return empty view as fallback
  return <View></View>
}

export default Index
