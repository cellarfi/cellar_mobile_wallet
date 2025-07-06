export interface AddressBookEntry {
  id: string
  name: string
  address: string
  description?: string
  network: string // e.g., "solana", "soon", etc.
  tags: string[]
  is_favorite?: boolean
  created_at: number // timestamp
  updated_at: number // timestamp
}

export interface AddressBookResponse {
  entries: AddressBookEntry[]
  total: number
}
