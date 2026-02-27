import {
  addSession,
  checkSessionStatus,
  deleteSession,
  getActiveSessionsCount,
  getSession,
  getUserSessions,
  revokeAllSessions,
  revokeSession,
  signOutAllDevices,
  signOutByDeviceId,
  signOutSession,
  updateLastSeen,
  updateSession,
} from '@/controllers/sessionController'
import { authMiddleware } from '@/middleware/auth.middleware'
import { Router } from 'express'

const router = Router()

/**
 * @route   GET /api/sessions
 * @desc    Get all sessions for the current user
 * @access  Private
 */
router.get('/', authMiddleware(), getUserSessions)

/**
 * @route   GET /api/sessions/count
 * @desc    Get active sessions count for the current user
 * @access  Private
 */
router.get('/count', authMiddleware(), getActiveSessionsCount)

/**
 * @route   GET /api/sessions/status/:device_id
 * @desc    Check if a session is still active (for remote logout detection)
 * @access  Public (device checks if it's been logged out)
 */
router.get('/status/:device_id', checkSessionStatus)

/**
 * @route   GET /api/sessions/:sessionId
 * @desc    Get a specific session by ID
 * @access  Private
 */
router.get('/:sessionId', authMiddleware(), getSession)

/**
 * @route   POST /api/sessions
 * @desc    Create a new session (add session when user logs in)
 * @access  Private
 */
router.post('/', authMiddleware(), addSession)

/**
 * @route   PATCH /api/sessions/:sessionId
 * @desc    Update an existing session
 * @access  Private
 */
router.patch('/:sessionId', authMiddleware(), updateSession)

/**
 * @route   POST /api/sessions/:sessionId/update-last-seen
 * @desc    Update last seen timestamp for a session
 * @access  Private
 */
router.post('/:sessionId/update-last-seen', authMiddleware(), updateLastSeen)

/**
 * @route   POST /api/sessions/:sessionId/signout
 * @desc    Sign out a specific session (set status to SIGNED_OUT)
 * @access  Private
 */
router.post('/:sessionId/signout', authMiddleware(), signOutSession)

/**
 * @route   POST /api/sessions/signout-device
 * @desc    Sign out a session by device ID (remote logout)
 * @access  Private
 */
router.post('/signout-device', authMiddleware(), signOutByDeviceId)

/**
 * @route   POST /api/sessions/signout-all
 * @desc    Sign out all sessions for the current user
 * @access  Private
 */
router.post('/signout-all', authMiddleware(), signOutAllDevices)

/**
 * @route   POST /api/sessions/:sessionId/revoke
 * @desc    Revoke a specific session
 * @access  Private
 */
router.post('/:sessionId/revoke', authMiddleware(), revokeSession)

/**
 * @route   POST /api/sessions/revoke-all
 * @desc    Revoke all sessions except the current one
 * @access  Private
 */
router.post('/revoke-all', authMiddleware(), revokeAllSessions)

/**
 * @route   DELETE /api/sessions/:sessionId
 * @desc    Delete a session completely
 * @access  Private
 */
router.delete('/:sessionId', authMiddleware(), deleteSession)

export default router
