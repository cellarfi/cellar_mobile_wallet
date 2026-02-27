import axios, { AxiosInstance } from 'axios'
import { DeviceStatus } from '../../../generated/prisma'
import { apiResponse } from '../api.helpers'
import {
  CreateSessionDto,
  SessionQueryDto,
  UpdateSessionDto,
} from '../dto/session.dto'

// Types for session requests and responses
export interface SessionResponse {
  id: string
  user_id: string
  device_id: string
  expo_push_token: string
  platform: string
  device_name?: string
  os_version?: string
  app_version?: string
  device_model?: string
  agent?: string
  ip_address?: string
  country?: string
  city?: string
  status: DeviceStatus
  last_seen_at: string
  created_at: string
  updated_at: string
  user: {
    id: string
    display_name: string
    tag_name: string
    email: string
    profile_picture_url?: string
  }
}

export interface SessionsListResponse {
  success: boolean
  data: SessionResponse[]
}

export interface SessionCountResponse {
  success: boolean
  data: {
    count: number
  }
}

export interface SessionCreateResponse {
  success: boolean
  data: SessionResponse
}

export interface SessionUpdateResponse {
  success: boolean
  data: SessionResponse
}

export interface SessionActionResponse {
  success: boolean
  message: string
}

export interface RevokeAllSessionsResponse {
  success: boolean
  data: {
    success: boolean
    message: string
  }
}

export interface GetSessionsParams extends Partial<SessionQueryDto> {}

export interface UpdateSessionParams
  extends Omit<UpdateSessionDto, 'session_id'> {}

export interface RevokeAllSessionsParams {
  currentSessionId: string
}

// Create axios instance - this would typically point to your server's base URL
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const sessionRequests = {
  /**
   * Get all sessions for the current user
   */
  getUserSessions: async (params?: GetSessionsParams) => {
    try {
      const res = await api.get<SessionsListResponse>('/sessions', {
        params,
      })

      return apiResponse(true, 'Fetched user sessions', res.data.data)
    } catch (err: any) {
      console.log('Error fetching user sessions:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error || err?.message || 'Error occurred.',
        err
      )
    }
  },

  /**
   * Get active sessions count for the current user
   */
  getActiveSessionsCount: async () => {
    try {
      const res = await api.get<SessionCountResponse>('/sessions/count')

      return apiResponse(true, 'Fetched active sessions count', res.data.data)
    } catch (err: any) {
      console.log('Error fetching active sessions count:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error || err?.message || 'Error occurred.',
        err
      )
    }
  },

  /**
   * Get a specific session by ID
   */
  getSession: async (sessionId: string) => {
    try {
      const res = await api.get<SessionCreateResponse>(`/sessions/${sessionId}`)

      return apiResponse(true, 'Fetched session details', res.data.data)
    } catch (err: any) {
      console.log('Error fetching session:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error || err?.message || 'Error occurred.',
        err
      )
    }
  },

  /**
   * Create a new session (typically called when user logs in)
   */
  createSession: async (sessionData: CreateSessionDto) => {
    try {
      const res = await api.post<SessionCreateResponse>(
        '/sessions',
        sessionData
      )

      return apiResponse(true, 'Session created successfully', res.data.data)
    } catch (err: any) {
      console.log('Error creating session:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error || err?.message || 'Error occurred.',
        err
      )
    }
  },

  /**
   * Update an existing session
   */
  updateSession: async (sessionId: string, updateData: UpdateSessionParams) => {
    try {
      const res = await api.patch<SessionUpdateResponse>(
        `/sessions/${sessionId}`,
        updateData
      )

      return apiResponse(true, 'Session updated successfully', res.data.data)
    } catch (err: any) {
      console.log('Error updating session:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error || err?.message || 'Error occurred.',
        err
      )
    }
  },

  /**
   * Update last seen timestamp for a session
   */
  updateLastSeen: async (sessionId: string) => {
    try {
      const res = await api.post<SessionActionResponse>(
        `/sessions/${sessionId}/update-last-seen`
      )

      return apiResponse(true, 'Last seen updated successfully', res.data)
    } catch (err: any) {
      console.log('Error updating last seen:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error || err?.message || 'Error occurred.',
        err
      )
    }
  },

  /**
   * Sign out a specific session (set status to SIGNED_OUT)
   */
  signOutSession: async (sessionId: string) => {
    try {
      const res = await api.post<SessionActionResponse>(
        `/sessions/${sessionId}/signout`
      )

      return apiResponse(true, 'Session signed out successfully', res.data)
    } catch (err: any) {
      console.log('Error signing out session:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error || err?.message || 'Error occurred.',
        err
      )
    }
  },

  /**
   * Revoke a specific session
   */
  revokeSession: async (sessionId: string) => {
    try {
      const res = await api.post<SessionActionResponse>(
        `/sessions/${sessionId}/revoke`
      )

      return apiResponse(true, 'Session revoked successfully', res.data)
    } catch (err: any) {
      console.log('Error revoking session:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error || err?.message || 'Error occurred.',
        err
      )
    }
  },

  /**
   * Revoke all sessions except the current one
   */
  revokeAllSessions: async (params: RevokeAllSessionsParams) => {
    try {
      const res = await api.post<RevokeAllSessionsResponse>(
        '/sessions/revoke-all',
        params
      )

      return apiResponse(
        true,
        'All other sessions revoked successfully',
        res.data.data
      )
    } catch (err: any) {
      console.log('Error revoking all sessions:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error || err?.message || 'Error occurred.',
        err
      )
    }
  },

  /**
   * Delete a session completely
   */
  deleteSession: async (sessionId: string) => {
    try {
      const res = await api.delete<SessionActionResponse>(
        `/sessions/${sessionId}`
      )

      return apiResponse(true, 'Session deleted successfully', res.data)
    } catch (err: any) {
      console.log('Error deleting session:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error || err?.message || 'Error occurred.',
        err
      )
    }
  },
}
