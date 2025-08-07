export interface PumpFunToken {
  id: string
  tokenName: string
  tokenSymbol: string
  description: string
  initialSolToBuy: number
  tokenImage?: string
  twitter?: string
  telegram?: string
  website?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  userId: string
}

export interface CreateTokenFormData {
  tokenName: string
  tokenSymbol: string
  description: string
  initialSolToBuy: number
  tokenImage?: string
  twitter?: string
  telegram?: string
  website?: string
}

export interface PumpFunTokenStatus {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  message?: string
  updatedAt: string
}
