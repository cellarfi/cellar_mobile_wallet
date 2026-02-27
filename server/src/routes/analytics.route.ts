import { createTransaction } from "@/controllers/analyticsController";
import { authMiddleware } from '@/middleware/auth.middleware'
import { Router } from 'express'

const router = Router()

router.post('/transaction', authMiddleware(), createTransaction); // Create a new Transaction for analytics.

export default router;