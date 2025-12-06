import { Images } from '@/constants/Images'
import { cn } from '@/libs/utils'
import { LinearGradient } from 'expo-linear-gradient'
import { Image, Text } from 'react-native'

interface OnboardingBaseProps {
  children: React.ReactNode
  isSplash?: boolean
  hideRock?: boolean
}

const OnboardingBase = ({
  children,
  isSplash,
  hideRock,
}: OnboardingBaseProps) => {
  return (
    // <SafeAreaView className='flex-1 bg-dp'>
    <LinearGradient
      colors={
        isSplash
          ? [
              '#15162C',
              '#15172D',
              '#151A2F',
              '#141E34',
              '#132539',
              '#122C41',
              '#113649',
              '#104153',
              '#0E4D5F',
              '#0D5A6B',
              '#0B6979',
              '#097987',
              '#078A97',
              '#059CA8',
              '#02AEB9',
              '#00C2CB',
            ]
          : [
              '#00C2CB',
              '#02AEB9',
              '#059CA8',
              '#078A97',
              '#097987',
              '#0B6979',
              '#0D5A6B',
              '#0E4D5F',
              '#104153',
              '#113649',
              '#122C41',
              '#132539',
              '#141E34',
              '#151A2F',
              '#15172D',
              '#15162C',
            ]
      }
      locations={
        isSplash
          ? [
              0.1858, // 18.58%
              0.2494, // 24.94%
              0.3082, // 30.82%
              0.363, // 36.30%
              0.4146, // 41.46%
              0.4635, // 46.35%
              0.5107, // 51.07%
              0.5568, // 55.68%
              0.6025, // 60.25%
              0.6486, // 64.86%
              0.6957, // 69.57%
              0.7447, // 74.47%
              0.7963, // 79.63%
              0.8511, // 85.11%
              0.9099, // 90.99%
              0.9734, // 97.34%
            ]
          : [
              0, // -13.34% (clamped to 0)
              0, // -4.45% (clamped to 0)
              0.0378, // 3.78%
              0.1144, // 11.44%
              0.1865, // 18.65%
              0.2551, // 25.51%
              0.3211, // 32.11%
              0.3855, // 38.55%
              0.4495, // 44.95%
              0.5139, // 51.39%
              0.5799, // 57.99%
              0.6484, // 64.84%
              0.7205, // 72.05%
              0.7972, // 79.72%
              0.8795, // 87.95%
              0.9684, // 96.84%
            ]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 0.2, y: 1 }}
      // start={{ x: 0.95, y: 0.05 }}
      // end={{ x: 0.05, y: 0.95 }}
      style={{ flex: 1 }}
    >
      <Image
        source={Images.bgStars2}
        className='absolute left-1/2 -translate-x-1/2 top-0 w-auto h-[485.96px]'
        // className='absolute left-1/2 -translate-x-1/2 top-0 w-[1288.64px] h-[485.96px]'
      />

      <Image
        source={Images.bgFlare}
        className='absolute left-1/2 -translate-x-1/2 top-0 w-auto h-[448.31px]'
        // className='absolute left-1/2 -translate-x-1/2 top-0 w-[1324.88px] h-[448.31px]'
      />

      <Image
        source={Images.bgRocks3}
        className={cn(
          'absolute left-1/2 -translate-x-1/2 w-auto h-[177.16px] -z-0',
          isSplash ? '-bottom-2' : '-bottom-10',
          hideRock && 'hidden'
        )}
        // resizeMode='contain'
      />

      {isSplash && (
        <Text className='font-bold text-[12px] text-white absolute bottom-7 left-1/2 -translate-x-1/2'>
          V1.0
        </Text>
      )}

      {children}
    </LinearGradient>
    // </SafeAreaView>
  )
}

export default OnboardingBase
