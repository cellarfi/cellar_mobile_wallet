import { createComment, deleteComment, getReplies, likeComment, updateComment } from '@/controllers/commentController'
import { authMiddleware } from '@/middleware/auth.middleware'
import { Router } from 'express'

const router = Router()

// Comment routes
router.post('/', authMiddleware(), createComment) // Create comment on post
router.delete('/', authMiddleware(), deleteComment) // Delete comment
router.patch('/', authMiddleware(), updateComment) // Update comment content
router.post('/like', authMiddleware(), likeComment) // Like a comment
router.get('/replies/:id', authMiddleware(false), getReplies) // Get a comment replies

export default router
