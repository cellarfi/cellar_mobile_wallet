import prismaService from '@/service/prismaService'
import { tipUserDto } from '@/utils/dto/socialfi.dto'

const prisma = prismaService.prisma

export class TipModel {
  static async tipUser(tip: tipUserDto, tipper_id: string, user_id: string) {
    return prisma.tip.create({
      data: {
        user_id: user_id,
        tipper_id: tipper_id,
        amount: tip.amount,
      },
      include: {
        user: {
          select: {
            id: true,
            display_name: true,
            tag_name: true,
            profile_picture_url: true,
          },
        },
        tipperUser: {
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

  static async getTipsReceived(user_id: string) {
    return prisma.tip.findMany({
      where: { user_id },
      include: {
        tipperUser: {
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

  static async getTipsGiven(tipper_id: string) {
    return prisma.tip.findMany({
      where: { tipper_id },
      include: {
        user: {
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

  static async getTotalTipsReceived(user_id: string) {
    const result = await prisma.tip.aggregate({
      where: { user_id },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    })

    return {
      totalAmount: result._sum.amount || 0,
      totalTips: result._count.id || 0,
    }
  }

  static async getTotalTipsGiven(tipper_id: string) {
    const result = await prisma.tip.aggregate({
      where: { tipper_id },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    })

    return {
      totalAmount: result._sum.amount || 0,
      totalTips: result._count.id || 0,
    }
  }

  static async getTopTippers(limit: number = 10) {
    return prisma.tip.groupBy({
      by: ['tipper_id'],
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

  static async getTopTippedUsers(limit: number = 10) {
    return prisma.tip.groupBy({
      by: ['user_id'],
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
}
