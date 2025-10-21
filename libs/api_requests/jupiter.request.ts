import { VersionedTransaction } from '@solana/web3.js'
import axios, { AxiosInstance } from 'axios'
import { Buffer } from 'buffer'
import {
  JupiterExecuteOrderResponse,
  JupiterOrderRequest,
  JupiterQuoteOrderResponse,
} from '../../types'
import { apiResponse } from '../api.helpers'
import {
  NATIVE_SOL_ADDRESS,
  NATIVE_SOL_MINT,
  WRAPPED_SOL_MINT,
} from '../solana.lib'

const api: AxiosInstance = axios.create({
  // baseURL: 'https://api.jup.ag/ultra/v1',
  baseURL: 'https://lite-api.jup.ag/ultra/v1',
  headers: {
    Accept: 'application/json',
    // 'Content-Type': 'application/json',
    // 'x-api-key': '9e318e1f-08ee-4243-aba0-c8206936ad12',
  },
  paramsSerializer: {
    serialize: (params) => {
      // Simple query string serialization without encoding issues
      return Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join('&')
    },
  },
})

api.interceptors.request.use((config) => {
  console.log('Jupiter API Request URL:', config.url)
  console.log('Jupiter API Request Params:', config.params)
  return config
})

/**
 * Helper function to normalize SOL mint addresses
 * Jupiter expects wrapped SOL mint, not native SOL addresses
 */
const normalizeSolMint = (mint: string): string => {
  if (mint === NATIVE_SOL_ADDRESS || mint === NATIVE_SOL_MINT) {
    return WRAPPED_SOL_MINT
  }
  return mint
}

export const jupiterRequests = {
  getOrder: async (params: JupiterOrderRequest) => {
    try {
      // Validate required params
      if (
        !params.inputMint ||
        !params.outputMint ||
        !params.amount ||
        !params.taker
      ) {
        const missing = []
        if (!params.inputMint) missing.push('inputMint')
        if (!params.outputMint) missing.push('outputMint')
        if (!params.amount) missing.push('amount')
        if (!params.taker) missing.push('taker')

        throw new Error(`Missing required parameters: ${missing.join(', ')}`)
      }

      // Validate amount is a positive number (but keep as string for API)
      const amountNum = Number(params.amount)
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error(
          `Invalid amount: ${params.amount}. Must be a positive number.`
        )
      }

      // Normalize SOL mints: replace native SOL addresses with wrapped SOL
      const inputMint = normalizeSolMint(params.inputMint)
      const outputMint = normalizeSolMint(params.outputMint)

      console.log('Jupiter API Request Validated:', {
        inputMint: inputMint,
        outputMint: outputMint,
        originalInputMint:
          params.inputMint !== inputMint ? params.inputMint : undefined,
        originalOutputMint:
          params.outputMint !== outputMint ? params.outputMint : undefined,
        amount: params.amount,
        taker: params.taker,
        baseURL: api.defaults.baseURL,
      })

      const res = await api.get<JupiterQuoteOrderResponse>('/order', {
        params: {
          inputMint: inputMint,
          outputMint: outputMint,
          amount: params.amount, // Keep as string - Jupiter expects string
          taker: params.taker,
          referralFee: 100, // In basis points (1%)
          referralAccount: 'HSKt4ztFYEDsTskHxmKqGD4nZjo3qLc5DcFAF3576HtT',
          // referralAccount: 'HSKt4ztFYEDsTskHxmKqGD4nZjo3qLc5DcFAF3576HtT',
          // referralFee: 100, // In basis points (1%)
        },
        timeout: 15000, // 15 second timeout
      })

      console.log('✅ Jupiter API Success:', {
        status: res.status,
        requestId: res.data?.requestId,
        inAmount: res.data?.inAmount,
        outAmount: res.data?.outAmount,
        hasTransaction: !!res.data?.transaction,
      })

      if (!res.data) {
        throw new Error('Jupiter API returned empty response')
      }

      return apiResponse<JupiterQuoteOrderResponse>(
        true,
        'Fetched Jupiter order quote',
        res.data
      )
    } catch (err: any) {
      // Enhanced error logging
      const errorDetails = {
        message: err?.message,
        apiError: err?.response?.data,
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        requestParams: {
          inputMint: params.inputMint,
          outputMint: params.outputMint,
          amount: params.amount,
          taker: params.taker,
          takerLength: params.taker?.length,
        },
        isNetworkError: !err?.response,
        timeout: err?.code === 'ECONNABORTED',
      }

      console.error(
        '❌ Jupiter API Error:',
        JSON.stringify(errorDetails, null, 2)
      )

      // Return more specific error messages
      let errorMessage = 'Failed to get Jupiter quote'

      if (err?.response?.status === 400) {
        errorMessage =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Invalid request parameters'
      } else if (err?.response?.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.'
      } else if (err?.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your connection.'
      } else if (!err?.response && err?.message) {
        errorMessage = `Network error: ${err.message}`
      } else if (err?.message) {
        errorMessage = err.message
      }

      return apiResponse<JupiterQuoteOrderResponse>(
        false,
        errorMessage,
        undefined
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
      console.log('Error executing Jupiter order:', err?.message)
      console.log('Error executing Jupiter order:', err?.response)
      console.log('Error executing Jupiter order:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error occurred.',
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
