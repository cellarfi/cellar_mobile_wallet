import { BirdEyeTokenOverviewResponse } from '@/types'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface TokenState {
  // Token data stored by address
  tokens: Record<string, BirdEyeTokenOverviewResponse>
  loadingTokens: Record<string, boolean>
  tokenErrors: Record<string, string>

  // Actions
  setToken: (address: string, token: BirdEyeTokenOverviewResponse) => void
  setTokenLoading: (address: string, loading: boolean) => void
  setTokenError: (address: string, error: string | null) => void
  clearToken: (address: string) => void
  getToken: (address: string) => BirdEyeTokenOverviewResponse | null
  isTokenLoading: (address: string) => boolean
  getTokenError: (address: string) => string | null
}

export const useTokenStore = create<TokenState>()(
  persist(
    (set, get) => ({
      // Initial state
      tokens: {},
      loadingTokens: {},
      tokenErrors: {},

      // Actions
      setToken: (address, token) => {
        set((state) => ({
          tokens: {
            ...state.tokens,
            [address]: token,
          },
          tokenErrors: {
            ...state.tokenErrors,
            [address]: '',
          },
        }))
      },

      setTokenLoading: (address, loading) => {
        set((state) => ({
          loadingTokens: {
            ...state.loadingTokens,
            [address]: loading,
          },
        }))
      },

      setTokenError: (address, error) => {
        set((state) => ({
          tokenErrors: {
            ...state.tokenErrors,
            [address]: error || '',
          },
          loadingTokens: {
            ...state.loadingTokens,
            [address]: false,
          },
        }))
      },

      clearToken: (address) => {
        set((state) => {
          const newTokens = { ...state.tokens }
          const newLoadingTokens = { ...state.loadingTokens }
          const newTokenErrors = { ...state.tokenErrors }

          delete newTokens[address]
          delete newLoadingTokens[address]
          delete newTokenErrors[address]

          return {
            tokens: newTokens,
            loadingTokens: newLoadingTokens,
            tokenErrors: newTokenErrors,
          }
        })
      },

      getToken: (address) => {
        return get().tokens[address] || null
      },

      isTokenLoading: (address) => {
        return get().loadingTokens[address] || false
      },

      getTokenError: (address) => {
        return get().tokenErrors[address] || null
      },
    }),
    {
      name: 'token-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist token data for offline support
      partialize: (state) => ({
        tokens: state.tokens,
      }),
    }
  )
)
