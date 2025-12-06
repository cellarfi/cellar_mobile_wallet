import axios from 'axios'

export interface IPInfoResponse {
  ip: string
  city?: string
  region?: string
  country?: string
  loc?: string
  org?: string
  timezone?: string
}

export const ipInfoRequests = {
  /**
   * Get IP address and location info from ipinfo.io
   */
  getIPInfo: async (): Promise<{
    success: boolean
    message: string
    data: IPInfoResponse | null
  }> => {
    try {
      const res = await axios.get<IPInfoResponse>('https://ipinfo.io/json', {
        timeout: 5000, // 5 second timeout
      })

      return {
        success: true,
        message: 'Fetched IP info',
        data: res.data,
      }
    } catch (err: any) {
      console.log('Error fetching IP info:', err?.message)
      return {
        success: false,
        message: err?.message || 'Error occurred fetching IP info',
        data: null,
      }
    }
  },
}


