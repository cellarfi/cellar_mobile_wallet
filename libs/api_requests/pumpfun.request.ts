import { apiResponse, httpRequest } from '../api.helpers'

export interface CreateTokenRequest {
  tokenName: string
  tokenSymbol: string
  description: string
  initialSolToBuy: number
  tokenImage?: string
  twitter?: string
  telegram?: string
  website?: string
}

export interface CreateTokenResponse {
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
}

export const pumpFunRequests = {
  /**
   * Create a new token on PumpFun
   */
  createToken: async (tokenData: CreateTokenRequest) => {
    try {
      const api = httpRequest()
      const res = await api.post('/pumpfun/tokens', tokenData)

      return apiResponse(
        true,
        'Token creation request submitted successfully',
        res.data.data
      )
    } catch (err: any) {
      console.log('Error creating token:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error || err?.message || 'Failed to create token',
        err
      )
    }
  },

  /**
   * Get token creation status
   */
  getTokenStatus: async (tokenId: string) => {
    try {
      const api = httpRequest()
      const res = await api.get(`/pumpfun/tokens/${tokenId}`)

      return apiResponse(
        true,
        'Token status retrieved successfully',
        res.data.data
      )
    } catch (err: any) {
      console.log('Error getting token status:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.message ||
          'Failed to get token status',
        err
      )
    }
  },

  /**
   * Get user's token creation history
   */
  getUserTokens: async () => {
    try {
      const api = httpRequest()
      const res = await api.get('/pumpfun/tokens')

      return apiResponse(
        true,
        'User tokens retrieved successfully',
        res.data.data
      )
    } catch (err: any) {
      console.log('Error getting user tokens:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.message ||
          'Failed to get user tokens',
        err
      )
    }
  },

  /**
   * Cancel a pending token creation
   */
  cancelTokenCreation: async (tokenId: string) => {
    try {
      const api = httpRequest()
      const res = await api.delete(`/pumpfun/tokens/${tokenId}`)

      return apiResponse(
        true,
        'Token creation cancelled successfully',
        res.data.data
      )
    } catch (err: any) {
      console.log('Error cancelling token creation:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.message ||
          'Failed to cancel token creation',
        err
      )
    }
  },
}
