import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface Settings {
  // Portfolio visibility settings
  hidePortfolioBalance: boolean
  enableBiometricAuth: boolean
  enableNotifications: boolean
  // Wallet preferences
  walletProvider: 'cellar' | 'mwa' // 'cellar' for built-in wallet, 'mwa' for external wallets (Phantom, Solflare, etc.)
  // Biometric settings
  biometricSetupCompleted: boolean
  biometricPinHash: string | null // Hashed PIN for additional security
  lastBiometricPromptDate: number | null // Timestamp of last prompt
  biometricPromptSkipCount: number // Number of times user skipped the prompt
  // Auto-lock settings
  autoLockEnabled: boolean
  autoLockTimeout: number // in milliseconds (0 = immediate)
}

interface SettingsState {
  // Settings object
  settings: Settings

  // Actions
  updateSettings: (updates: Partial<Settings>) => void
  resetSettings: () => void
}

const defaultSettings: Settings = {
  hidePortfolioBalance: false,
  enableBiometricAuth: false,
  enableNotifications: false,
  walletProvider: 'cellar', // Default to built-in Cellar wallet
  biometricSetupCompleted: false,
  biometricPinHash: null,
  lastBiometricPromptDate: null,
  biometricPromptSkipCount: 0,
  autoLockEnabled: true, // Enabled by default
  autoLockTimeout: 0, // Immediate by default
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: defaultSettings,

      // Actions
      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }))
      },

      resetSettings: () => {
        set({ settings: defaultSettings })
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist all settings
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
)

// Usage examples:
//
// // Access a single setting
// const { settings } = useSettingsStore()
// const { hidePortfolioBalance, walletProvider } = settings
//
// // Update a single setting
// const { updateSettings } = useSettingsStore()
// updateSettings({ hidePortfolioBalance: true })
//
// // Update multiple settings at once
// updateSettings({
//   hidePortfolioBalance: true,
//   enableBiometricAuth: true,
//   walletProvider: 'mwa' // Switch to external wallet (Phantom, Solflare, etc.)
// })
//
// // Toggle a setting
// updateSettings({ hidePortfolioBalance: !hidePortfolioBalance })
//
// // Switch wallet provider
// updateSettings({ walletProvider: 'mwa' }) // Use external wallets
// updateSettings({ walletProvider: 'cellar' }) // Use built-in Cellar wallet
//
// // Reset all settings to defaults
// const { resetSettings } = useSettingsStore()
// resetSettings()
