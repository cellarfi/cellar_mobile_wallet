export interface User {
  id: string
  email: string
  display_name: string
  tag_name: string
  tag_name_updated_at: Date
  profile_picture_url: string | null
  about: string | null
  wallets?: Wallet[]
  created_at: Date
  updated_at: Date
  is_following?: boolean
  _count?: {
    followers: number
    following: number
    post: number
  }
  credibility_score?: number | null
  credibility_breakdown?: {
    call_accuracy: number | null
    follower_credibility: number | null
    engagement_quality: number | null
  }
}

export interface Wallet {
  id: string
  user_id: string
  chain_type: string
  address: string
  is_default: boolean
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

export interface UserProfile {
  user: {
    id: string
    display_name: string
    tag_name: string
    profile_picture_url: string
    _count: {
      followers: number
      following: number
      post: number
    }
    post: {
      id: string
      content: string
      created_at: Date
    }[]
  }
  following: boolean
}

export interface SearchUsers {
  id: string
  display_name: string
  tag_name: string
  profile_picture_url: string
}
