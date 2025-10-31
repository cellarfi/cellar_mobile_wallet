import { Keys } from '@/constants/App'
import * as Crypto from 'expo-crypto'
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import { Alert, Platform } from 'react-native'

/**
 * Biometric authentication utility library
 * Handles Face ID (iOS) and Biometric (Android) authentication
 */

export interface BiometricCapabilities {
  isAvailable: boolean
  biometricType: 'FaceID' | 'TouchID' | 'Fingerprint' | 'Iris' | 'Unknown'
  hasHardware: boolean
  isEnrolled: boolean
}

/**
 * Check if biometric authentication is available on the device
 */
export async function checkBiometricCapabilities(): Promise<BiometricCapabilities> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    const isEnrolled = await LocalAuthentication.isEnrolledAsync()
    const supportedTypes =
      await LocalAuthentication.supportedAuthenticationTypesAsync()

    let biometricType: BiometricCapabilities['biometricType'] = 'Unknown'

    if (Platform.OS === 'ios') {
      if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        )
      ) {
        biometricType = 'FaceID'
      } else if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT
        )
      ) {
        biometricType = 'TouchID'
      }
    } else if (Platform.OS === 'android') {
      if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT
        )
      ) {
        biometricType = 'Fingerprint'
      } else if (
        supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)
      ) {
        biometricType = 'Iris'
      } else if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        )
      ) {
        biometricType = 'FaceID'
      }
    }

    return {
      isAvailable: hasHardware && isEnrolled,
      biometricType,
      hasHardware,
      isEnrolled,
    }
  } catch (error) {
    console.error('Error checking biometric capabilities:', error)
    return {
      isAvailable: false,
      biometricType: 'Unknown',
      hasHardware: false,
      isEnrolled: false,
    }
  }
}

/**
 * Get user-friendly name for biometric type
 */
export function getBiometricTypeName(
  type: BiometricCapabilities['biometricType']
): string {
  switch (type) {
    case 'FaceID':
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition'
    case 'TouchID':
      return 'Touch ID'
    case 'Fingerprint':
      return 'Fingerprint'
    case 'Iris':
      return 'Iris Scan'
    default:
      return 'Biometric'
  }
}

/**
 * Authenticate using biometrics
 */
export async function authenticateWithBiometrics(
  promptMessage?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const capabilities = await checkBiometricCapabilities()

    if (!capabilities.isAvailable) {
      return {
        success: false,
        error: capabilities.hasHardware
          ? 'No biometric credentials enrolled. Please set up biometric authentication in your device settings.'
          : 'Biometric authentication is not available on this device.',
      }
    }

    const biometricName = getBiometricTypeName(capabilities.biometricType)
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || `Unlock with ${biometricName}`,
      fallbackLabel: 'Use PIN',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false, // Allow device passcode as fallback
    })

    if (result.success) {
      return { success: true }
    } else {
      return {
        success: false,
        error: result.error || 'Authentication failed',
      }
    }
  } catch (error: any) {
    console.error('Biometric authentication error:', error)
    return {
      success: false,
      error: error?.message || 'An unexpected error occurred',
    }
  }
}

/**
 * Hash a PIN using SHA-256
 */
export async function hashPin(pin: string): Promise<string> {
  try {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      pin
    )
    return hash
  } catch (error) {
    console.error('Error hashing PIN:', error)
    throw error
  }
}

/**
 * Verify a PIN against stored hash
 */
export async function verifyPin(
  pin: string,
  storedHash: string
): Promise<boolean> {
  try {
    const hash = await hashPin(pin)
    return hash === storedHash
  } catch (error) {
    console.error('Error verifying PIN:', error)
    return false
  }
}

/**
 * Check if biometric authentication is enabled in app settings
 */
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const enabled = await SecureStore.getItemAsync(Keys.BIOMETRIC_ENABLED)
    return enabled === 'true'
  } catch (error) {
    console.error('Error checking biometric enabled status:', error)
    return false
  }
}

/**
 * Enable biometric authentication
 */
export async function enableBiometric(): Promise<void> {
  try {
    await SecureStore.setItemAsync(Keys.BIOMETRIC_ENABLED, 'true')
  } catch (error) {
    console.error('Error enabling biometric:', error)
    throw error
  }
}

/**
 * Disable biometric authentication
 */
export async function disableBiometric(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(Keys.BIOMETRIC_ENABLED)
  } catch (error) {
    console.error('Error disabling biometric:', error)
    throw error
  }
}

/**
 * Check if app is locked
 */
export async function isAppLocked(): Promise<boolean> {
  try {
    const locked = await SecureStore.getItemAsync(Keys.APP_LOCKED)
    return locked === 'true'
  } catch (error) {
    console.error('Error checking app lock status:', error)
    return false
  }
}

/**
 * Lock the app
 */
export async function lockApp(): Promise<void> {
  try {
    await SecureStore.setItemAsync(Keys.APP_LOCKED, 'true')
  } catch (error) {
    console.error('Error locking app:', error)
    throw error
  }
}

/**
 * Unlock the app
 */
export async function unlockApp(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(Keys.APP_LOCKED)
  } catch (error) {
    console.error('Error unlocking app:', error)
    throw error
  }
}

/**
 * Show setup biometric prompt to user
 * Returns true if user should be prompted, false otherwise
 */
export function shouldShowBiometricPrompt(
  lastPromptDate: number | null,
  skipCount: number,
  isSetupCompleted: boolean
): boolean {
  // Don't prompt if already set up
  if (isSetupCompleted) {
    return false
  }

  // Always prompt on first login (lastPromptDate is null)
  if (lastPromptDate === null) {
    return true
  }

  // Don't prompt if user has skipped more than 3 times
  if (skipCount >= 3) {
    return false
  }

  // Calculate days since last prompt
  const daysSinceLastPrompt =
    (Date.now() - lastPromptDate) / (1000 * 60 * 60 * 24)

  // Prompt every 7 days for first 2 skips, then every 14 days
  const promptInterval = skipCount < 2 ? 7 : 14

  return daysSinceLastPrompt >= promptInterval
}

/**
 * Show error alert for biometric issues
 */
export function showBiometricError(
  error: string,
  capabilities: BiometricCapabilities
) {
  const biometricName = getBiometricTypeName(capabilities.biometricType)

  if (!capabilities.hasHardware) {
    Alert.alert(
      'Not Available',
      `${biometricName} is not available on this device.`,
      [{ text: 'OK' }]
    )
  } else if (!capabilities.isEnrolled) {
    Alert.alert(
      'Setup Required',
      `Please set up ${biometricName} in your device settings first.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            // Note: Opening settings is platform-specific and may require additional setup
            console.log('Open device settings')
          },
        },
      ]
    )
  } else {
    Alert.alert('Authentication Failed', error, [{ text: 'OK' }])
  }
}
