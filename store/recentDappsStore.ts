import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface RecentDapp {
  id: string
  url: string
  title: string
  domain: string
  favicon?: string
  lastVisited: number
}

interface RecentDappsState {
  recentDapps: RecentDapp[]
  addRecentDapp: (dapp: Omit<RecentDapp, 'id' | 'lastVisited'>) => void
  removeRecentDapp: (id: string) => void
  clearRecentDapps: () => void
}

const MAX_RECENT_DAPPS = 20

export const useRecentDappsStore = create<RecentDappsState>()(
  persist(
    (set, get) => ({
      recentDapps: [],

      addRecentDapp: (dapp) => {
        const { recentDapps } = get()

        // Don't add empty or about:blank URLs
        if (!dapp.url || dapp.url === 'about:blank') return

        // Check if already exists (by domain)
        const existingIndex = recentDapps.findIndex(
          (d) => d.domain === dapp.domain
        )

        const newDapp: RecentDapp = {
          id: Date.now().toString(),
          ...dapp,
          lastVisited: Date.now(),
        }

        let updatedDapps: RecentDapp[]

        if (existingIndex !== -1) {
          // Update existing and move to front
          updatedDapps = [
            newDapp,
            ...recentDapps.filter((d) => d.domain !== dapp.domain),
          ]
        } else {
          // Add new to front
          updatedDapps = [newDapp, ...recentDapps]
        }

        // Keep only the most recent
        set({ recentDapps: updatedDapps.slice(0, MAX_RECENT_DAPPS) })
      },

      removeRecentDapp: (id) => {
        set((state) => ({
          recentDapps: state.recentDapps.filter((d) => d.id !== id),
        }))
      },

      clearRecentDapps: () => {
        set({ recentDapps: [] })
      },
    }),
    {
      name: 'recent-dapps-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)





