import { CommentModel } from '@/models/comment.model'
import { PostModel } from '@/models/posts.model'
import { NotificationService } from '@/service/notificationService'
import { PointsService } from '@/service/pointsService'
import prismaService from '@/service/prismaService'
import { createCommentDto, createCommentSchema } from '@/utils/dto/socialfi.dto'
import { parseMentions } from '@/utils/mention.util'
import { Request, Response } from 'express'

const prisma = prismaService.prisma
export const createComment = async (
  req: Request<{}, {}, createCommentDto>,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!
    const user_id = user.id

    const { success, data, error } = await createCommentSchema.safeParseAsync({
      ...req.body,
      user_id: user_id,
    })
    if (!success) {
      res.status(400).json({
        success: false,
        error: error.message,
      })
      return
    }
    const comment = await CommentModel.createComment(data)

    // Award points for commenting on a post
    try {
      // Award points to the commenter
      await PointsService.awardPoints(user_id, 'POST_COMMENT', {
        post_id: data.post_id,
        comment_id: comment.id,
      })

      // Also award points to the post creator (if different from commenter)
      const post = await PostModel.getPost(data.post_id)
      if (post && post.user_id && post.user_id !== user_id) {
        await PointsService.awardPoints(post.user_id, 'POST_COMMENT', {
          post_id: data.post_id,
          comment_id: comment.id,
          commented_by: user_id,
        })
      }
    } catch (pointsError) {
      // Log but don't prevent comment creation if points can't be awarded
      console.error('[createComment] Error awarding points:', pointsError)
    }

    // Send notification to post owner
    try {
      // Fetch user profile from database to get display name
      const userProfile = await prisma.user.findUnique({
        where: { id: user_id },
        select: { display_name: true, tag_name: true },
      })
      const userName =
        userProfile?.display_name || userProfile?.tag_name || 'Someone'

      const post = await PostModel.getPost(data.post_id)
      if (post && post.user_id && post.user_id !== user_id) {
        await NotificationService.sendPostCommentNotification(
          post.user_id,
          user_id,
          userName,
          data.post_id,
          comment.id,
          data.text
        )
      }

      // If this is a reply to another comment, notify the parent comment owner
      if (data.parent_id) {
        const parentComment = await prisma.comment.findUnique({
          where: { id: data.parent_id },
          select: { user_id: true },
        })

        if (parentComment && parentComment.user_id !== user_id) {
          await NotificationService.sendCommentReplyNotification(
            parentComment.user_id,
            user_id,
            userName,
            data.post_id,
            comment.id,
            data.text
          )
        }
      }

      // Send notifications to mentioned users in the comment
      const tagNames = parseMentions(data.text)
      if (tagNames.length > 0) {
        // Find users by tag_name
        const mentionedUsers = await prisma.user.findMany({
          where: {
            tag_name: {
              in: tagNames,
            },
          },
          select: {
            id: true,
            tag_name: true,
          },
        })

        // Send notifications to mentioned users
        for (const mentionedUser of mentionedUsers) {
          // Don't notify the commenter if they mention themselves
          // Don't notify the post owner again (already notified above)
          // Don't notify parent comment owner again (already notified above)
          if (
            mentionedUser.id !== user_id &&
            mentionedUser.id !== post?.user_id
          ) {
            try {
              await NotificationService.sendMentionNotification(
                mentionedUser.id,
                user_id,
                userName,
                data.post_id,
                data.text
              )
            } catch (mentionNotifError) {
              console.error(
                `[createComment] Error sending mention notification to ${mentionedUser.id}:`,
                mentionNotifError
              )
            }
          }
        }
      }
    } catch (notificationError) {
      // Log but don't prevent comment creation if notification fails
      console.error(
        '[createComment] Error sending notification:',
        notificationError
      )
    }

    res.status(201).json({
      success: true,
      data: comment,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'An error occurred creating the comment.',
    })
  }
}

export const updateComment = async (
  req: Request<{}, {}, { id: string; content: string }>,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!
    const user_id = user.id
    const comment_id = req.body.id
    const content = req.body.content

    if (!comment_id || !content) {
      res.status(400).json({
        success: false,
        error: 'Comment ID or Content not found in body',
      })
      return // Add return to prevent further execution
    }

    const updatedComment = await CommentModel.updateComment(
      comment_id,
      user_id,
      content
    )

    res.status(200).json({
      success: true,
      data: updatedComment,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'An error occured updating the comment.',
    })
  }
}

export const deleteComment = async (
  req: Request<{}, {}, { id: string; post_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!
    const user_id = user.id
    const id = req.body.id
    const post = req.body.post_id

    if (id && post == null) {
      res.status(400).json({
        success: false,
        error: 'Comment ID and Post ID missing in body',
      })
      return
    }

    const deleteFunction = await CommentModel.deleteComment({
      user_id: user_id,
      id: id,
      post_id: post,
    })

    res.status(200).json({
      success: true,
      data: deleteFunction,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'An error occurred deleting the comment.',
    })
  }
}

export const likeComment = async (
  req: Request<{}, {}, { id: string }>,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!
    const user_id = user.id
    const comment_id = req.body.id

    if (!comment_id) {
      res.status(400).json({
        success: false,
        error: 'Comment ID not found in body',
      })
      return
    }

    const likeFunction = await CommentModel.likeComment(comment_id, user_id)
    console.error('Like Function Output', likeFunction)

    // Send notification to comment owner
    try {
      const comment = await prisma.comment.findUnique({
        where: { id: comment_id },
        select: { user_id: true, post_id: true },
      })

      if (comment && comment.user_id !== user_id) {
        // Fetch user profile from database to get display name
        const userProfile = await prisma.user.findUnique({
          where: { id: user_id },
          select: { display_name: true, tag_name: true },
        })
        const likerName =
          userProfile?.display_name || userProfile?.tag_name || 'Someone'

        await NotificationService.sendCommentLikeNotification(
          comment.user_id,
          user_id,
          likerName,
          comment.post_id,
          comment_id
        )
      }
    } catch (notificationError) {
      console.error(
        '[likeComment] Error sending notification:',
        notificationError
      )
    }

    res.status(200).json({
      success: true,
      data: likeFunction,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'An error occured while liking this comment',
    })
  }
}

export const getReplies = async (
  req: Request<{ id: string }, {}, {}>,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!
    const user_id = user?.id
    const comment_id = req.params.id

    if (!comment_id) {
      res.status(400).json({
        success: false,
        error: 'Comment ID not found in body',
      })
      return
    }

    const replies = await CommentModel.getCommentWithReply(comment_id)
    if (!replies) {
      throw new Error('Failed to get replies')
    }

    const like = await prisma.commentLike.findFirst({
      where: { comment_id: comment_id },
    })

    const repliesWithLike = {
      ...replies,
      like: {
        count: replies._count?.CommentLike || 0,
        status: !!like,
        id: like?.id,
      },
    }

    res.status(200).json({
      success: true,
      data: user ? repliesWithLike : replies,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'An error occured while getting replies for this comment',
    })
  }
}
