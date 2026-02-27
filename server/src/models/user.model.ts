import {
  ERROR_MESSAGES,
  TAG_NAME_UPDATE_TIME_LIMIT,
} from '@/constants/app.constants'
import prismaService from '@/service/prismaService'
import {
  CreateUserDto,
  CreateUserWalletDto,
  UpdateUserDefaultWalletDto,
  UpdateUserDto,
} from '@/utils/dto/users.dto'
import { generateReferralCode } from '@/utils/nanoid.util'

const prisma = prismaService.prisma

export class UsersModel {
  static async getUserById(id: string, include?: Record<string, boolean>) {
    const user_id = id

    return prisma.user.findUnique({
      where: {
        id: user_id,
      },
      include: {
        ...include,
        _count: {
          select: {
            followers: true,
            following: true,
            post: true,
          },
        },
      },
    })
  }

  static async getUserByTagName(
    tag_name: string,
    include?: Record<string, boolean>,
    viewerId?: string
  ) {
    const user = await prisma.user.findUnique({
      where: {
        tag_name,
      },
      include: {
        ...include,
        _count: {
          select: {
            followers: true,
            following: true,
            post: true,
          },
        },
      },
    })

    if (!user) return null

    let is_following = false
    if (viewerId && viewerId !== user.id) {
      const existingFollow = await prisma.follower.findFirst({
        where: {
          user_id: user.id,
          follower_id: viewerId,
        },
      })
      is_following = !!existingFollow
    }

    return {
      ...user,
      is_following,
    }
  }

  static async checkTagNameExists(tag_name: string): Promise<boolean> {
    const result = await prisma.$queryRaw<[{ exists: boolean }]>`
      SELECT EXISTS(SELECT 1 FROM "User" WHERE "tag_name" = ${tag_name}) as exists
    `
    return result[0].exists
  }

  static async verifyReferralCode(referral_code: string) {
    return await prisma.user.findUnique({
      where: {
        referral_code,
      },
    })
  }

  static async checkReferralCodeExists(
    referral_code: string
  ): Promise<boolean> {
    const result = await prisma.$queryRaw<[{ exists: boolean }]>`
      SELECT EXISTS(SELECT 1 FROM "User" WHERE "referral_code" = ${referral_code}) as exists
    `
    return result[0].exists
  }

  static async createUser(dto: CreateUserDto) {
    return prisma.user.create({
      data: {
        id: dto.id,
        email: dto.email,
        display_name: dto.display_name,
        tag_name: dto.tag_name,
        profile_picture_url: dto.profile_picture_url,
        about: dto.about,
        created_at: dto.created_at,
        tag_name_updated_at: new Date(), // Set initial tag_name_updated_at when user is created
        referral_code: generateReferralCode(),
        referred_by: dto.referred_by,
      },
    })
  }

  static async createUserWallet(dto: CreateUserWalletDto) {
    return prisma.wallet.create({
      data: {
        user_id: dto.user_id,
        chain_type: dto.chain_type,
        address: dto.address,
      },
    })
  }

  static async updateUserDefaultWallet(dto: UpdateUserDefaultWalletDto) {
    return prisma.wallet.update({
      where: {
        id: dto.wallet_id,
        user_id: dto.user_id,
      },
      data: {
        is_default: true,
      },
    })
  }

  static async updateUser(id: string, dto: UpdateUserDto) {
    // Enforce tag name update time limit
    if (dto.tag_name) {
      const user = await prisma.user.findUnique({
        where: { id },
      })

      if (user?.tag_name_updated_at) {
        const lastUpdate = new Date(user.tag_name_updated_at).getTime()
        const now = Date.now()
        const timeSinceLastUpdate = now - lastUpdate

        if (timeSinceLastUpdate < TAG_NAME_UPDATE_TIME_LIMIT) {
          throw new Error(ERROR_MESSAGES.TAG_NAME_UPDATE_LIMIT)
        }
      }
    }

    const updateData: any = {
      display_name: dto.display_name,
      profile_picture_url: dto.profile_picture_url,
      about: dto.about,
    }

    // Only update tag_name_updated_at if tag_name is being updated
    if (dto.tag_name) {
      updateData.tag_name = dto.tag_name
      updateData.tag_name_updated_at = new Date()
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
    })
  }

  static async setTapestryProfileId(id: string, tapestryProfileId: string) {
    return prisma.user.update({
      where: { id },
      data: {
        tapestry_profile_id: tapestryProfileId,
      },
    })
  }

  static async deleteUser(user_id: string) {
    await prisma.user.delete({
      where: {
        id: user_id,
      },
    })
  }

  static async searchUser(query: string) {
    return prisma.user.findMany({
      where: {
        display_name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        display_name: true,
        tag_name: true,
        profile_picture_url: true,
      },
    })
  }

  static async getUserProfile(param: string, viewer_id?: string) {
    const user = await prisma.user.findUnique({
      where: {
        tag_name: param,
      },
      select: {
        id: true,
        display_name: true,
        tag_name: true,
        profile_picture_url: true,
        about: true,
        _count: {
          select: {
            followers: true,
            following: true,
            post: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            created_at: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        },
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    let isFollowing = false
    if (viewer_id && viewer_id !== param) {
      const existingFollow = await prisma.follower.findFirst({
        where: {
          user_id: param,
          follower_id: viewer_id,
        },
      })
      isFollowing = !!existingFollow
    }

    return {
      user,
      isFollowing,
    }
  }
}
