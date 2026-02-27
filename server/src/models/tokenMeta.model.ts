// NOTE: Run `npx prisma generate` to regenerate the Prisma client
// with the new TokenMeta model before using this model

import prismaService from '@/service/prismaService'

const prisma = prismaService.prisma

export interface CreateTokenMetaDto {
  post_id: string
  token_name: string
  token_symbol: string
  token_address: string
  chain_type: string
  logo_url?: string
  launch_date?: Date
  initial_price?: number
  target_price?: number
  market_cap?: number
  description?: string
}

export interface UpdateTokenMetaDto {
  token_name?: string
  token_symbol?: string
  token_address?: string
  chain_type?: string
  logo_url?: string
  launch_date?: Date
  initial_price?: number
  target_price?: number
  market_cap?: number
  description?: string
}

export class TokenMetaModel {
  /**
   * Create token metadata for a token call post
   */
  static async createTokenMeta(data: CreateTokenMetaDto) {
    return prisma.tokenMeta.create({
      data: {
        post_id: data.post_id,
        token_name: data.token_name,
        token_symbol: data.token_symbol,
        token_address: data.token_address,
        chain_type: data.chain_type,
        launch_date: data.launch_date,
        price: data.initial_price,
        target_price: data.target_price,
        market_cap: data.market_cap,
        description: data.description,
        logo_url: data.logo_url,
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
   * Get token metadata by post ID
   */
  static async getTokenMetaByPostId(post_id: string) {
    return prisma.tokenMeta.findUnique({
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
              },
            },
          },
        },
      },
    })
  }

  /**
   * Update token metadata
   */
  static async updateTokenMeta(post_id: string, data: UpdateTokenMetaDto) {
    return prisma.tokenMeta.update({
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
   * Get all token calls with metadata
   */
  static async getTokenCalls() {
    return prisma.tokenMeta.findMany({
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
   * Get token calls by chain type
   */
  static async getTokenCallsByChain(chain_type: string) {
    return prisma.tokenMeta.findMany({
      where: { chain_type },
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
   * Get token calls by launch status (based on launch_date)
   */
  static async getTokenCallsByStatus(is_launched: boolean) {
    return prisma.tokenMeta.findMany({
      where: is_launched
        ? { launch_date: { not: null } } // Launched tokens have a launch_date
        : { launch_date: null }, // Unlaunched tokens have no launch_date
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
   * Get user's token calls
   */
  static async getUserTokenCalls(user_id: string) {
    return prisma.tokenMeta.findMany({
      where: {
        post: {
          user_id,
          post_type: 'TOKEN_CALL',
        },
      },
      include: {
        post: {
          include: {
            _count: {
              select: {
                like: true,
                comment: true,
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
   * Search token calls by token name or symbol
   */
  static async searchTokenCalls(query: string) {
    return prisma.tokenMeta.findMany({
      where: {
        OR: [
          {
            token_name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            token_symbol: {
              contains: query,
              mode: 'insensitive',
            },
          },
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
   * Get token call by token address
   */
  static async getTokenCallByAddress(token_address: string) {
    return prisma.tokenMeta.findFirst({
      where: { token_address },
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
              },
            },
          },
        },
      },
    })
  }

  /**
   * Mark token as launched (sets launch_date and optionally initial_price)
   */
  static async markTokenAsLaunched(
    post_id: string,
    launch_data?: {
      launch_date?: Date
      initial_price?: number
    }
  ) {
    return prisma.tokenMeta.update({
      where: { post_id },
      data: {
        launch_date: launch_data?.launch_date || new Date(),
        price: launch_data?.initial_price,
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
   * Delete token metadata (cascades when post is deleted)
   */
  static async deleteTokenMeta(post_id: string) {
    return prisma.tokenMeta.delete({
      where: { post_id },
    })
  }

  /**
   * Get trending token calls (most liked)
   */
  static async getTrendingTokenCalls(limit: number = 10) {
    return prisma.tokenMeta.findMany({
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
              },
            },
          },
        },
      },
      orderBy: {
        post: {
          like: {
            _count: 'desc',
          },
        },
      },
      take: limit,
    })
  }
}
