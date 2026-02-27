import { SessionModel } from '@/models/session.model'
import { FCMService } from '@/service/fcmService'
import { PointsService } from '@/service/pointsService'
import prismaService from '@/service/prismaService'
import {
  CreateSessionDto,
  createSessionSchema,
  SessionQueryDto,
  sessionQuerySchema,
  UpdateSessionDto,
  updateSessionSchema,
} from '@/utils/dto/session.dto'
import { Request, Response } from 'express'

// Cache for tracking last daily login reward time per user
const lastDailyLoginReward: Record<string, Date> = {}

/**
 * Create a new session (add session when user logs in)
 */
export const addSession = async (
  req: Request<{}, {}, CreateSessionDto>,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user!.id

    const { success, data, error } = await createSessionSchema.safeParseAsync({
      ...req.body,
      user_id,
    })

    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
      return
    }

    // Get existing active sessions BEFORE creating the new one
    const existingSessions = await SessionModel.getUserSessions({
      user_id,
      status: 'ACTIVE',
    })

    // Create the new session
    const session = await SessionModel.createSession(data)

    // Notify other devices about the new login
    try {
      // Filter out the current device's token and get other device tokens
      const otherDeviceTokens = existingSessions
        .filter((s: any) => s.push_token && s.push_token !== data.push_token)
        .map((s: any) => s.push_token)

      if (otherDeviceTokens.length > 0) {
        // Build device info string for notification
        const deviceInfo =
          data.device_name || data.device_model || 'Unknown device'
        const platformInfo = data.platform ? ` (${data.platform})` : ''
        const locationInfo =
          data.city && data.country
            ? ` from ${data.city}, ${data.country}`
            : data.country
            ? ` from ${data.country}`
            : ''

        await FCMService.sendToTokens(otherDeviceTokens, {
          title: '🔐 New Login Detected',
          body: `Your account was accessed on ${deviceInfo}${platformInfo}${locationInfo}`,
          data: {
            type: 'NEW_LOGIN',
            session_id: session.id,
            device_id: data.device_id,
            device_name: data.device_name || '',
            platform: data.platform || '',
            city: data.city || '',
            country: data.country || '',
            timestamp: new Date().toISOString(),
          },
        })

        console.log(
          `[addSession] Notified ${otherDeviceTokens.length} other device(s) about new login for user ${user_id}`
        )
      }
    } catch (notifError) {
      // Log but don't fail the session creation
      console.error(
        '[addSession] Error sending new login notification:',
        notifError
      )
    }

    res.status(201).json({
      success: true,
      data: session,
    })
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: 'Session already exists for this device',
      })
      return
    }

    console.error('[addSession] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred creating the session',
    })
  }
}

/**
 * Update an existing session
 */
export const updateSession = async (
  req: Request<
    { session_id: string },
    {},
    Omit<UpdateSessionDto, 'session_id'>
  >,
  res: Response
): Promise<void> => {
  try {
    const { session_id } = req.params
    const user_id = req.user!.id

    // Verify session belongs to current user
    const existingSession = await SessionModel.getSessionById(session_id)
    if (!existingSession || existingSession.user_id !== user_id) {
      res.status(404).json({
        success: false,
        error: 'Session not found or access denied',
      })
      return
    }

    const { success, data, error } = await updateSessionSchema.safeParseAsync({
      session_id,
      ...req.body,
    })

    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
      return
    }

    const updatedSession = await SessionModel.updateSession(data)

    res.json({
      success: true,
      data: updatedSession,
    })
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      })
      return
    }

    console.error('[updateSession] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred updating the session',
    })
  }
}

/**
 * Get all sessions for the current user
 */
export const getUserSessions = async (
  req: Request<{}, {}, {}, { device_id?: string; status?: string }>,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user!.id
    const { device_id, status } = req.query

    const queryData: SessionQueryDto = {
      user_id,
    }

    if (device_id) queryData.device_id = device_id
    if (status) queryData.status = status as any

    const { success, data, error } = await sessionQuerySchema.safeParseAsync(
      queryData
    )

    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
      return
    }

    const sessions = await SessionModel.getUserSessions(data)

    res.json({
      success: true,
      data: sessions,
    })
  } catch (err: any) {
    console.error('[getUserSessions] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred retrieving sessions',
    })
  }
}

/**
 * Get a specific session by ID
 */
export const getSession = async (
  req: Request<{ session_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { session_id } = req.params
    const user_id = req.user!.id

    const session = await SessionModel.getSessionById(session_id)

    if (!session || session.user_id !== user_id) {
      res.status(404).json({
        success: false,
        error: 'Session not found or access denied',
      })
      return
    }

    res.json({
      success: true,
      data: session,
    })
  } catch (err: any) {
    console.error('[getSession] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred retrieving the session',
    })
  }
}

/**
 * Revoke a specific session
 */
export const revokeSession = async (
  req: Request<{ session_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { session_id } = req.params
    const user_id = req.user!.id

    // Verify session belongs to current user
    const existingSession = await SessionModel.getSessionById(session_id)
    if (!existingSession || existingSession.user_id !== user_id) {
      res.status(404).json({
        success: false,
        error: 'Session not found or access denied',
      })
      return
    }

    await SessionModel.revokeSession(session_id)

    res.json({
      success: true,
      message: 'Session revoked successfully',
    })
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      })
      return
    }

    console.error('[revokeSession] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred revoking the session',
    })
  }
}

/**
 * Revoke all sessions except the current one
 */
