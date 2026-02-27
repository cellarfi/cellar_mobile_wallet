import express from 'express'
import analyticsRoutes from './routes/analytics.route'
import auraRouter from './routes/aura.route'
import commentRoutes from './routes/comments.route'
import followRoutes from './routes/follows.route'
import likeRoutes from './routes/likes.route'
import meteoraDBCRouter from './routes/meteora/meteoraDBCRoutes'
import moderationRoutes from './routes/moderation.route'
import nftRoutes from './routes/nft.route'
import notificationRoutes from './routes/notifications.route'
import pointsRoutes from './routes/points.route'
import postRoutes from './routes/posts.route'
import { launchRouter } from './routes/pumpfun/pumpfunLaunch' // import { buildCompressedNftListingTx } from './utils/compressedNftListing';
import { pumpSwapRouter } from './routes/pumpfun/pumpSwapRoutes'
import raydiumLaunchpadRoutes from './routes/raydium.route'
import sessionRoutes from './routes/sessions.route'
import jupiterSwapRouter from './routes/swap/jupiterSwapRoutes'
import raydiumSwapRouter from './routes/swap/raydiumSwapRoutes'
import tokenRoutes from './routes/token.route'
import uploadRoutes from './routes/upload.route'
import usersRoutes from './routes/users.route'
import socialfiV2Routes from './routes/socialfiV2.route'
import walletRoutes from './routes/wallet.route'

export const injectRoutes = (app: express.Express) => {
  app.use('/api/wallet', walletRoutes)
  app.use('/api/users', usersRoutes)
  app.use('/api/sessions', sessionRoutes)
  app.use('/api/token', tokenRoutes)
  app.use('/api/pumpfun', launchRouter)
  app.use('/api/jupiter', jupiterSwapRouter)
  app.use('/api/raydium/swap', raydiumSwapRouter)
  app.use('/api/raydium/launchpad', raydiumLaunchpadRoutes)
  app.use('/api/pump-swap', pumpSwapRouter)
  app.use('/api/aura', auraRouter)
  app.use('/api/meteora', meteoraDBCRouter)
  app.use('/api/nft', nftRoutes)
  // More specific routes must come before less specific ones
  app.use('/api/posts/likes', likeRoutes)
  app.use('/api/posts/comments', commentRoutes)
  app.use('/api/posts', postRoutes)
  app.use('/api/follows', followRoutes)
  app.use('/api/points', pointsRoutes)
  app.use('/api/analytics', analyticsRoutes)
  app.use('/api/upload', uploadRoutes)
  app.use('/api/notifications', notificationRoutes)
  app.use('/api/moderation', moderationRoutes)
  app.use('/api', socialfiV2Routes)
}
