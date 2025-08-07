import { Images } from '@/constants/Images'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { router } from 'expo-router'
import {
  Image,
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const modules = [
  {
    key: 'pumpfun',
    title: 'Pumpfun',
    subtitle: 'The OG Solana Launchpad',
    navigateTo: '/(modals)/launch-pumpfun',
    iconImage: Images.launchPumpFunLogo,
    backgroundImage: Images.launchPumpFun,
    usePngIcon: true,
  },
]

const LaunchPadScreen = () => {
  return (
    <SafeAreaView className='flex-1 bg-primary-main' edges={['top']}>
      <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
        <View className='flex-row items-center justify-between px-6 py-4'>
          <TouchableOpacity
            onPress={() => router.back()}
            className='w-10 h-10 rounded-full justify-center items-center'
          >
            <Ionicons name='chevron-back' size={20} color='white' />
          </TouchableOpacity>
        </View>

        <View className='px-6 mt-6 mb-6'>
          <Text className='text-white text-lg'>Launch Via</Text>
        </View>

        <View className='flex-col gap-4 px-6'>
          {modules.map((module) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: module.navigateTo as any,
                })
              }
              key={module.key}
              className='flex-col gap-4 rounded-2xl h-[180px] overflow-hidden'
            >
              <ImageBackground
                source={module.backgroundImage}
                className='w-full h-full'
                resizeMode='cover'
              >
                <BlurView
                  intensity={45}
                  tint='dark'
                  className='absolute flex-row items-center justify-between bottom-0 left-0 right-0 h-[60px] px-3 pb-0.5'
                >
                  <View className='flex-row flex-1 gap-2.5'>
                    <View className='flex-row items-center'>
                      <Image
                        source={module.iconImage}
                        className='w-8 h-8'
                        resizeMode='contain'
                      />
                    </View>

                    <View className='flex-col flex-1'>
                      <Text className='text-white text-[16px] font-medium'>
                        {module.title}
                      </Text>
                      <Text className='text-white text-[12px] font-medium'>
                        {module.subtitle}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    className='px-4 py-1.5 bg-white/20 rounded-[20px] border border-white/40 ml-2'
                    disabled
                  >
                    <Text className='text-white text-sm font-medium'>
                      Launch
                    </Text>
                  </TouchableOpacity>
                </BlurView>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default LaunchPadScreen
