import {
  followUser,
  getFollowingPosts,
  suggestedAccounts,
} from '@/controllers/followController'
import { authMiddleware } from '@/middleware/auth.middleware'
import { Router } from 'express'

const router = Router()

// Follow routes
router.get('/suggested-accounts', authMiddleware(), suggestedAccounts) // Get suggested accounts to follow
router.get('/posts', authMiddleware(), getFollowingPosts) // Get posts from followed users
router.post('/user', authMiddleware(), followUser) // Follow a user

export default router
