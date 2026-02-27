import { BlockModel } from '@/models/block.model'
import { CreateReportDto, ReportModel } from '@/models/report.model'
import { Request, Response } from 'express'
import { ReportType } from '../../generated/prisma'

// =============================================
// Block Endpoints
// =============================================

/**
 * Block a user
 * POST /api/moderation/block
 */
export const blockUser = async (
  req: Request<{}, {}, { user_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const blockerId = req.user!.id
    const { user_id: blockedId } = req.body

    if (!blockedId) {
      res.status(400).json({
        success: false,
        error: 'user_id is required',
      })
      return
    }

    if (blockerId === blockedId) {
      res.status(400).json({
        success: false,
        error: 'You cannot block yourself',
      })
      return
    }

    // Check if already blocked
    const alreadyBlocked = await BlockModel.hasBlocked(blockerId, blockedId)
    if (alreadyBlocked) {
      res.status(409).json({
        success: false,
        error: 'User is already blocked',
      })
      return
    }

    const block = await BlockModel.blockUser(blockerId, blockedId)

    res.status(201).json({
      success: true,
      message: 'User blocked successfully',
      data: block,
    })
  } catch (err: any) {
    console.error('[blockUser] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred while blocking the user',
    })
  }
}

/**
 * Unblock a user
 * DELETE /api/moderation/block/:userId
 */
export const unblockUser = async (
  req: Request<{ userId: string }>,
  res: Response
): Promise<void> => {
  try {
    const blockerId = req.user!.id
    const { userId: blockedId } = req.params

    if (!blockedId) {
      res.status(400).json({
        success: false,
        error: 'userId is required',
      })
      return
    }

    // Check if block exists
    const isBlocked = await BlockModel.hasBlocked(blockerId, blockedId)
    if (!isBlocked) {
      res.status(404).json({
        success: false,
        error: 'Block not found',
      })
      return
    }

    await BlockModel.unblockUser(blockerId, blockedId)

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully',
    })
  } catch (err: any) {
    console.error('[unblockUser] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred while unblocking the user',
    })
  }
}

/**
 * Get list of blocked users
 * GET /api/moderation/blocks
 */
export const getBlockedUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id

    const blockedUsers = await BlockModel.getBlockedUsers(userId)

    res.status(200).json({
      success: true,
      data: blockedUsers,
    })
  } catch (err: any) {
    console.error('[getBlockedUsers] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred while fetching blocked users',
    })
  }
}

/**
 * Check block status between current user and target user
 * GET /api/moderation/block-status/:userId
 */
export const getBlockStatus = async (
  req: Request<{ userId: string }>,
  res: Response
): Promise<void> => {
  try {
    const viewerId = req.user!.id
    const { userId: targetId } = req.params

    if (!targetId) {
      res.status(400).json({
        success: false,
        error: 'userId is required',
      })
      return
    }

    const status = await BlockModel.getBlockStatus(viewerId, targetId)

    res.status(200).json({
      success: true,
      data: status,
    })
  } catch (err: any) {
    console.error('[getBlockStatus] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred while checking block status',
    })
  }
}

// =============================================
// Report Endpoints
// =============================================

/**
 * Report a post
 * POST /api/moderation/report/post
 */
export const reportPost = async (
  req: Request<{}, {}, { post_id: string; reason: string }>,
  res: Response
): Promise<void> => {
  try {
    const reporterId = req.user!.id
    const { post_id, reason } = req.body

    if (!post_id || !reason) {
      res.status(400).json({
        success: false,
        error: 'post_id and reason are required',
      })
      return
    }

    // Check if already reported
    const alreadyReported = await ReportModel.hasReported(
      reporterId,
      ReportType.POST,
      post_id
    )
    if (alreadyReported) {
      res.status(409).json({
        success: false,
        error: 'You have already reported this post',
      })
      return
    }

    const dto: CreateReportDto = {
      reporter_id: reporterId,
      target_type: ReportType.POST,
      target_id: post_id,
      reason,
    }

    const report = await ReportModel.createReport(dto)

    res.status(201).json({
      success: true,
      message: 'Post reported successfully. Our team will review it.',
      data: report,
    })
  } catch (err: any) {
    console.error('[reportPost] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred while reporting the post',
    })
  }
}

/**
 * Report a user
 * POST /api/moderation/report/user
 */
export const reportUser = async (
  req: Request<{}, {}, { user_id: string; reason: string }>,
  res: Response
): Promise<void> => {
  try {
    const reporterId = req.user!.id
    const { user_id, reason } = req.body

    if (!user_id || !reason) {
      res.status(400).json({
        success: false,
        error: 'user_id and reason are required',
      })
      return
    }

    if (reporterId === user_id) {
      res.status(400).json({
        success: false,
        error: 'You cannot report yourself',
      })
      return
    }

    // Check if already reported
    const alreadyReported = await ReportModel.hasReported(
      reporterId,
      ReportType.USER,
      user_id
    )
    if (alreadyReported) {
      res.status(409).json({
        success: false,
        error: 'You have already reported this user',
      })
      return
    }

    const dto: CreateReportDto = {
      reporter_id: reporterId,
      target_type: ReportType.USER,
      target_id: user_id,
      reason,
    }

    const report = await ReportModel.createReport(dto)

    res.status(201).json({
      success: true,
      message: 'User reported successfully. Our team will review it.',
      data: report,
    })
  } catch (err: any) {
    console.error('[reportUser] Error:', err)
    res.status(500).json({
      success: false,
      error: 'An error occurred while reporting the user',
    })
  }
}
