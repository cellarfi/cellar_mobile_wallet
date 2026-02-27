import { addLike, deleteLike } from '@/controllers/likeController'
import { authMiddleware } from '@/middleware/auth.middleware'
import { Router } from 'express'

const router = Router()

// Like routes
router.post('/:post_id', authMiddleware(), addLike) // Add like to post
router.delete('/', authMiddleware(), deleteLike) // Remove like from post

export default router
