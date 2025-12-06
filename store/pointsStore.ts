import { LeaderboardResponse, PointsHistoryResponse, UserPoint } from '@/types'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface PointsState {
  // Points data
  userPoints: UserPoint | null
  pointsHistory: PointsHistoryResponse | null
  leaderboard: LeaderboardResponse | null
  isLoading: boolean
  lastFetch: number | null
  error: string | null

  // Actions
  setUserPoints: (points: UserPoint) => void
  setPointsHistory: (history: PointsHistoryResponse, append?: boolean) => void
  setLeaderboard: (leaderboard: LeaderboardResponse) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearPoints: () => void
  updateLastFetch: () => void
}

export const usePointsStore = create<PointsState>()(
  persist(
    (set, get) => ({
      // Initial state
      userPoints: null,
      pointsHistory: null,
      leaderboard: null,
      isLoading: false,
      lastFetch: null,
      error: null,

      // Actions
      setUserPoints: (userPoints) => {
        set({
          userPoints,
          error: null,
          lastFetch: Date.now(),
        })
      },

      setPointsHistory: (pointsHistory, append = false) => {
        const currentHistory = get().pointsHistory

        if (append && currentHistory) {
          // Append new data to existing history
          set({
            pointsHistory: {
              ...pointsHistory,
              data: [...currentHistory.data, ...pointsHistory.data],
            },
            error: null,
          })
        } else {
          // Replace history
          set({
            pointsHistory,
            error: null,
          })
        }
      },

      setLeaderboard: (leaderboard) => {
        set({
          leaderboard,
          error: null,
        })
      },

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      setError: (error) => {
        set({ error, isLoading: false })
      },

      clearPoints: () => {
        set({
          userPoints: null,
          pointsHistory: null,
          leaderboard: null,
          error: null,
          lastFetch: null,
        })
      },

      updateLastFetch: () => {
        set({ lastFetch: Date.now() })
      },
    }),
    {
      name: 'points-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist points data and last fetch time for offline support
      partialize: (state) => ({
        userPoints: state.userPoints,
        lastFetch: state.lastFetch,
      }),
    }
  )
)
