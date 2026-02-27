import {
  blockUser,
  getBlockedUsers,
  getBlockStatus,
  reportPost,
  reportUser,
  unblockUser,
} from '@/controllers/moderationController'
import { authMiddleware } from '@/middleware/auth.middleware'
import express from 'express'

const moderationRoutes = express.Router()

// All moderation routes require authentication
moderationRoutes.use(authMiddleware())

// Block endpoints
moderationRoutes.post('/block', blockUser)
moderationRoutes.delete('/block/:userId', unblockUser)
moderationRoutes.get('/blocks', getBlockedUsers)
moderationRoutes.get('/block-status/:userId', getBlockStatus)

// Report endpoints
moderationRoutes.post('/report/post', reportPost)
moderationRoutes.post('/report/user', reportUser)

export default moderationRoutes
