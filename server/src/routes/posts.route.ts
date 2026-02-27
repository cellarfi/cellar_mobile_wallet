import {
  createPost,
  deletePost,
  followersPosts,
  getActiveFundraisingPosts,
  getFundingStats,
  getFundraisingPosts,
  getPost,
  getPosts,
  getTokenCallByAddress,
  getTokenCalls,
  getTrendingTokenCalls,
  getUserFundraisingPosts,
  getUserPostsByTagName,
  incrementFundingAmount,
  markTokenAsLaunched,
  searchPosts,
  searchTokenCalls,
  trendingPosts,
  updateFundraisingStatus,
  updatePost,
  updateTokenCall,
} from '@/controllers/postController'
import { authMiddleware } from '@/middleware/auth.middleware'
import { Router } from 'express'

const router = Router()

// Public routes
router.get('/fundraising', getFundraisingPosts)
router.get('/fundraising/active', getActiveFundraisingPosts)
router.get('/token-calls', getTokenCalls)
router.get('/token-calls/trending', getTrendingTokenCalls)
router.get('/token-calls/search', searchTokenCalls)
router.get('/token-calls/address/:token_address', getTokenCallByAddress)
router.get('/search', searchPosts)

// Partial protected routes
router.use(authMiddleware(false))
router.get('/', getPosts)
router.get('/trending', trendingPosts)
router.get('/user/:tag_name', getUserPostsByTagName) // Get user posts by tag_name with pagination
router.get('/:id', getPost)

// Funding statistics (public)
router.get('/:post_id/funding-stats', getFundingStats)

// Protected routes (require authentication)
router.use(authMiddleware())

// Increment funding amount for donation posts
router.patch('/:post_id/increment-funding', incrementFundingAmount)

// Unified post creation - handles all post types
router.post('/', createPost)

// Update and delete posts
router.patch('/', updatePost)
router.delete('/:id', deletePost)

// Function to get user following posts
router.get('/following-posts', followersPosts)

// Legacy fundraising management (keeping for backward compatibility)
router.patch('/fundraising/status', updateFundraisingStatus)
router.get('/fundraising/user/:user_id?', getUserFundraisingPosts)

// Token call management
router.patch('/token-calls', updateTokenCall)
router.patch('/token-calls/launch', markTokenAsLaunched)

export default router
