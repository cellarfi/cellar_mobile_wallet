import { Env } from '@/utils/constants/Env'
import axios, { AxiosInstance } from 'axios'
import { apiResponse } from '../api.helpers'

const api: AxiosInstance = axios.create({
  baseURL: 'https://api.coingecko.com/api/v3',
  headers: {
    accept: 'application/json',
    'x-cg-demo-api-key': Env.COINGECKO_API_KEY,
  },
})

export const coinGeckoRequests = {
  getTopCoins: async (solOnly?: boolean) => {
    try {
      const res = await api.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          per_page: 10,
          ...(solOnly && { category: 'solana-ecosystem' }),
        },
      })

      return apiResponse(true, 'Fetched coin market data', res.data)
    } catch (err: any) {
      console.log('Error fetching coin market data:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.message || err?.message || 'Error occurred.',
        err
      )
    }
  },
}
