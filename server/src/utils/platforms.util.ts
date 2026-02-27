import { PrivyClient } from '@privy-io/server-auth'
import { SocialFi } from 'socialfi'
import { Env } from './constants/Env'

export const tapestryClient = new SocialFi({
  // Tapestry base URL must include `/api/v1` per SDK docs
  baseURL:
    process.env.TAPESTRY_BASE_URL || 'https://api.usetapestry.dev/api/v1',
  headers: {
    'x-api-key': Env.TAPESTRY_API_KEY,
  },
})

export const privyClient = new PrivyClient(
  Env.PRIVY_APP_ID,
  Env.PRIVY_APP_SECRET,
)
