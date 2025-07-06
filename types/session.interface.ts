import { User } from './'

export interface Session {
  id: string
  user_id: string
  device_id: string
  expo_push_token: string
  platform: string
  device_name: string | null
  os_version: string | null
  app_version: string | null
  device_model: string | null
  agent: string | null
  ip_address: string | null
  country: string | null
  city: string | null
  status: 'ACTIVE' | 'SIGNED_OUT' | 'REVOKED'
  last_seen_at: Date
  created_at: Date
  updated_at: Date

  user?: User
}

export interface CreateSessionDto {
  device_id: string
  expo_push_token: string
  platform: string
  device_name: string
  os_version: string
  app_version: string
  device_model: string
  agent: string
}
