import { Keys } from '@/constants/App'
import { ENV } from '@/constants/Env'
import { ApiResponseInterface } from '@/types/api_response'
import axios, { type AxiosInstance } from 'axios'
import * as SecureStore from 'expo-secure-store'

export const apiResponse = <D = any>(
  success: boolean,
  message: string,
  data?: D
): ApiResponseInterface<D> => {
  return {
    success,
    message,
    data,
  }
}

export const httpRequest = (setLoading?: (loading: boolean) => void) => {
  // Here we set the base URL for all requests made to the api
  const api: AxiosInstance = axios.create({
    baseURL: ENV.SERVER_URL,
  })
  // console.log('ENV.SERVER_URL', ENV.SERVER_URL)

  // We set an interceptor for each request to
  // include Bearer token to the request if user is logged in
  api.interceptors.request.use(async (config) => {
    setLoading?.(true)

    const token = await SecureStore.getItemAsync(Keys.PRIVY_IDENTITY_TOKEN)
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }

    // Log the full request URL
    // const fullUrl = `${config.baseURL}${config.url}`
    // console.log('Full HTTP Request URL:', fullUrl)
    // console.log('Request Method:', config.method?.toUpperCase())
    // console.log('Request Headers:', config.headers)
    // if (config.data) {
    //   console.log('Request Data:', config.data)
    // }

    return config
  })

  // This runs before any response is return
  api.interceptors.response.use(
    (response) => {
      // set loading false if isLoading is not null
      setLoading?.(false)

      return response
    },
    (error) => {
      // set loading false if isLoading is not null
      setLoading?.(false)

      // throw error
      return Promise.reject(error)
    }
  )

  return api
}
