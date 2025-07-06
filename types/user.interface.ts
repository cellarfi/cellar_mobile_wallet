export interface User {
  id: string
  email: string
  display_name: string
  tag_name: string
  profile_picture_url: string | null
  about: string | null
  created_at: Date
  updated_at: Date
}

export interface CreateUserDto {
  id: string
  email: string
  display_name: string
  tag_name: string
  profile_picture_url?: string | undefined
  about?: string | undefined
}

export interface UpdateUserDto {
  display_name?: string | undefined
  tag_name?: string | undefined
  profile_picture_url?: string | undefined
  about?: string | undefined
}

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
}
