import { VersionedTransaction } from '@solana/web3.js'
import axios, { AxiosInstance } from 'axios'
import { Buffer } from 'buffer'
import {
  JupiterExecuteOrderResponse,
  JupiterOrderRequest,
  JupiterQuoteOrderResponse,
} from '../../types'
import { apiResponse } from '../api.helpers'

const api: AxiosInstance = axios.create({
  baseURL: 'https://lite-api.jup.ag/ultra/v1',
})

export const jupiterRequests = {
  getOrder: async (params: JupiterOrderRequest) => {
    try {
      const res = await api.get<JupiterQuoteOrderResponse>('/order', {
        params: {
          inputMint: params.inputMint,
          outputMint: params.outputMint,
          amount: params.amount,
          taker: params.taker,
          referralAccount: 'HSKt4ztFYEDsTskHxmKqGD4nZjo3qLc5DcFAF3576HtT',
          referralFee: 100, // In basis points (1%)
        },
      })

      return apiResponse<JupiterQuoteOrderResponse>(
        true,
        'Fetched Jupiter order quote',
        res.data
      )
    } catch (err: any) {
      console.log('Error fetching Jupiter order quote:', err?.response?.data)
      return apiResponse<JupiterQuoteOrderResponse>(
        false,
        err?.response?.data?.message || err?.message || 'Error occurred.',
        err
      )
    }
  },

  executeOrder: async (
    orderResponse: JupiterQuoteOrderResponse,
    signedTransaction: VersionedTransaction
  ) => {
    try {
      // Serialize the signed transaction to base64 format
      const serializedTransaction = Buffer.from(
        signedTransaction.serialize()
      ).toString('base64')

      const res = await api.post<JupiterExecuteOrderResponse>('/execute', {
        signedTransaction: serializedTransaction,
        requestId: orderResponse.requestId,
      })

      return apiResponse(true, 'Order executed successfully', res.data)
    } catch (err: any) {
      console.log('Error executing Jupiter order:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.message || err?.message || 'Error occurred.',
        err
      )
    }
  },

  // Helper function to create transaction from order response
  createTransactionFromOrder: (
    orderResponse: JupiterQuoteOrderResponse
  ): VersionedTransaction => {
    return VersionedTransaction.deserialize(
      Buffer.from(orderResponse.transaction, 'base64')
    )
  },
}
