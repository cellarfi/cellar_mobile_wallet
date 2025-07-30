export type ConnectionModalAction = 'accept' | 'reject'

export interface BrowserTab {
  id: string
  url: string
  baseUrl: string
  domain: string
  title: string
  isLoading: boolean
  progress: number
  canGoBack: boolean
  canGoForward: boolean
}
