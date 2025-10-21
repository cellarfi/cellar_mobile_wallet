import { commentsRequests } from '@/libs/api_requests/comments.request'
import { PostsRequests } from '@/libs/api_requests/posts.request'
import { useAuthStore } from '@/store/authStore'
import { Comment as ThreadComment } from '@/types/comment.interface'
import { Post } from '@/types/posts.interface'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native'
import CommentInputCard from './CommentInputCard'
import CommentThread from './CommentThread'
import PostContent from './PostContent'
import PostEngagement from './PostEngagement'
import PostHeader from './PostHeader'

interface PostCardProps {
  post: Post
  onLike?: (postId: string) => void
}

const PostCard = ({ post, onLike }: PostCardProps) => {
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [comments, setComments] = useState<ThreadComment[]>([])
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const { profile } = useAuthStore()

  const handleEdit = () => {
    setEditedContent(post.content)
    setEditing(true)
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setEditedContent('')
  }

  const handleSaveEdit = async () => {
    if (!editedContent.trim()) return

    try {
      const response = await PostsRequests.updatePost({
        id: post.id,
        content: editedContent,
      })
      if (response.success) {
        setEditing(false)
        setEditedContent('')
        // Optionally trigger a refresh or update the post in state
      } else {
        setError(response.message || 'Failed to update post')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update post')
    }
  }

  const handlePostComment = async (comment: string) => {
    if (!comment.trim()) return

    setPosting(true)
    setError(null)

    try {
      const response = await commentsRequests.createComment({
        postId: post.id,
        text: comment,
      })

      if (response.success) {
        setComments((prev) => [...prev, response.data])
        setShowCommentInput(false)
      } else {
        setError(response.message || 'Failed to post comment')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to post comment')
    } finally {
      setPosting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await commentsRequests.deleteComment({
        id: commentId,
        postId: post.id,
      })
      if (response.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId))
      }
    } catch (err: any) {
      console.error('Failed to delete comment:', err)
    }
  }

  const handleReply = (commentId: string, content: string) => {
    // Handle reply logic
    console.log('Reply to comment:', commentId, content)
  }

  const handleLike = async (commentId: string) => {
    // Handle comment like logic
    console.log('Like comment:', commentId)
  }

  const handlePress = () => {
    router.push({
      pathname: '/(screens)/post-details',
      params: { postId: post.id },
    })
  }

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handlePress}
      className='bg-secondary-light rounded-2xl mb-4 p-4 shadow-sm'
    >
      {/* Post Header */}
      <PostHeader post={post} onEdit={handleEdit} />

      {/* Post Content */}
      <PostContent post={post} />

      {/* Post Engagement */}
      <PostEngagement
        post={post}
        onLike={onLike}
        onComment={() => setShowCommentInput(true)}
        onShare={() => {
          // Handle share logic
          console.log('Share post:', post.id)
        }}
      />

      {/* Comment Input */}
      {showCommentInput && (
        <CommentInputCard
          onPost={handlePostComment}
          onCancel={() => setShowCommentInput(false)}
          loading={posting}
          onExpand={() => {}}
        />
      )}

      {/* Comment Thread */}
      {comments.length > 0 && (
        <CommentThread
          comments={comments}
          postId={post.id}
          currentUserId={profile?.id}
          onDelete={handleDeleteComment}
          onReply={handleReply}
          onLike={handleLike}
        />
      )}

      {/* Error Message */}
      {error && <Text className='text-red-400 mt-1.5 text-sm'>{error}</Text>}

      {/* Edit Post Modal */}
      <Modal visible={editing} animationType='slide' transparent>
        <View className='flex-1 bg-black/80 justify-center p-5'>
          <View className='bg-secondary-light rounded-2xl p-5'>
            <Text className='text-white text-lg font-bold mb-4'>Edit Post</Text>
            <TextInput
              value={editedContent}
              onChangeText={setEditedContent}
              multiline
              placeholder='Edit your post...'
              placeholderTextColor='#666'
              className='text-white bg-gray-800 rounded-lg p-3 min-h-[100px] mb-4'
              style={{ textAlignVertical: 'top' }}
            />
            <View className='flex-row justify-end'>
              <TouchableOpacity
                onPress={handleCancelEdit}
                className='px-4 py-2 mr-2'
              >
                <Text className='text-gray-400'>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                className='bg-primary-500 px-4 py-2 rounded-lg'
              >
                <Text className='text-white font-bold'>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </TouchableOpacity>
  )
}

export default PostCard
