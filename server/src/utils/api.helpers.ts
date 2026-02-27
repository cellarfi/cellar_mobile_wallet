import { ApiResponseInterface } from '@/types'

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
