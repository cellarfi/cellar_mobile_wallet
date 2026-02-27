import OnboardingBase from '@/components/OnboardingBase'
import CustomButton from '@/components/ui/CustomButton'
import { Images } from '@/constants/Images'
import { cn } from '@/libs/utils'
// import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Image, Linking, Text, View } from 'react-native'

export default function WelcomeScreen() {
  // const { account, connect, disconnect } = useMobileWallet()

  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState(0)
  const numOfSteps = 3
  const increment = 100 / numOfSteps

  const handleNext = () => {
    if (step >= numOfSteps) {
      router.push('/(auth)/login')
    } else setStep(step + 1)
  }

  const handleWalletConnect = () => {
    // connect()
  }

  useEffect(() => {
    setProgress(step * increment)
  }, [step, increment])

  useEffect(() => {
    return () => {
      setProgress(0)
      setStep(0)
    }
  }, [])

  return (
    <OnboardingBase hideRock={step !== 0}>
      <View className='flex-1 gap-10'>
        {/* Top Section */}
        <View className='flex-col items-center justify-center gap-5 mt-18'>
          {/* Logo */}
          <View className='flex-row items-center justify-center'>
            <Image
              source={Images.whiteLogo}
              className='w-[44.6px] h-[51.86px]'
            />
            <Text className='text-white text-[27.68px] font-bold'>ellar</Text>
          </View>

          {/* Bar */}
          <View
            className={cn(
              'w-full max-w-[278px] h-[8px] bg-white rounded-full',
              step === 0 && 'hidden',
            )}
          >
            <View
              className='h-full max-w-[100%] bg-secondary rounded-full'
              style={{
                width: `${progress}%`,
              }}
            ></View>
          </View>
        </View>

        {/* Steps */}
        <View className='flex-1 flex-col justify-center items-center'>
          {/* Step 1 */}
          {step === 0 && (
            <View className='flex-1 relative w-full'>
              {/* right rock */}
              <Image
                source={Images.rocks2}
                className='absolute right-0 top-28'
              />

              {/* mascot on rock */}
              <Image
                source={Images.mascotOnRocks}
                className='absolute left-0 bottom-10'
              />
            </View>
          )}
          {/* end of step 1 */}

          {/* Step 2 */}
          {step === 1 && (
            <View className='flex-col justify-center items-center'>
              <Image source={Images.tradeWithConfidence} className='' />

              <Text className='font-bold text-white text-[24px]'>
                Trade with <Text className='text-secondary'>confidence</Text>
              </Text>
              <Text className='text-white max-w-[299px] text-center text-[10px] mt-2'>
                Check out live market data, popular tokens, and awesome trading
                tools designed just for the Solana ecosystem!
              </Text>
            </View>
          )}
          {/* end of step 2 */}

          {/* Step 3 */}
          {step === 2 && (
            <View className='flex-col justify-center items-center'>
              <Image source={Images.socialDefi} className='' />

              <Text className='font-bold text-white text-[24px]'>
                Social <Text className='text-secondary'>Defi</Text> Experience
              </Text>
              <Text className='text-white max-w-[299px] text-center text-[10px] mt-2'>
                Hang out with other traders, swap tips, and show some love to
                your favorite content creators with USDC!
              </Text>
            </View>
          )}
          {/* end of step 3 */}

          {/* Step 4 */}
          {step === 3 && (
            <View className='flex-col justify-center items-center'>
              <Image source={Images.secureWallet} className='' />

              <Text className='font-bold text-white text-[24px]'>
                Secure your
                <Text className='text-secondary'> wallet</Text>
              </Text>
              <Text className='text-white max-w-[299px] text-center text-[10px] mt-2'>
                Manage multiple wallets, track . your portfolio and explore NFTS
                with bank-grade security
              </Text>
            </View>
          )}
          {/* end of step 3 */}
        </View>
        {/* End of steps */}

        <View className='flex-col gap-5 mb-12 w-full items-center'>
          {/*           
          <CustomButton
            text='Wallet Connect'
            onPress={handleWalletConnect}
            className='w-full max-w-[358px]'
          />
          */}

          {/* Login Button */}
          <CustomButton
            text={step === 0 ? 'Get Started' : 'Next'}
            onPress={handleNext}
            className='w-full max-w-[358px]'
          />

          {step !== 0 && step !== 3 && (
            <CustomButton
              text='Skip'
              onPress={() => router.push('/(auth)/login')}
              type='secondary'
              className='w-full max-w-[358px]'
            />
          )}

          {/* Terms */}
          {step === 0 && (
            <Text className='text-xs font-medium text-gray-100 text-center px-4 w-[246px]'>
              By continuing, you agree to our{' '}
              <Text
                className='text-secondary underline'
                onPress={() => Linking.openURL('https://www.cellar.so/terms')}
              >
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                className='text-secondary underline'
                onPress={() => Linking.openURL('https://www.cellar.so/privacy')}
              >
                Privacy Policy
              </Text>
            </Text>
          )}
        </View>
      </View>
    </OnboardingBase>
  )
}
