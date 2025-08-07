import { SolanaRpcMethod } from '@/constants/App'
import { WebViewRequest } from '@/types/solana_type'
import { omit } from 'lodash'
import { hmacSha256 } from './crypto.lib'

export const getHexValue = (value: number | bigint): string => {
  return '0x' + value.toString(16)
}

export function fromHex(data: string) {
  return new Uint8Array(Buffer.from(data, 'hex'))
}

export function shouldAllowWithoutPermission(method: string) {
  switch (method) {
    case SolanaRpcMethod.sol_connect:
      return true
    default:
      return false
  }
}

export async function signRequest(secret: string, request: WebViewRequest) {
  const requestWithoutSignature = omit(request, 'signature')
  const requestString = JSON.stringify(requestWithoutSignature)

  return await hmacSha256(fromHex(secret), requestString)
}
