import { DonationModel } from '@/models/donation.model'
import { CreateDonationDto, createDonation } from '@/utils/dto/socialfi.dto'
import { Request, Response } from 'express'

/**
 * Create a new donation for a fundraising post
 */
export const createDonationEntry = async (
  req: Request<{}, {}, CreateDonationDto>,
  res: Response
): Promise<void> => {
  try {
    const user = req.user

    // Validate the donation data
    const { success, data, error } = await createDonation.safeParseAsync({
      ...req.body,
      donor_user_id: user?.id, // Optional: add user ID if logged in
    })

    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
      return
    }

    const donation = await DonationModel.createDonation(data)

    res.status(201).json({
      success: true,
      data: donation,
    })
  } catch (error) {
    console.error('Error creating donation:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred creating the donation.',
    })
  }
}

/**
 * Get donations for a specific post
 */
export const getPostDonations = async (
  req: Request<{ post_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { post_id } = req.params

    if (!post_id) {
      res.status(400).json({
        success: false,
        error: 'Post ID is required',
      })
      return
    }

    const donations = await DonationModel.getDonationsByPost(post_id)

    res.status(200).json({
      success: true,
      data: donations,
    })
  } catch (error) {
    console.error('Error fetching post donations:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred fetching donations.',
    })
  }
}

/**
 * Get donations made by the current user
 */
export const getUserDonations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!
    const user_id = user.id

    const donations = await DonationModel.getDonationsByUser(user_id)

    res.status(200).json({
      success: true,
      data: donations,
    })
  } catch (error) {
    console.error('Error fetching user donations:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred fetching your donations.',
    })
  }
}

/**
 * Get donation statistics for a post
 */
export const getPostDonationStats = async (
  req: Request<{ post_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { post_id } = req.params

    if (!post_id) {
      res.status(400).json({
        success: false,
        error: 'Post ID is required',
      })
      return
    }

    const stats = await DonationModel.getPostDonationStats(post_id)

    res.status(200).json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error fetching donation stats:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred fetching donation statistics.',
    })
  }
}

/**
 * Get top donors for a post
 */
export const getTopDonors = async (
  req: Request<{ post_id: string }, {}, {}, { limit?: string }>,
  res: Response
): Promise<void> => {
  try {
    const { post_id } = req.params
    const limit = parseInt(req.query.limit || '5', 10)

    if (!post_id) {
      res.status(400).json({
        success: false,
        error: 'Post ID is required',
      })
      return
    }

    const topDonors = await DonationModel.getTopDonorsByPost(post_id, limit)

    res.status(200).json({
      success: true,
      data: topDonors,
    })
  } catch (error) {
    console.error('Error fetching top donors:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred fetching top donors.',
    })
  }
}

/**
 * Get recent donations across all posts
 */
export const getRecentDonations = async (
  req: Request<{}, {}, {}, { limit?: string }>,
  res: Response
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit || '10', 10)

    const donations = await DonationModel.getRecentDonations(limit)

    res.status(200).json({
      success: true,
      data: donations,
    })
  } catch (error) {
    console.error('Error fetching recent donations:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred fetching recent donations.',
    })
  }
}

/**
 * Verify a donation transaction
 */
export const verifyDonation = async (
  req: Request<{ donation_id: string }, {}, { transaction_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { donation_id } = req.params
    const { transaction_id } = req.body

    if (!donation_id || !transaction_id) {
      res.status(400).json({
        success: false,
        error: 'Donation ID and transaction ID are required',
      })
      return
    }

    const verifiedDonation = await DonationModel.verifyDonation(
      donation_id,
      transaction_id
    )

    res.status(200).json({
      success: true,
      data: verifiedDonation,
    })
  } catch (error) {
    console.error('Error verifying donation:', error)
    res.status(500).json({
      success: false,
      error: 'An error occurred verifying the donation.',
    })
  }
}
