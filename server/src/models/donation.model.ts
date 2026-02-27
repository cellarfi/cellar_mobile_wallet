// NOTE: Run `npx prisma generate` to regenerate the Prisma client
// with the new FundingMeta model and updated Post fields before using this model

import prismaService from '@/service/prismaService'
import { CreateDonationDto } from '@/utils/dto/socialfi.dto'

const prisma = prismaService.prisma

export class DonationModel {
  /**
   * Create a new donation for a fundraising post
   */
  static async createDonation(donation: CreateDonationDto) {
    const result = await prisma.$transaction(async (tx) => {
      // Create the donation record
      const newDonation = await tx.donation.create({
        data: {
          post_id: donation.post_id,
          donor_user_id: donation.donor_user_id,
          amount: donation.amount,
          token_symbol: donation.token_symbol,
          transaction_id: donation.transaction_id,
          wallet_address: donation.wallet_address,
          message: donation.message,
        },
        include: {
          donor: {
            select: {
              id: true,
              display_name: true,
              tag_name: true,
              profile_picture_url: true,
            },
          },
          post: {
            select: {
              id: true,
              post_type: true,
            },
          },
        },
      })

      // Update the funding_meta current_amount if this is a fundraising post
      const fundingMeta = await tx.fundingMeta.findUnique({
        where: { post_id: donation.post_id },
        select: {
          target_amount: true,
          current_amount: true,
          status: true,
        },
      })

      if (fundingMeta) {
        const updatedMeta = await tx.fundingMeta.update({
          where: { post_id: donation.post_id },
          data: {
            current_amount: {
              increment: donation.amount,
            },
          },
          select: {
            current_amount: true,
            target_amount: true,
            status: true,
          },
        })

        // Check if target is reached and update status if needed
        // Convert Decimal to number for proper comparison
        const currentAmount = Number(updatedMeta.current_amount)
        const targetAmount = Number(updatedMeta.target_amount)

        console.log('[createDonation] Checking completion:', {
          post_id: donation.post_id,
          currentAmount,
          targetAmount,
          currentAmountType: typeof currentAmount,
          targetAmountType: typeof targetAmount,
          comparison: currentAmount >= targetAmount,
          status: updatedMeta.status,
        })

        // Validate and correct status based on actual amounts
        if (targetAmount > 0 && currentAmount > 0) {
          if (currentAmount >= targetAmount) {
            // Target reached - should be COMPLETED
            if (updatedMeta.status !== 'COMPLETED') {
              console.log('[createDonation] Marking campaign as COMPLETED')
              await tx.fundingMeta.update({
                where: { post_id: donation.post_id },
                data: { status: 'COMPLETED' },
              })
            }
          } else {
            // Target not reached - should be ACTIVE (unless manually set to CANCELLED/EXPIRED)
            if (updatedMeta.status === 'COMPLETED') {
              console.log(
                '[createDonation] Correcting status: COMPLETED -> ACTIVE (target not reached)'
              )
              await tx.fundingMeta.update({
                where: { post_id: donation.post_id },
                data: { status: 'ACTIVE' },
              })
            }
          }
        }
      }

      return newDonation
    })

    return result
  }

  /**
   * Get all donations for a specific post
   */
  static async getDonationsByPost(post_id: string) {
    return prisma.donation.findMany({
      where: { post_id },
      include: {
        donor: {
          select: {
            id: true,
            display_name: true,
            tag_name: true,
            profile_picture_url: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  /**
   * Get donations made by a specific user
   */
  static async getDonationsByUser(donor_user_id: string) {
    return prisma.donation.findMany({
      where: { donor_user_id },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                display_name: true,
                tag_name: true,
                profile_picture_url: true,
              },
            },
            funding_meta: {
              select: {
                target_amount: true,
                current_amount: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  /**
   * Get donation statistics for a post
   */
  static async getPostDonationStats(post_id: string) {
    const result = await prisma.donation.aggregate({
      where: { post_id },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    })

    return {
      total_amount: result._sum.amount || 0,
      total_donations: result._count.id || 0,
    }
  }

  /**
   * Get top donors for a post
   */
  static async getTopDonorsByPost(post_id: string, limit: number = 5) {
    return prisma.donation.groupBy({
      by: ['donor_user_id', 'wallet_address'],
      where: {
        post_id,
        donor_user_id: { not: null }, // Only include registered users
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: limit,
    })
  }

  /**
   * Get recent donations across all posts
   */
  static async getRecentDonations(limit: number = 10) {
    return prisma.donation.findMany({
      include: {
        donor: {
          select: {
            id: true,
            display_name: true,
            tag_name: true,
            profile_picture_url: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            post_type: true,
            user: {
              select: {
                id: true,
                display_name: true,
                tag_name: true,
              },
            },
            funding_meta: {
              select: {
                target_amount: true,
                current_amount: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
    })
  }

  /**
   * Verify a donation transaction (useful for blockchain verification)
   */
  static async verifyDonation(donation_id: string, transaction_id: string) {
    return prisma.donation.update({
      where: { id: donation_id },
      data: { transaction_id },
      include: {
        post: {
          include: {
            funding_meta: {
              select: {
                target_amount: true,
                current_amount: true,
                status: true,
              },
            },
          },
        },
        donor: {
          select: {
            id: true,
            display_name: true,
            tag_name: true,
            profile_picture_url: true,
          },
        },
      },
    })
  }
}
