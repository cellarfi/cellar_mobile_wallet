import { privyClient } from '@/utils/platforms.util'
import { NextFunction, Request, Response } from 'express'

export const authMiddleware =
  (required: boolean = true) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const accessToken = req.headers.authorization?.split(' ')[1]

    if (!accessToken) {
      if (required) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      } else {
        req.user = undefined
        return next()
      }
    }

    try {
      const user = await privyClient.getUser({ idToken: accessToken })

      if (!user) {
        if (required) {
          res.status(401).json({ error: 'Unauthorized' })
          return
        } else {
          req.user = undefined
          return next()
        }
      }

      if (!user.wallet?.address) {
        if (required) {
          res.status(401).json({ error: 'User has not linked any wallet' })
          return
        } else {
          req.user = undefined
          return next()
        }
      }

      req.user = user
      req.user.id = user.id.split(':').pop() || user.id
      next()
    } catch (error) {
      console.error('Error verifying authentication:', error)
      if (required) {
        console.error('Error verifying authentication:', error)
        res.status(401).json({ error: 'Unauthorized' })
      } else {
        req.user = undefined
        next()
      }
    }
  }
