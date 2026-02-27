import prismaService from '@/service/prismaService'
import { addLikeDto, deleteLikeDto } from '@/utils/dto/socialfi.dto'

const prisma = prismaService.prisma

export class LikeModel {
  static async addLike(like: addLikeDto) {
    return prisma.like.create({
      data: {
        post_id: like.post_id,
        user_id: like.user_id,
      },
    })
  }

  static async deleteLike(like: deleteLikeDto) {
    return await prisma.like.delete({
      where: {
        id: like.id,
        post_id: like.post_id,
        user_id: like.user_id,
      },
    })
  }

  static async getLikesByPost(post_id: string) {
    return prisma.like.findMany({
      where: { post_id },
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
    })
  }

  static async getLikesByUser(user_id: string) {
    return prisma.like.findMany({
      where: { user_id },
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
          },
        },
      },
    })
  }

  static async checkUserLikedPost(user_id: string, post_id: string) {
    const like = await prisma.like.findFirst({
      where: {
        user_id,
        post_id,
      },
    })
    return !!like
  }
}
