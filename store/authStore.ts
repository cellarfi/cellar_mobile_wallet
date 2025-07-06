import { PrivyWalletAccount, User } from '@/types'
import { PrivyUser } from '@privy-io/expo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// export interface User {
//   [key: string]: any
// }

interface AuthState {
  // Auth state
  user: PrivyUser | null
  profile: User | null
  activeWallet: PrivyWalletAccount | null
  isAuthenticated: boolean
  isReady: boolean
  lastSync: number | null

  // Getters
  wallets: PrivyWalletAccount[]

  // Actions
  setUser: (user: PrivyUser | null) => void
  setProfile: (profile: User | null) => void
  setAuthenticated: (isAuthenticated: boolean) => void
  setReady: (isReady: boolean) => void
  setActiveWallet: (wallet: PrivyWalletAccount | null) => void
  updateFromPrivy: (privyUser: any, privyIsReady: boolean) => void
  logout: () => void
  clearStore: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      profile: null,
      activeWallet: null,
      isAuthenticated: false,
      isReady: false,
      lastSync: null,

      // Getter for wallets from user.linked_accounts
      get wallets() {
        const state = get()
        if (!state.user?.linked_accounts) return []

        return state.user.linked_accounts.filter(
          (account: any): account is PrivyWalletAccount =>
            account.type === 'wallet'
        )
      },

      // Actions
      setUser: (user) => {
        const wallets =
          user?.linked_accounts?.filter(
            (account: any): account is PrivyWalletAccount =>
              account.type === 'wallet'
          ) || []

        set({
          user,
          isAuthenticated: !!user,
          activeWallet: wallets.length > 0 ? wallets[0] : null,
          lastSync: Date.now(),
        })
      },

      setProfile: (profile) => {
        set({ profile })
      },

      setAuthenticated: (isAuthenticated) => {
        set({ isAuthenticated })
      },

      setReady: (isReady) => {
        set({ isReady })
      },

      setActiveWallet: (wallet) => {
        set({ activeWallet: wallet })
      },

      updateFromPrivy: (privyUser, privyIsReady) => {
        const currentState = get()

        set({
          isReady: privyIsReady,
          lastSync: Date.now(),
        })

        // Only update user data if Privy is ready
        if (privyIsReady) {
          if (privyUser) {
            // User is authenticated in Privy, update our store
            const wallets =
              privyUser?.linked_accounts?.filter(
                (account: any): account is PrivyWalletAccount =>
                  account.type === 'wallet'
              ) || []

            set({
              user: privyUser,
              isAuthenticated: true,
              activeWallet: wallets.length > 0 ? wallets[0] : null,
            })
          } else if (currentState.isAuthenticated) {
            // Privy says no user but we think we're authenticated
            // This might mean the user was logged out elsewhere
            console.log(
              'Privy user is null but local state shows authenticated - keeping local state for offline mode'
            )
            // Keep local state for offline mode, don't clear it
          }
        }
      },

      logout: () => {
        set({
          user: null,
          profile: null,
          activeWallet: null,
          isAuthenticated: false,
          lastSync: Date.now(),
        })
      },

      clearStore: () => {
        set({
          user: null,
          profile: null,
          activeWallet: null,
          isAuthenticated: false,
          isReady: false,
          lastSync: null,
        })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist essential auth data
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        activeWallet: state.activeWallet,
        isAuthenticated: state.isAuthenticated,
        lastSync: state.lastSync,
      }),
    }
  )
)
