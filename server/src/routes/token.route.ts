import {
  getHistoricalPrice,
  getOHLCV,
  getTokenOverview,
  getTrendingTokens,
  search,
} from '@/controllers/tokenController'
import { recordTokenSend } from '@/controllers/tokenSendController'
import { authMiddleware } from '@/middleware/auth.middleware'
import { Router } from 'express'

const router = Router()

router.get('/overview/:tokenAddress', getTokenOverview)
router.get('/search', search)
router.get('/historical-price/:tokenAddress', getHistoricalPrice)
router.get('/ohlcv/:tokenAddress', getOHLCV)
router.get('/trending', getTrendingTokens)

// Token send route - requires authentication
router.post('/send/record', authMiddleware(), recordTokenSend)

export default router
