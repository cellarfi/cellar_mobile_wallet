import prismaService from "@/service/prismaService";
import { createCommentDto, deleteCommentDto } from "@/utils/dto/socialfi.dto";

const prisma = prismaService.prisma;

export class CommentModel {
  /**
   * Create a new comment
   * @param comment
   * @returns void
   */
  static async createComment(comment: createCommentDto) {
    return prisma.comment.create({
      data: {
        user_id: comment.user_id,
        content: comment.text, // Map text to content field
        post_id: comment.post_id,
        parentId: comment.parent_id,
        media: comment.media,
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
      },
    });
  }

  static async deleteComment(comment: deleteCommentDto) {
    return prisma.comment.delete({
      where: {
        id: comment.id,
        user_id: comment.user_id,
        post_id: comment.post_id,
      },
    });
  }

  /**
   * Get all post comments
   * @param post_id
   * @returns
   */
  static async getCommentsByPost(post_id: string) {
    return prisma.comment.findMany({
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
      orderBy: {
        created_at: "desc",
      },
    });
  }

  /**
   * Get all comments by a user
   * @param user_id
   * @returns
   */
  static async getCommentsByUser(user_id: string) {
    return prisma.comment.findMany({
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
      orderBy: {
        created_at: "desc",
      },
    });
  }

  /**
   * Update a comment's content
   * @param comment_id
   * @param user_id
   * @param content
   * @returns
   */
  static async updateComment(
    comment_id: string,
    user_id: string,
    content: string
  ) {
    return prisma.comment.update({
      where: {
        id: comment_id,
        user_id: user_id, // Ensure only comment owner can update
      },
      data: {
        content,
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
      },
    });
  }

  /**
   * Like a comment
   * @param id
   * @param user_id
   * @returns
   */
  static async likeComment(id: string, user_id: string) {
    const existingLike = await prisma.commentLike.findFirst({
      where: { comment_id: id, user_id },
    });
    if (existingLike) {
      await prisma.commentLike.delete({
        where: {
          id: existingLike.id,
        },
      });
      return { action: "Unliked" };
    } else {
      await prisma.commentLike.create({
        data: {
          comment_id: id,
          user_id: user_id,
        },
      });
      return { action: "Liked" };
    }
  }

  /**
   * Get a comment with replies
   * @param id
   * @returns
   */
  static async getCommentWithReply(id: string) {
    return prisma.comment.findFirst({
      where: { id },
      select: {
        id: true,
        content: true,
        created_at: true,
        post_id: true,
        user: {
          select: {
            display_name: true,
            tag_name: true,
            profile_picture_url: true,
          },
        },
        replies: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                tag_name: true,
                display_name: true,
                profile_picture_url: true,
              },
            },
            created_at: true,
            updated_at: true,
          },
        },
        _count: { select: { CommentLike: true, replies: true } },
      },
    });
  }
}
