import { BirdEyeTrendingTokens } from '@/types'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface TrendingState {
  // Trending data
  trending: BirdEyeTrendingTokens | null
  isLoading: boolean
  lastFetch: number | null
  error: string | null

  // Pagination
  hasNextPage: boolean
  isFetchingNextPage: boolean

  // Actions
  setTrending: (trending: BirdEyeTrendingTokens) => void
  appendTrending: (trending: BirdEyeTrendingTokens) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearTrending: () => void
  updateLastFetch: () => void
  setFetchingNextPage: (fetching: boolean) => void
  setHasNextPage: (hasNext: boolean) => void
}

export const useTrendingStore = create<TrendingState>()(
  persist(
    (set, get) => ({
      // Initial state
      trending: null,
      isLoading: false,
      lastFetch: null,
      error: null,
      hasNextPage: true,
      isFetchingNextPage: false,

      // Actions
      setTrending: (trending) => {
        set({
          trending,
          error: null,
          lastFetch: Date.now(),
          hasNextPage: trending.tokens.length >= 20, // Assume has more if we got full page
        })
      },

      appendTrending: (newTrending) => {
        const currentTrending = get().trending
        if (currentTrending) {
          const combinedTokens = [
            ...currentTrending.tokens,
            ...newTrending.tokens,
          ]
          set({
            trending: {
              ...newTrending,
              tokens: combinedTokens,
            },
            hasNextPage: newTrending.tokens.length >= 20,
            isFetchingNextPage: false,
          })
        } else {
          set({
            trending: newTrending,
            hasNextPage: newTrending.tokens.length >= 20,
            isFetchingNextPage: false,
          })
        }
      },

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      setError: (error) => {
        set({ error, isLoading: false, isFetchingNextPage: false })
      },

      clearTrending: () => {
        set({
          trending: null,
          error: null,
          lastFetch: null,
          hasNextPage: true,
          isFetchingNextPage: false,
        })
      },

      updateLastFetch: () => {
        set({ lastFetch: Date.now() })
      },

      setFetchingNextPage: (isFetchingNextPage) => {
        set({ isFetchingNextPage })
      },

      setHasNextPage: (hasNextPage) => {
        set({ hasNextPage })
      },
    }),
    {
      name: 'trending-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist trending data and last fetch time for offline support
      partialize: (state) => ({
        trending: state.trending,
        lastFetch: state.lastFetch,
      }),
    }
  )
)
