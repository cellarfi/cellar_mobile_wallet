// NOTE: Run `npx prisma generate` to regenerate the Prisma client
// with the new FundingMeta model before using this model

import prismaService from '@/service/prismaService'

const prisma = prismaService.prisma

export interface CreateFundingMetaDto {
  post_id: string
  target_amount: number
  wallet_address: string
  chain_type: string
  token_symbol?: string
  token_address?: string
  deadline?: Date
}

export interface UpdateFundingMetaDto {
  target_amount?: number
  wallet_address?: string
  chain_type?: string
  token_symbol?: string
  token_address?: string
  deadline?: Date
  status?: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED'
  current_amount?: number
}

export class FundingMetaModel {
  /**
   * Create funding metadata for a post
   */
  static async createFundingMeta(data: CreateFundingMetaDto) {
    return prisma.fundingMeta.create({
      data: {
        post_id: data.post_id,
        target_amount: data.target_amount,
        current_amount: 0,
        wallet_address: data.wallet_address,
        chain_type: data.chain_type,
        token_symbol: data.token_symbol,
        token_address: data.token_address,
        deadline: data.deadline,
        status: 'ACTIVE',
      },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                tag_name: true,
                display_name: true,
                profile_picture_url: true,
              },
            },
          },
        },
      },
    })
  }

  /**
   * Get funding metadata by post ID
   */
  static async getFundingMetaByPostId(post_id: string) {
    return prisma.fundingMeta.findUnique({
      where: { post_id },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                tag_name: true,
                display_name: true,
                profile_picture_url: true,
              },
            },
            _count: {
              select: {
                like: true,
                comment: true,
                donations: true,
              },
            },
          },
        },
      },
    })
  }

  /**
   * Update funding metadata
   */
  static async updateFundingMeta(post_id: string, data: UpdateFundingMetaDto) {
    return prisma.fundingMeta.update({
      where: { post_id },
      data,
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                tag_name: true,
                display_name: true,
                profile_picture_url: true,
              },
            },
          },
        },
      },
    })
  }

  /**
   * Update fundraising status
   */
  static async updateStatus(
    post_id: string,
    status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED'
  ) {
    return prisma.fundingMeta.update({
      where: { post_id },
      data: { status },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                tag_name: true,
                display_name: true,
                profile_picture_url: true,
              },
            },
          },
        },
      },
    })
  }

  /**
   * Increment current amount (used when donations are made)
   */
  static async incrementAmount(post_id: string, amount: number) {
    const result = await prisma.$transaction(async (tx) => {
      // Update the current amount
      const updatedMeta = await tx.fundingMeta.update({
        where: { post_id },
        data: {
          current_amount: {
            increment: amount,
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

      // Validate and correct status based on actual amounts
      if (targetAmount > 0 && currentAmount > 0) {
        if (currentAmount >= targetAmount) {
          // Target reached - should be COMPLETED
          if (updatedMeta.status !== 'COMPLETED') {
            console.log('[incrementAmount] Marking campaign as COMPLETED')
            await tx.fundingMeta.update({
              where: { post_id },
              data: { status: 'COMPLETED' },
            })
          }
        } else {
          // Target not reached - should be ACTIVE (unless manually set to CANCELLED/EXPIRED)
          if (updatedMeta.status === 'COMPLETED') {
            console.log(
              '[incrementAmount] Correcting status: COMPLETED -> ACTIVE (target not reached)'
            )
            await tx.fundingMeta.update({
              where: { post_id },
              data: { status: 'ACTIVE' },
            })
          }
        }
      }

      return updatedMeta
    })

    return result
  }

  /**
   * Get all active fundraising posts with metadata
   */
  static async getActiveFundraisingPosts() {
    return prisma.fundingMeta.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { deadline: null }, // No deadline
          { deadline: { gt: new Date() } }, // Deadline not passed
        ],
      },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                tag_name: true,
                display_name: true,
                profile_picture_url: true,
              },
            },
            _count: {
              select: {
                like: true,
                comment: true,
                donations: true,
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
   * Get fundraising posts by type (TOKEN_CALL or DONATION)
   */
  static async getFundraisingPostsByType(
    post_type?: 'TOKEN_CALL' | 'DONATION'
  ) {
    const whereClause: any = {}

    if (post_type) {
      whereClause.post = {
        post_type,
      }
    } else {
      whereClause.post = {
        post_type: { in: ['TOKEN_CALL', 'DONATION'] },
      }
    }

    return prisma.fundingMeta.findMany({
      where: whereClause,
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                tag_name: true,
                display_name: true,
                profile_picture_url: true,
              },
            },
            _count: {
              select: {
                like: true,
                comment: true,
                donations: true,
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
   * Get user's fundraising posts
   */
  static async getUserFundraisingPosts(user_id: string) {
    return prisma.fundingMeta.findMany({
      where: {
        post: {
          user_id,
          post_type: { in: ['TOKEN_CALL', 'DONATION'] },
        },
      },
      include: {
        post: {
          include: {
            _count: {
              select: {
                like: true,
                comment: true,
                donations: true,
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
   * Update expired fundraising posts
   */
  static async updateExpiredFundraisingPosts() {
    const now = new Date()

    const result = await prisma.fundingMeta.updateMany({
      where: {
        status: 'ACTIVE',
        deadline: {
          lt: now,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    })

    return { updated: result.count }
  }

  /**
   * Delete funding metadata (cascades when post is deleted)
   */
  static async deleteFundingMeta(post_id: string) {
    return prisma.fundingMeta.delete({
      where: { post_id },
    })
  }

  /**
   * Get funding statistics
   */
  static async getFundingStats(post_id: string) {
    const fundingMeta = await prisma.fundingMeta.findUnique({
      where: { post_id },
      select: {
        target_amount: true,
        current_amount: true,
        status: true,
        deadline: true,
      },
    })

    if (!fundingMeta) {
      return null
    }

    const progress = fundingMeta.target_amount
      ? (Number(fundingMeta.current_amount) /
          Number(fundingMeta.target_amount)) *
        100
      : 0

    return {
      ...fundingMeta,
      progress_percentage: Math.min(progress, 100),
      is_expired: fundingMeta.deadline
        ? new Date() > fundingMeta.deadline
        : false,
    }
  }
}
