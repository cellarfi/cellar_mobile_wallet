import { useAuthContext } from '@/contexts/AuthProvider'
import { userRequests } from '@/libs/api_requests/user.request'
import {
  BiometricCapabilities,
  checkBiometricCapabilities,
  disableBiometric,
  enableBiometric,
  getBiometricTypeName,
} from '@/libs/biometric.lib'
import { useSettingsStore } from '@/store/settingsStore'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface SecurityItemProps {
  icon: string
  title: string
  description: string
  hasSwitch?: boolean
  switchValue?: boolean
  onSwitchChange?: (value: boolean) => void
  onPress?: () => void
  isDanger?: boolean
  rightContent?: React.ReactNode
}

const SecurityItem = ({
  icon,
  title,
  description,
  hasSwitch = false,
  switchValue = false,
  onSwitchChange = () => {},
  onPress,
  isDanger = false,
  rightContent,
}: SecurityItemProps) => (
  <TouchableOpacity
    className='flex-row items-center justify-between py-3 border-b border-dark-200'
    onPress={onPress}
    disabled={!onPress}
  >
    <View className='flex-row items-center flex-1'>
      <View
        className={`w-10 h-10 bg-primary-500/10 rounded-full items-center justify-center mr-3 ${isDanger ? 'bg-red-500/10' : ''}`}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={isDanger ? '#ef4444' : '#3b82f6'}
        />
      </View>
      <View className='flex-1'>
        <Text
          className={`text-white font-medium ${isDanger ? 'text-red-400' : ''}`}
        >
          {title}
        </Text>
        <Text className='text-gray-400 text-xs mt-0.5'>{description}</Text>
      </View>
    </View>
    {rightContent ? (
      rightContent
    ) : hasSwitch ? (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        trackColor={{ false: '#334155', true: '#3b82f6' }}
        thumbColor='#fff'
      />
    ) : (
      <Ionicons name='chevron-forward' size={20} color='#64748b' />
    )}
  </TouchableOpacity>
)