export const revokeAllSessions = async (
  req: Request<{}, {}, { current_session_id?: string }>,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user!.id
    const { current_session_id } = req.body

    if (!current_session_id) {
      res.status(400).json({
        success: false,
        error: 'Current session ID is required',
      })
      return
    }

    // Verify current session belongs to user
    const currentSession = await SessionModel.getSessionById(current_session_id)
    if (!currentSession || currentSession.user_id !== user_id) {
      res.status(400).json({
        success: false,
        error: 'Invalid current session ID',
      })
      return
    }

    const result = await SessionModel.signOutAllOtherSessions(
      user_id,
      current_session_id
    )

    res.json({
      success: true,
      data: result,
    })
  } catch (err: any) {
    console.error('[revokeAllSessions] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred revoking sessions',
    })
  }
}

/**
 * Sign out a specific session (set status to SIGNED_OUT)
 */
export const signOutSession = async (
  req: Request<{ session_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { session_id } = req.params
    const user_id = req.user!.id

    // Verify session belongs to current user
    const existingSession = await SessionModel.getSessionById(session_id)
    if (!existingSession || existingSession.user_id !== user_id) {
      res.status(404).json({
        success: false,
        error: 'Session not found or access denied',
      })
      return
    }

    await SessionModel.signOutSession(session_id)

    res.json({
      success: true,
      message: 'Session signed out successfully',
    })
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      })
      return
    }

    console.error('[signOutSession] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred signing out the session',
    })
  }
}

/**
 * Update last seen timestamp for a session
 */
export const updateLastSeen = async (
  req: Request<{ session_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { session_id } = req.params
    const user_id = req.user!.id

    // Verify session belongs to current user
    const existingSession = await SessionModel.getSessionById(session_id)
    if (!existingSession || existingSession.user_id !== user_id) {
      res.status(404).json({
        success: false,
        error: 'Session not found or access denied',
      })
      return
    }

    await SessionModel.updateLastSeen(session_id)

    // Check and award daily login points if applicable
    try {
      // Check if user has already received daily login points today
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()) // Midnight today
      const lastReward = lastDailyLoginReward[user_id]

      // Award points if they haven't received daily login points today yet
      if (!lastReward || lastReward < today) {
        // Check if this is their first activity of the day
        const startOfDay = today.toISOString()
        const endOfDay = new Date(
          today.getTime() + 24 * 60 * 60 * 1000
        ).toISOString()

        // Check if they already have daily login points for today
        const existingDailyLogin = await prismaService.prisma.point.findFirst({
          where: {
            user_id,
            source: 'DAILY_LOGIN',
            created_at: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
        })

        if (!existingDailyLogin) {
          // Award daily login points
          await PointsService.awardPoints(user_id, 'DAILY_LOGIN', {
            login_date: now.toISOString(),
            session_id,
          })

          // Update the cache
          lastDailyLoginReward[user_id] = now

          console.log(
            `[updateLastSeen] Awarded daily login points to user ${user_id}`
          )
        }
      }
    } catch (pointsError) {
      // Log but don't affect the main functionality
      console.error(
        '[updateLastSeen] Error awarding daily login points:',
        pointsError
      )
    }

    res.json({
      success: true,
      message: 'Last seen updated successfully',
    })
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      })
      return
    }

    console.error('[updateLastSeen] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred updating last seen',
    })
  }
}

/**
 * Delete a session completely
 */
export const deleteSession = async (
  req: Request<{ session_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { session_id } = req.params
    const user_id = req.user!.id

    // Verify session belongs to current user
    const existingSession = await SessionModel.getSessionById(session_id)
    if (!existingSession || existingSession.user_id !== user_id) {
      res.status(404).json({
        success: false,
        error: 'Session not found or access denied',
      })
      return
    }

    await SessionModel.deleteSession(session_id)

    res.status(204).json({
      success: true,
      message: 'Session deleted successfully',
    })
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      })
      return
    }

    console.error('[deleteSession] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred deleting the session',
    })
  }
}

/**
 * Get active sessions count for the current user
 */
export const getActiveSessionsCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user!.id

    const count = await SessionModel.getActiveSessionsCount(user_id)

    res.json({
      success: true,
      data: { count },
    })
  } catch (err: any) {
    console.error('[getActiveSessionsCount] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred retrieving active sessions count',
    })
  }
}

/**
 * Check if a session is still active (for remote logout detection)
 */
export const checkSessionStatus = async (
  req: Request<{ device_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { device_id } = req.params

    if (!device_id) {
      res.status(400).json({
        success: false,
        error: 'Device ID is required',
      })
      return
    }

    const isActive = await SessionModel.isSessionActive(device_id)

    res.json({
      success: true,
      data: {
        is_active: isActive,
        device_id,
      },
    })
  } catch (err: any) {
    console.error('[checkSessionStatus] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred checking session status',
    })
  }
}

/**
 * Sign out a session by device ID (remote logout)
 */
export const signOutByDeviceId = async (
  req: Request<{}, {}, { device_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user!.id
    const { device_id } = req.body

    if (!device_id) {
      res.status(400).json({
        success: false,
        error: 'Device ID is required',
      })
      return
    }

    const result = await SessionModel.signOutByDeviceId(device_id, user_id)

    if (result.count === 0) {
      res.status(404).json({
        success: false,
        error: 'Session not found or access denied',
      })
      return
    }

    res.json({
      success: true,
      message: 'Device signed out successfully',
    })
  } catch (err: any) {
    console.error('[signOutByDeviceId] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred signing out the device',
    })
  }
}

/**
 * Sign out all sessions for the current user
 */
export const signOutAllDevices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user!.id

    const result = await SessionModel.signOutAllSessions(user_id)

    res.json({
      success: true,
      message: `Signed out ${result.count} devices`,
      data: { count: result.count },
    })
  } catch (err: any) {
    console.error('[signOutAllDevices] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred signing out all devices',
    })
  }
}
