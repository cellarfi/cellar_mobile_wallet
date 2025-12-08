import {
    checkBiometricCapabilities,
    lockApp,
    shouldShowBiometricPrompt,
} from '@/libs/biometric.lib'
import { useSettingsStore } from '@/store/settingsStore'
import { router } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'

export const useBiometricLock = (
  isAuthenticated: boolean,
  isInitialized: boolean,
  isNavigating: boolean,
  refreshTokenIfNeeded: () => Promise<void>
) => {
  const { settings } = useSettingsStore()
  const [appIsLocked, setAppIsLocked] = useState(false)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)

  const checkAppLockStatus = useCallback(async () => {
    if (isAuthenticated && settings.enableBiometricAuth) {
      // On app mount, if biometric is enabled, lock the app
      await lockApp()
      setAppIsLocked(true)
    }
  }, [isAuthenticated, settings.enableBiometricAuth])

  const checkAndPromptBiometricSetup = useCallback(async () => {
    // Check if biometric hardware is available
    const capabilities = await checkBiometricCapabilities()
    if (!capabilities.isAvailable) {
      return
    }

    // Check if we should show the prompt
    const shouldPrompt = shouldShowBiometricPrompt(
      settings.lastBiometricPromptDate,
      settings.biometricPromptSkipCount,
      settings.biometricSetupCompleted
    )

    if (shouldPrompt) {
      // Wait a bit before showing the modal to avoid jarring UX
      setTimeout(() => {
        router.push('/(modals)/setup-biometric')
      }, 1000)
    }
  }, [
    settings.lastBiometricPromptDate,
    settings.biometricPromptSkipCount,
    settings.biometricSetupCompleted,
  ])

  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      const previousAppState = appStateRef.current
      appStateRef.current = nextAppState

      // Lock the app when going to background
      if (
        isAuthenticated &&
        settings.enableBiometricAuth &&
        settings.autoLockEnabled &&
        previousAppState === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // If immediate lock, lock right away
        if (settings.autoLockTimeout === 0) {
          await lockApp()
          setAppIsLocked(true)
        } else {
          // Otherwise, set a timeout to lock after specified duration
          setTimeout(async () => {
            await lockApp()
            setAppIsLocked(true)
          }, settings.autoLockTimeout)
        }
      }

      // When app becomes active
      if (
        previousAppState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Check if we should prompt for biometric setup
        if (isAuthenticated && !settings.enableBiometricAuth) {
          checkAndPromptBiometricSetup()
        }

        // Refresh token if it's stale (older than 1 hour)
        refreshTokenIfNeeded()
      }
    },
    [
      isAuthenticated,
      settings.enableBiometricAuth,
      settings.autoLockEnabled,
      settings.autoLockTimeout,
      checkAndPromptBiometricSetup,
      refreshTokenIfNeeded,
    ]
  )

  // Check if app is locked on mount
  useEffect(() => {
    checkAppLockStatus()
  }, [checkAppLockStatus])

  // Handle app state changes for biometric lock
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    )
    return () => subscription.remove()
  }, [handleAppStateChange])

  // Suggest biometric setup after user is fully authenticated AND navigation is complete
  useEffect(() => {
    if (
      isAuthenticated &&
      !settings.enableBiometricAuth &&
      isInitialized &&
      !isNavigating
    ) {
      // Wait for navigation to fully complete before showing biometric prompt
      const t = setTimeout(() => {
        checkAndPromptBiometricSetup()
      }, 1500) // Longer delay to ensure tabs screen is fully loaded
      return () => clearTimeout(t)
    }
  }, [
    isAuthenticated,
    settings.enableBiometricAuth,
    checkAndPromptBiometricSetup,
    isInitialized,
    isNavigating,
  ])

  const unlockApp = () => {
    setAppIsLocked(false)
  }

  return {
    appIsLocked,
    unlockApp,
  }
}