export default function SecuritySettingsModal() {
  const { logout } = useAuthContext()
  const { settings, updateSettings } = useSettingsStore()
  const [capabilities, setCapabilities] =
    useState<BiometricCapabilities | null>(null)
  const [biometricEnabled, setBiometricEnabled] = useState(
    settings.enableBiometricAuth
  )
  const [autoLockTimeout, setAutoLockTimeout] = useState(
    settings.autoLockTimeout
  )
  const [showCustomTimeInput, setShowCustomTimeInput] = useState(false)
  const [customMinutes, setCustomMinutes] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const autoLockOptions = [
    { label: 'Immediate', value: 0, description: 'Lock when app is minimized' },
    { label: '1 minute', value: 60000, description: 'Lock after 1 minute' },
    { label: '3 minutes', value: 180000, description: 'Lock after 3 minutes' },
    { label: '5 minutes', value: 300000, description: 'Lock after 5 minutes' },
    { label: 'Custom', value: -1, description: 'Set custom time' },
  ]

  // Helper function to get label from timeout
  function getAutoLockLabel(timeout: number): string {
    const option = autoLockOptions.find((opt) => opt.value === timeout)
    if (option) return option.label

    // Check if it's a custom time
    const minutes = Math.floor(timeout / 60000)
    if (minutes > 0 && minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`
    }

    return 'Immediate'
  }

  useEffect(() => {
    loadBiometricCapabilities()
  }, [])

  useEffect(() => {
    setBiometricEnabled(settings.enableBiometricAuth)
    setAutoLockTimeout(settings.autoLockTimeout)
  }, [settings.enableBiometricAuth, settings.autoLockTimeout])

  const loadBiometricCapabilities = async () => {
    const caps = await checkBiometricCapabilities()
    setCapabilities(caps)
  }

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      // Enabling biometric
      if (!capabilities?.isAvailable) {
        Alert.alert(
          'Not Available',
          capabilities?.hasHardware
            ? 'Please set up biometric authentication in your device settings first.'
            : 'Biometric authentication is not available on this device.'
        )
        return
      }

      if (!settings.biometricSetupCompleted) {
        // Navigate to setup flow
        router.push('/(modals)/setup-biometric')
        return
      }

      try {
        await enableBiometric()
        updateSettings({ enableBiometricAuth: true })
        setBiometricEnabled(true)
      } catch (error) {
        console.error('Error enabling biometric:', error)
        Alert.alert('Error', 'Failed to enable biometric authentication.')
      }
    } else {
      // Disabling biometric
      Alert.alert(
        'Disable Biometric?',
        'Are you sure you want to disable biometric authentication?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              try {
                await disableBiometric()
                updateSettings({ enableBiometricAuth: false })
                setBiometricEnabled(false)
              } catch (error) {
                console.error('Error disabling biometric:', error)
                Alert.alert(
                  'Error',
                  'Failed to disable biometric authentication.'
                )
              }
            },
          },
        ]
      )
    }
  }

  const handleAutoLockSelect = (value: number) => {
    if (value === -1) {
      // Custom option selected
      setShowCustomTimeInput(true)
    } else {
      setAutoLockTimeout(value)
      setShowCustomTimeInput(false)
      updateSettings({
        autoLockTimeout: value,
        autoLockEnabled: true, // Always enable when selecting a time
      })
    }
  }

  const handleCustomTimeSubmit = () => {
    const minutes = parseInt(customMinutes, 10)
    if (isNaN(minutes) || minutes <= 0) {
      Alert.alert('Invalid Time', 'Please enter a valid number of minutes.')
      return
    }

    const timeout = minutes * 60000 // Convert to milliseconds
    setAutoLockTimeout(timeout)
    setShowCustomTimeInput(false)
    setCustomMinutes('')
    updateSettings({
      autoLockTimeout: timeout,
      autoLockEnabled: true,
    })
  }

  const handleDeleteAccountPress = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is irreversible and will permanently delete all your data, including your wallet, transactions, and personal information.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {},
        },
        {
          text: isDeleting ? 'Deleting...' : 'Delete',
          style: 'destructive',
          onPress: deleteAccount,
        },
      ]
    )
  }

  const deleteAccount = async () => {
    setIsDeleting(true)
    try {
      const response = await userRequests.deleteAccount()
      if (response.success) {
        // Show success message
        Alert.alert('Success!', 'Your account has been deleted successfully.', [
          {
            text: 'Continue',
            onPress: () => {
              logout()
                .then(() => {
                  router.replace('/login')
                })
                .catch(() => {
                  router.replace('/login') // Still redirect user to auth page even if Privy logout fails for some reason
                })
            },
          },
        ])
      } else {
        Alert.alert(
          'Error',
          response.message || 'Failed to delete account. Please try again.'
        )
      }
    } catch (error: any) {
      console.error('Error deleting account:', error)
      Alert.alert(
        'Error',
        error?.message || 'An unexpected error occurred. Please try again.'
      )
    } finally {
      setIsDeleting(false)
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
          <Ionicons name='arrow-back' size={24} color='#fff' />
        </TouchableOpacity>
        <Text className='text-white text-lg font-semibold'>
          Security Settings
        </Text>
        <View className='w-10' />
      </View>

      <ScrollView className='flex-1 p-4'>
        {/* Authentication Section */}
        <View className='bg-secondary-light rounded-xl p-4 mb-4 border border-dark-200'>
          <Text className='text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3'>
            Authentication
          </Text>

          <SecurityItem
            icon='finger-print'
            title={
              capabilities
                ? `${getBiometricTypeName(capabilities.biometricType)} Authentication`
                : 'Biometric Authentication'
            }
            description={
              capabilities?.isAvailable
                ? `Use ${getBiometricTypeName(capabilities.biometricType)} to unlock your wallet`
                : capabilities?.hasHardware
                  ? 'Setup biometric authentication in device settings first'
                  : 'Not available on this device'
            }
            hasSwitch
            switchValue={biometricEnabled}
            onSwitchChange={handleBiometricToggle}
          />
        </View>

        {/* Auto-Lock Section */}
        <View className='bg-secondary-light rounded-xl p-4 mb-4 border border-dark-200'>
          <View className='flex-row items-center justify-between mb-4'>
            <View className='flex-1'>
              <Text className='text-gray-400 text-xs font-semibold uppercase tracking-wider'>
                Auto-Lock Timeout
              </Text>
              <Text className='text-gray-500 text-xs mt-1'>
                Current: {getAutoLockLabel(autoLockTimeout)}
              </Text>
            </View>
            {settings.autoLockEnabled && (
              <View className='w-3 h-3 bg-secondary rounded-full' />
            )}
          </View>

          {/* Auto-Lock Options */}
          <View className='gap-2'>
            {autoLockOptions.map((option) => (
              <TouchableOpacity
                key={option.label}
                className={`flex-row items-center p-3 rounded-lg border ${
                  autoLockTimeout === option.value ||
                  (option.value === -1 &&
                    !autoLockOptions
                      .slice(0, -1)
                      .some((opt) => opt.value === autoLockTimeout))
                    ? 'bg-secondary/10 border-secondary'
                    : 'bg-primary-main border-dark-300'
                }`}
                onPress={() => handleAutoLockSelect(option.value)}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                    autoLockTimeout === option.value ||
                    (option.value === -1 &&
                      !autoLockOptions
                        .slice(0, -1)
                        .some((opt) => opt.value === autoLockTimeout))
                      ? 'border-secondary'
                      : 'border-gray-500'
                  }`}
                >
                  {(autoLockTimeout === option.value ||
                    (option.value === -1 &&
                      !autoLockOptions
                        .slice(0, -1)
                        .some((opt) => opt.value === autoLockTimeout))) && (
                    <View className='w-3 h-3 bg-secondary rounded-full' />
                  )}
                </View>
                <View className='flex-1'>
                  <Text className='text-white font-medium'>{option.label}</Text>
                  <Text className='text-gray-400 text-xs mt-0.5'>
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Time Input Modal */}
          {showCustomTimeInput && (
            <View className='mt-4 p-4 bg-dark-200 rounded-lg border border-dark-300'>
              <Text className='text-white font-medium mb-2'>
                Custom Lock Time
              </Text>
              <Text className='text-gray-400 text-sm mb-3'>
                Enter time in minutes
              </Text>
              <View className='flex-row items-center gap-2'>
                <View className='flex-1'>
                  <TextInput
                    className='bg-dark-300 text-white px-4 py-3 rounded-lg border border-dark-400'
                    placeholder='Enter minutes'
                    placeholderTextColor='#6b7280'
                    value={customMinutes}
                    onChangeText={setCustomMinutes}
                    keyboardType='number-pad'
                    maxLength={3}
                  />
                </View>
                <TouchableOpacity
                  className='bg-secondary px-4 py-3 rounded-lg'
                  onPress={handleCustomTimeSubmit}
                >
                  <Text className='text-white font-semibold'>Set</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className='bg-dark-300 px-4 py-3 rounded-lg'
                  onPress={() => {
                    setShowCustomTimeInput(false)
                    setCustomMinutes('')
                  }}
                >
                  <Text className='text-gray-400 font-semibold'>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Account Section */}
        <View className='hidden bg-dark-100 rounded-xl p-4 mb-4 border border-dark-200'>
          <Text className='text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3'>
            Account
          </Text>

          {/* <SecurityItem
            icon='key-outline'
            title='Change Password'
            description='Update your account password'
            onPress={() => {}}
          /> */}
          <SecurityItem
            icon='mail-outline'
            title='Change Email'
            description='Update your email address'
            onPress={() => {}}
          />
        </View>

        {/* Danger Zone */}
        <View className='border border-red-900/50 rounded-xl p-4 mb-4 bg-red-900/10'>
          <Text className='text-red-400 text-xs font-semibold uppercase tracking-wider mb-3'>
            Danger Zone
          </Text>

          {/* <SecurityItem
            icon='log-out-outline'
            title='Log Out'
            description='Sign out of your account'
            isDanger
            onPress={() => {}}
          /> */}
          <View className='opacity-100'>
            <SecurityItem
              icon='trash-outline'
              title='Delete Account'
              description='Permanently delete your account and all data'
              isDanger
              onPress={isDeleting ? undefined : handleDeleteAccountPress}
              rightContent={
                isDeleting && (
                  <View className='ml-2'>
                    <Ionicons
                      name='reload'
                      size={20}
                      color='#ef4444'
                      className='animate-spin'
                    />
                  </View>
                )
              }
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
