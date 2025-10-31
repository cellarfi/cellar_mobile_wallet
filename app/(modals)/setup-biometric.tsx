import CustomButton from '@/components/ui/CustomButton'
import PinInput from '@/components/ui/PinInput'
import {
  authenticateWithBiometrics,
  BiometricCapabilities,
  checkBiometricCapabilities,
  enableBiometric,
  getBiometricTypeName,
  hashPin,
} from '@/libs/biometric.lib'
import { useSettingsStore } from '@/store/settingsStore'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type SetupStep = 'intro' | 'pin-setup' | 'pin-confirm' | 'test' | 'complete'

export default function SetupBiometricModal() {
  const { settings, updateSettings } = useSettingsStore()
  const [step, setStep] = useState<SetupStep>('intro')
  const [capabilities, setCapabilities] =
    useState<BiometricCapabilities | null>(null)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingBiometric, setIsTestingBiometric] = useState(false)

  useEffect(() => {
    loadBiometricCapabilities()
  }, [])

  const loadBiometricCapabilities = async () => {
    const caps = await checkBiometricCapabilities()
    setCapabilities(caps)
  }

  const handleSkip = () => {
    // Update skip count and last prompt date
    updateSettings({
      lastBiometricPromptDate: Date.now(),
      biometricPromptSkipCount: settings.biometricPromptSkipCount + 1,
    })
    router.back()
  }

  const handleContinue = () => {
    if (!capabilities?.isAvailable) {
      Alert.alert(
        'Not Available',
        capabilities?.hasHardware
          ? 'Please set up biometric authentication in your device settings first.'
          : 'Biometric authentication is not available on this device.',
        [{ text: 'OK', onPress: handleSkip }]
      )
      return
    }
    setStep('pin-setup')
  }

  const handlePinSetup = () => {
    if (pin.length !== 4) {
      setPinError('Please enter a 4-digit PIN')
      return
    }

    setPinError('')
    setStep('pin-confirm')
  }

  const handlePinConfirm = async () => {
    if (confirmPin.length !== 4) {
      setPinError('Please enter a 4-digit PIN')
      return
    }

    if (pin !== confirmPin) {
      setPinError('PINs do not match')
      setConfirmPin('')
      return
    }

    setPinError('')
    setIsLoading(true)

    try {
      // Hash the PIN
      const hashedPin = await hashPin(pin)

      // Save settings
      updateSettings({
        biometricPinHash: hashedPin,
      })

      setIsLoading(false)
      setStep('test')
    } catch (error) {
      console.error('Error setting up PIN:', error)
      setIsLoading(false)
      setPinError('Failed to setup PIN. Please try again.')
    }
  }

  const handleTestBiometric = async () => {
    setIsTestingBiometric(true)

    const result = await authenticateWithBiometrics(
      `Test your ${capabilities ? getBiometricTypeName(capabilities.biometricType) : 'biometric'}`
    )

    setIsTestingBiometric(false)

    if (result.success) {
      // Enable biometric and mark setup as complete
      try {
        await enableBiometric()
        updateSettings({
          enableBiometricAuth: true,
          biometricSetupCompleted: true,
          lastBiometricPromptDate: Date.now(),
          biometricPromptSkipCount: 0,
        })
        setStep('complete')
      } catch (error) {
        console.error('Error enabling biometric:', error)
        Alert.alert('Error', 'Failed to enable biometric authentication.')
      }
    } else {
      Alert.alert(
        'Authentication Failed',
        result.error || 'Please try again.',
        [
          { text: 'Try Again', onPress: handleTestBiometric },
          { text: 'Cancel', style: 'cancel' },
        ]
      )
    }
  }

  const handleComplete = () => {
    router.back()
  }

  const renderIntroStep = () => (
    <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
      <View className='flex-1 px-6 py-8'>
        {/* Icon */}
        <View className='items-center mb-8'>
          <View className='w-24 h-24 bg-secondary/20 rounded-full justify-center items-center mb-6'>
            <Ionicons
              name={
                capabilities?.biometricType === 'FaceID'
                  ? 'scan'
                  : 'finger-print'
              }
              size={48}
              color='#00C2CB'
            />
          </View>
          <Text className='text-2xl font-bold text-white mb-2 text-center'>
            Secure Your Wallet
          </Text>
          <Text className='text-gray-400 text-center px-4'>
            {capabilities?.isAvailable
              ? `Use ${capabilities ? getBiometricTypeName(capabilities.biometricType) : 'biometric authentication'} and a PIN to protect your wallet`
              : 'Biometric authentication is not available on this device'}
          </Text>
        </View>

        {/* Features */}
        <View className='gap-4 mb-8'>
          <View className='flex-row items-start'>
            <View className='w-10 h-10 bg-secondary/10 rounded-full items-center justify-center mr-3'>
              <Ionicons name='shield-checkmark' size={20} color='#00C2CB' />
            </View>
            <View className='flex-1'>
              <Text className='text-white font-semibold mb-1'>
                Enhanced Security
              </Text>
              <Text className='text-gray-400 text-sm'>
                Add an extra layer of protection to your wallet with biometric
                authentication
              </Text>
            </View>
          </View>

          <View className='flex-row items-start'>
            <View className='w-10 h-10 bg-secondary/10 rounded-full items-center justify-center mr-3'>
              <Ionicons name='flash' size={20} color='#00C2CB' />
            </View>
            <View className='flex-1'>
              <Text className='text-white font-semibold mb-1'>
                Quick Access
              </Text>
              <Text className='text-gray-400 text-sm'>
                Unlock your wallet instantly without typing passwords
              </Text>
            </View>
          </View>

          <View className='flex-row items-start'>
            <View className='w-10 h-10 bg-secondary/10 rounded-full items-center justify-center mr-3'>
              <Ionicons name='key' size={20} color='#00C2CB' />
            </View>
            <View className='flex-1'>
              <Text className='text-white font-semibold mb-1'>Backup PIN</Text>
              <Text className='text-gray-400 text-sm'>
                Set up a 4-digit PIN as a backup authentication method
              </Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View className='gap-3 mb-4'>
          <CustomButton
            text={
              capabilities?.isAvailable
                ? 'Enable Biometric'
                : 'Setup Not Available'
            }
            onPress={handleContinue}
            type='primary'
            disabled={!capabilities?.isAvailable}
          />
          <CustomButton
            text='Skip for Now'
            onPress={handleSkip}
            type='secondary'
          />
        </View>

        <Text className='text-text-light text-center text-xs'>
          You can always enable this later in Settings
        </Text>
      </View>
    </ScrollView>
  )

  const renderPinSetupStep = () => (
    <KeyboardAvoidingView
      className='flex-1'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
        <View className='flex-1 px-6 py-8'>
          {/* Icon */}
          <View className='items-center mb-8'>
            <View className='w-24 h-24 bg-secondary/20 rounded-full justify-center items-center mb-6'>
              <Ionicons name='keypad' size={48} color='#00C2CB' />
            </View>
            <Text className='text-2xl font-bold text-white mb-2 text-center'>
              Create a PIN
            </Text>
            <Text className='text-gray-400 text-center px-4'>
              Set up a 4-digit PIN as a backup authentication method
            </Text>
          </View>

          {/* PIN Input */}
          <PinInput value={pin} onChange={setPin} error={pinError} autoFocus />

          <View className='mt-8 gap-3'>
            <CustomButton
              text='Continue'
              onPress={handlePinSetup}
              type='primary'
              disabled={pin.length !== 4}
            />
            <CustomButton
              text='Back'
              onPress={() => setStep('intro')}
              type='secondary'
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )

  const renderPinConfirmStep = () => (
    <KeyboardAvoidingView
      className='flex-1'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
        <View className='flex-1 px-6 py-8'>
          {/* Icon */}
          <View className='items-center mb-8'>
            <View className='w-24 h-24 bg-secondary/20 rounded-full justify-center items-center mb-6'>
              <Ionicons name='checkmark-circle' size={48} color='#00C2CB' />
            </View>
            <Text className='text-2xl font-bold text-white mb-2 text-center'>
              Confirm Your PIN
            </Text>
            <Text className='text-gray-400 text-center px-4'>
              Enter your PIN again to confirm
            </Text>
          </View>

          {/* PIN Input */}
          <PinInput
            value={confirmPin}
            onChange={setConfirmPin}
            error={pinError}
            showSuccess={confirmPin.length === 4 && pin === confirmPin}
            autoFocus
          />

          <View className='mt-8 gap-3'>
            <CustomButton
              text={isLoading ? 'Setting up...' : 'Continue'}
              onPress={handlePinConfirm}
              type='primary'
              disabled={confirmPin.length !== 4 || isLoading}
              loading={isLoading}
            />
            <CustomButton
              text='Back'
              onPress={() => {
                setStep('pin-setup')
                setConfirmPin('')
                setPinError('')
              }}
              type='secondary'
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )

  const renderTestStep = () => (
    <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
      <View className='flex-1 px-6 py-8'>
        {/* Icon */}
        <View className='items-center mb-8'>
          <View className='w-24 h-24 bg-secondary/20 rounded-full justify-center items-center mb-6'>
            <Ionicons
              name={
                capabilities?.biometricType === 'FaceID'
                  ? 'scan'
                  : 'finger-print'
              }
              size={48}
              color='#00C2CB'
            />
          </View>
          <Text className='text-2xl font-bold text-white mb-2 text-center'>
            Test{' '}
            {capabilities
              ? getBiometricTypeName(capabilities.biometricType)
              : 'Biometric'}
          </Text>
          <Text className='text-gray-400 text-center px-4'>
            Let's make sure everything is working properly
          </Text>
        </View>

        {/* Success indicators */}
        <View className='gap-3 mb-8'>
          <View className='flex-row items-center bg-secondary-light rounded-xl p-4'>
            <Ionicons name='checkmark-circle' size={24} color='#00C2CB' />
            <Text className='text-white ml-3 flex-1'>PIN created</Text>
          </View>
          <View className='flex-row items-center bg-secondary-light rounded-xl p-4'>
            <Ionicons name='radio-button-off' size={24} color='#6b7280' />
            <Text className='text-gray-400 ml-3 flex-1'>
              Test biometric authentication
            </Text>
          </View>
        </View>

        <View className='gap-3'>
          <CustomButton
            text={isTestingBiometric ? 'Testing...' : 'Test Biometric'}
            onPress={handleTestBiometric}
            type='primary'
            loading={isTestingBiometric}
            icon={
              capabilities?.biometricType === 'FaceID' ? 'scan' : 'finger-print'
            }
          />
          <CustomButton
            text='Skip Test'
            onPress={handleSkip}
            type='secondary'
          />
        </View>
      </View>
    </ScrollView>
  )

  const renderCompleteStep = () => (
    <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
      <View className='flex-1 px-6 py-8 items-center justify-center'>
        {/* Success Icon */}
        <View className='items-center mb-8'>
          <View className='w-24 h-24 bg-green-500/20 rounded-full justify-center items-center mb-6'>
            <Ionicons name='checkmark-circle' size={64} color='#00C2CB' />
          </View>
          <Text className='text-2xl font-bold text-white mb-2 text-center'>
            All Set!
          </Text>
          <Text className='text-gray-400 text-center px-4'>
            {capabilities
              ? `${getBiometricTypeName(capabilities.biometricType)} has been successfully enabled`
              : 'Biometric authentication has been successfully enabled'}
          </Text>
        </View>

        {/* Features enabled */}
        <View className='w-full gap-3 mb-8'>
          <View className='flex-row items-center bg-secondary-light rounded-xl p-4'>
            <Ionicons name='checkmark-circle' size={24} color='#00C2CB' />
            <Text className='text-white ml-3 flex-1'>
              Biometric authentication enabled
            </Text>
          </View>
          <View className='flex-row items-center bg-secondary-light rounded-xl p-4'>
            <Ionicons name='checkmark-circle' size={24} color='#00C2CB' />
            <Text className='text-white ml-3 flex-1'>
              Backup PIN configured
            </Text>
          </View>
        </View>

        <CustomButton
          text='Get Started'
          onPress={handleComplete}
          type='primary'
          className='w-full'
        />
      </View>
    </ScrollView>
  )

  return (
    <SafeAreaView className='flex-1 bg-primary-main'>
      {/* Header */}
      <View className='flex-row items-center justify-between px-6 py-4'>
        <TouchableOpacity
          onPress={step === 'intro' ? router.back : () => setStep('intro')}
          className='p-2 -ml-2'
        >
          <Ionicons name='close' size={24} color='#ABA7B5' />
        </TouchableOpacity>
        <View className='flex-row space-x-2'>
          {['intro', 'pin-setup', 'pin-confirm', 'test'].map((s, i) => (
            <View
              key={s}
              className='w-2 h-2 rounded-full'
              style={{
                backgroundColor:
                  ['intro', 'pin-setup', 'pin-confirm', 'test'].indexOf(step) >=
                  i
                    ? '#00C2CB'
                    : '#2d2d35',
              }}
            />
          ))}
        </View>
        <View className='w-8' />
      </View>

      {/* Content */}
      {step === 'intro' && renderIntroStep()}
      {step === 'pin-setup' && renderPinSetupStep()}
      {step === 'pin-confirm' && renderPinConfirmStep()}
      {step === 'test' && renderTestStep()}
      {step === 'complete' && renderCompleteStep()}
    </SafeAreaView>
  )
}
