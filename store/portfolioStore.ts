import { BirdEyeWalletPortfolio } from '@/types'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface PortfolioState {
  // Portfolio data
  portfolio: BirdEyeWalletPortfolio | null
  isLoading: boolean
  lastFetch: number | null
  error: string | null

  // Actions
  setPortfolio: (portfolio: BirdEyeWalletPortfolio) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearPortfolio: () => void
  updateLastFetch: () => void
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      // Initial state
      portfolio: null,
      isLoading: false,
      lastFetch: null,
      error: null,

      // Actions
      setPortfolio: (portfolio) => {
        set({
          portfolio,
          error: null,
          lastFetch: Date.now(),
        })
      },

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      setError: (error) => {
        set({ error, isLoading: false })
      },

      clearPortfolio: () => {
        set({
          portfolio: null,
          error: null,
          lastFetch: null,
        })
      },

      updateLastFetch: () => {
        set({ lastFetch: Date.now() })
      },
    }),
    {
      name: 'portfolio-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist portfolio data and last fetch time for offline support
      partialize: (state) => ({
        portfolio: state.portfolio,
        lastFetch: state.lastFetch,
      }),
    }
  )
)
