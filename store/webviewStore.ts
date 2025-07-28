import { BrowserTab } from '@/types/app.interface'
import { PageInfo } from '@/types/solana_type'
import { create } from 'zustand'

interface WebviewState {
  pageInfo: PageInfo | null
  setPageInfo: (info: PageInfo | null) => void
  tab: BrowserTab | null
  setTab: (tab: BrowserTab | null) => void
}

export const useWebviewStore = create<WebviewState>((set) => ({
  pageInfo: null,
  setPageInfo: (info) => set({ pageInfo: info }),
  tab: null,
  setTab: (tab) => set({ tab }),
}))
