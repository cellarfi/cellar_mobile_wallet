import {
  createCommentV2,
  createPostV2,
  deleteCommentV2,
  deletePostV2,
  followUserV2,
  getActivityFeedV2,
  getGlobalActivityV2,
  getNodeLikersV2,
  getSuggestedProfilesV2,
  getSwapActivityV2,
  getTokenOwnersV2,
  likeNodeV2,
  likePostV2,
  recomputeCredibilityScoresV2,
  unfollowUserV2,
  unlikeNodeV2,
  unlikePostV2,
  logTradeV2,
} from '@/controllers/socialfiV2Controller'
import { authMiddleware } from '@/middleware/auth.middleware'
import { Router } from 'express'

const router = Router()

// All v2 SocialFi routes are authenticated
router.use(authMiddleware())

// Follow / unfollow
router.post('/v2/users/follow', followUserV2)
router.post('/v2/users/unfollow', unfollowUserV2)

// Posts
router.post('/v2/posts', createPostV2)
router.post('/v2/posts/:post_id/like', likePostV2)
router.delete('/v2/posts/:post_id/like', unlikePostV2)
router.delete('/v2/posts/:id', deletePostV2)

// Generic node likes (Tapestry nodes: posts, comments, etc.)
router.post('/v2/likes/:node_id', likeNodeV2)
router.delete('/v2/likes/:node_id', unlikeNodeV2)
router.get('/v2/likes/:node_id', getNodeLikersV2)

// Comments
router.post('/v2/posts/:post_id/comments', createCommentV2)
router.delete('/v2/comments/:id', deleteCommentV2)

// Suggestions
router.get('/v2/profiles/suggested', getSuggestedProfilesV2)

// Activity
router.get('/v2/activity/feed/:username', getActivityFeedV2)
router.get('/v2/activity/swap/:username', getSwapActivityV2)
router.get('/v2/activity/global', getGlobalActivityV2)

// Credibility recompute (admin/ops)
router.post('/v2/credibility/recompute', recomputeCredibilityScoresV2)

// Token owners
router.get('/v2/tokens/:token_address/owners', getTokenOwnersV2)

// Trades
router.post('/v2/trades', logTradeV2)

export default router
