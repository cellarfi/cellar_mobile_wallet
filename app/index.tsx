import OnboardingBase from '@/components/OnboardingBase'
import { Images } from '@/constants/Images'
import { useAuthContext } from '@/contexts/AuthProvider'
import { Image, View } from 'react-native'

const Index = () => {
  const { isInitialized, isLoading } = useAuthContext()

  // Show loading screen while AuthProvider determines auth state and navigates
  // if (!isInitialized || isLoading) {
  return (
    <OnboardingBase isSplash>
      <View className='flex-1 justify-center items-center'>
        <Image source={Images.whiteLogo} className='w-[85.99px] h-[100px]' />
      </View>
    </OnboardingBase>
  )
  // }

  // This component should rarely reach this point since AuthProvider
  // // handles navigation, but we return empty view as fallback
  // return <View></View>
}

export default Index
