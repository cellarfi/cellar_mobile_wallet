import {
  createDonationEntry,
  getPostDonations,
  getPostDonationStats,
  getRecentDonations,
  getTopDonors,
  getUserDonations,
  verifyDonation,
} from '@/controllers/donationController'
import { authMiddleware } from '@/middleware/auth.middleware'
import { Router } from 'express'

const router = Router()

// Create a new donation (public endpoint for non-registered users)
router.post('/', createDonationEntry)

// Get donations for a specific post
router.get('/post/:post_id', getPostDonations)

// Get donation statistics for a post
router.get('/post/:post_id/stats', getPostDonationStats)

// Get top donors for a post
router.get('/post/:post_id/top-donors', getTopDonors)

// Get recent donations across all posts
router.get('/recent', getRecentDonations)

// Protected routes (require authentication)
router.use(authMiddleware())

// Get donations made by the current user
router.get('/my-donations', getUserDonations)

// Verify a donation transaction
router.patch('/:donation_id/verify', verifyDonation)

export { router as donationsRouter }
