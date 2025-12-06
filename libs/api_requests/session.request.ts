import {
  CreateSessionDto,
  SessionQueryDto,
  UpdateSessionDto,
} from '@/dto/session.dto'
import { apiResponse, httpRequest } from '../api.helpers'

export const sessionRequests = {
  /**
   * Get all sessions for the current user
   */
  getUserSessions: async (params?: SessionQueryDto) => {
    try {
      const api = httpRequest()
      const res = await api.get('/sessions', {
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
      const api = httpRequest()
      const res = await api.get('/sessions/count')

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
   * Check if a session is still active (for remote logout detection)
   */
  checkSessionStatus: async (deviceId: string) => {
    try {
      const api = httpRequest()
      const res = await api.get(`/sessions/status/${deviceId}`)

      return apiResponse(true, 'Session status checked', res.data.data)
    } catch (err: any) {
      console.log('Error checking session status:', err?.response?.data)
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
      const api = httpRequest()
      const res = await api.get(`/sessions/${sessionId}`)

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
   * Note: user_id is automatically extracted from the auth token on the server
   */
  createSession: async (sessionData: CreateSessionDto) => {
    try {
      const api = httpRequest()
      const res = await api.post('/sessions', sessionData)

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
   * Note: session_id is passed as a URL parameter, not in the body
   */
  updateSession: async (sessionId: string, updateData: UpdateSessionDto) => {
    try {
      const api = httpRequest()
      const res = await api.patch(`/sessions/${sessionId}`, updateData)

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
      const api = httpRequest()
      const res = await api.post(`/sessions/${sessionId}/update-last-seen`)

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
      const api = httpRequest()
      const res = await api.post(`/sessions/${sessionId}/signout`)

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
   * Sign out a session by device ID (remote logout)
   */
  signOutByDeviceId: async (deviceId: string) => {
    try {
      const api = httpRequest()
      const res = await api.post('/sessions/signout-device', {
        device_id: deviceId,
      })

      return apiResponse(true, 'Device signed out successfully', res.data)
    } catch (err: any) {
      console.log('Error signing out device:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error || err?.message || 'Error occurred.',
        err
      )
    }
  },

  /**
   * Sign out all sessions for the current user
   */
  signOutAllDevices: async () => {
    try {
      const api = httpRequest()
      const res = await api.post('/sessions/signout-all')

      return apiResponse(
        true,
        'All devices signed out successfully',
        res.data.data
      )
    } catch (err: any) {
      console.log('Error signing out all devices:', err?.response?.data)
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
      const api = httpRequest()
      const res = await api.post(`/sessions/${sessionId}/revoke`)

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
  revokeAllSessions: async (params: { currentSessionId: string }) => {
    try {
      const api = httpRequest()
      const res = await api.post('/sessions/revoke-all', params)

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
      const api = httpRequest()
      const res = await api.delete(`/sessions/${sessionId}`)

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
