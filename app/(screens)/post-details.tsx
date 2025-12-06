import CommentInputCard from '@/components/core/social/CommentInputCard'
import CommentThread from '@/components/core/social/CommentThread'
import PostContent from '@/components/core/social/PostContent'
import PostEngagement from '@/components/core/social/PostEngagement'
import PostHeader from '@/components/core/social/PostHeader'
import { likePost } from '@/hooks/usePostActions'
import { commentsRequests } from '@/libs/api_requests/comments.request'
import { PostsRequests } from '@/libs/api_requests/posts.request'
import { useAuthStore } from '@/store/authStore'
import { usePostDetailsStore } from '@/store/socialEventsStore'
import { Comment as ThreadComment } from '@/types/comment.interface'
import { Post } from '@/types/posts.interface'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Divider = () => <View className='h-px bg-dark-300 my-4 opacity-70' />

const Card = ({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) => (
  <View
    className={`bg-secondary-light rounded-2xl p-5 mb-4 shadow-md border border-dark-300 ${className}`}
    style={{
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    }}
  >
    {children}
  </View>
)

const PostDetailsModal = () => {
  const { postId: rawPostId } = useLocalSearchParams()
  const postIdRef = useRef(rawPostId)

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { profile } = useAuthStore()
  const refreshFeed = usePostDetailsStore((state) => state.refreshFeed)
  const resetRefresh = usePostDetailsStore((state) => state.resetRefresh)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [comments, setComments] = useState<ThreadComment[]>([])
  const [posting, setPosting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [paginationData, setPaginationData] = useState<{
    pagination: {
      page: number
      pageSize: number
      totalPosts: number
      totalPages: number
    }
  } | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMorePages, setHasMorePages] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  // Update ref when postId changes
  useEffect(() => {
    postIdRef.current = rawPostId
  }, [rawPostId])

  // Use centralized like function
  const handleLike = async () => {
    if (!post) return
    try {
      await likePost(post, (updatedPost) => setPost(updatedPost))
    } catch {
      alert('Failed to update like status')
    }
  }

  useEffect(() => {
    console.log('Post ID ref', postIdRef.current)
    if (postIdRef.current) fetchPost()
  }, [postIdRef.current])

  // Listen for refresh trigger (e.g., after donation)
  useEffect(() => {
    if (refreshFeed && postIdRef.current) {
      fetchPost()
      resetRefresh()
    }
  }, [refreshFeed])

  useEffect(() => {
    if (currentPage === 1) {
      if (post && post.comment) {
        setComments(
          post.comment.map((c: Post['comment'][0]) => ({
            id: c.id,
            user: {
              display_name: c.user.display_name,
              tag_name: c.user.tag_name,
              profile_picture_url: c.user.profile_picture_url || undefined,
            },
            content: c.content,
            post_id: c.post_id,
            user_id: c.user_id,
            created_at:
              typeof c.created_at === 'string'
                ? c.created_at
                : c.created_at.toISOString(),
            updated_at:
              typeof c.updated_at === 'string'
                ? c.updated_at
                : c.updated_at.toISOString(),
            parentId: c.parentId,
            like: c.like,
            _count: c._count,
          }))
        )
      }
    }
  }, [post])

  const fetchPost = async (page = 1, append = false) => {
    if (page === 1) {
      setLoading(true)
      setError(null)
    } else {
      setIsLoadingMore(true)
    }
    try {
      const res = await PostsRequests.getPost(
        String(postIdRef.current),
        String(page)
      )
      if (res.success && res.data) {
        console.log(append, page)
        if (page > 1 && append == true) {
          // update the comments state to reflect the latest from the server (including new comments)
          setComments((prevComments) => [
            ...prevComments,
            ...(res.data.comment || []).map((c: Post['comment'][0]) => ({
              id: c.id,
              user: {
                display_name: c.user?.display_name ?? '',
                tag_name: c.user?.tag_name ?? '',
                profile_picture_url: c.user?.profile_picture_url || undefined,
              },
              content: c.content,
              post_id: c.post_id,
              user_id: c.user_id,
              created_at:
                typeof c.created_at === 'string'
                  ? c.created_at
                  : c.created_at?.toISOString(),
              updated_at:
                typeof c.updated_at === 'string'
                  ? c.updated_at
                  : c.updated_at?.toISOString(),
              parentId: c.parentId,
              like: c.like,
              _count: c._count,
            })),
          ])
        } else {
          setPost(res.data)
        }

        // Set pagination data
        setPaginationData(res.data.pagination)

        // Set current Page
        setCurrentPage(page)

        // Check if there are more pages
        if (res.data.pagination) {
          setHasMorePages(page < res.data.pagination.totalPages)
        }
      } else {
        setError(res.message || 'Post not found')
      }
    } catch (err: any) {
      setError('Failed to fetch post')
    } finally {
      setLoading(false)
      setIsLoadingMore(false)
    }
  }

  // Handle pagination for feed tab
  const handleEndReached = useCallback(() => {
    if (comments.length < 9) {
      setIsLoadingMore(false)
      return
    }
    if (hasMorePages && !isLoadingMore) {
      console.log('User reached the end, loading more posts...')
      let nextPage = currentPage + 1
      setCurrentPage(nextPage)
      fetchPost(nextPage, true)
    }
  }, [hasMorePages, isLoadingMore, currentPage])

  const handleShowCommentInput = () => setShowCommentInput(true)

  const handlePostComment = async (text: string, parentId?: string) => {
    console.log('Creating Comment')
    if (!profile || !post) return
    setPosting(true)
    setError(null)
    try {
      // Only include parentId if backend supports it, otherwise remove from payload
      const payload: any = { postId: post.id, text }
      if (parentId) payload.parentId = parentId
      const res = await commentsRequests.createComment(payload)
      if (res.success) {
        const newComment: ThreadComment = {
          id: res.data.id || Math.random().toString(36).slice(2),
          user: {
            display_name: profile.display_name,
            tag_name: profile.tag_name,
            profile_picture_url: profile.profile_picture_url || undefined,
          },
          content: text,
          post_id: '',
          user_id: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          parentId: null,
          like: {
            count: 0,
            status: false,
            id: null,
          },
          _count: {
            CommentLike: 0,
          },
        }
        // Only add the new comment once
        setComments((prev) => [newComment, ...prev])

        // Increment the Post Comment count
        setPost((prev) =>
          prev
            ? {
                ...prev,
                _count: { ...prev._count, comment: prev._count.comment + 1 },
              }
            : null
        )

        // Reset input
        setShowCommentInput(false)
      } else {
        setError(res.message || 'Failed to post comment')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to post comment')
    } finally {
      setPosting(false)
    }
  }

  // Pass this to CommentThread for replies
  const handleReply = (commentId: string, text: string) => {
    handlePostComment(text, commentId)
  }

  const handleDeleteComment = async (
    commentId: string,
    parentId?: string | null
  ) => {
    if (!profile || !post) return
    setPosting(true)
    setError(null)
    try {
      const res = await commentsRequests.deleteComment({
        id: commentId,
        postId: post.id,
      })
      if (res.success) {
        if (!parentId) {
          // setPost((prev) => prev && ({ ...prev, _count: { ...prev._count, comment: Math.max(prev._count.comment - 1, 0) } }));
        } else {
          setComments((prev) =>
            prev.map((c) =>
              c.id === parentId
                ? {
                    ...c,
                    _count: {
                      ...c._count,
                      CommentLike: Math.max((c._count.CommentLike || 1) - 1, 0),
                    },
                  }
                : c
            )
          )
        }
        setComments((prev) => prev.filter((c) => c.id !== commentId))
      } else {
        setError(res.message || 'Failed to delete comment')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to delete comment')
    } finally {
      setPosting(false)
    }
  }

  // Optimistic like/unlike for comments
  const handleLikeComment = async (commentId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c
        const liked = c.like?.status
        return {
          ...c,
          like: {
            ...c.like,
            status: !liked,
            count: liked ? (c.like?.count || 1) - 1 : (c.like?.count || 0) + 1,
          },
        }
      })
    )
    // Simulate backend request (replace with real API call if available)
    try {
      // await commentsRequests.likeComment(commentId) or unlikeComment(commentId)
      await commentsRequests.likeComment(commentId)
      // If backend fails, revert (not implemented here)
    } catch (e) {
      // Revert UI if needed
      setComments((prev) =>
        prev.map((c) => {
          if (c.id !== commentId) return c
          const liked = c.like?.status
          return {
            ...c,
            like: {
              ...c.like,
              status: !liked,
              count: liked
                ? (c.like?.count || 1) - 1
                : (c.like?.count || 0) + 1,
            },
          }
        })
      )
    }
  }

  if (loading)
    return (
      <SafeAreaView className='flex-1 bg-dark-50 justify-center items-center'>
        <ActivityIndicator color='#6366f1' />
        <Text className='text-white mt-2'>Loading post...</Text>
      </SafeAreaView>
    )
  if (error)
    return (
      <SafeAreaView className='flex-1 bg-dark-50 justify-center items-center'>
        <Text className='text-red-500 mt-2'>{error}</Text>
      </SafeAreaView>
    )
  if (!post)
    return (
      <SafeAreaView className='flex-1 bg-dark-50 justify-center items-center'>
        <Text className='text-red-500 mt-2'>Post not found</Text>
      </SafeAreaView>
    )

  // Handle tip
  const handleTip = () => {
    router.push({
      pathname: '/(modals)/send',
      params: { recipient: post.user.wallets?.address || '' },
    })
  }

  // render comments thread
  const CommentThreadRenderer = React.memo(() => {
    if (comments.length <= 0) return null

    return (
      <CommentThread
        comments={comments}
        currentUserId={profile?.id}
        postId={post.id}
        onDelete={(commentId: string, parentId: string) =>
          handleDeleteComment(commentId as string, parentId)
        }
        onReply={handleReply}
        onLike={handleLikeComment}
      />
    )
  })
  CommentThreadRenderer.displayName = 'CommentThreadRenderer'

  // render comment loading footer
  const renderFooter = () => {
    if (!isLoadingMore) return null

    return (
      <View className='flex-1 justify-center items-center py-4'>
        <ActivityIndicator color='#6366f1' />
      </View>
    )
  }

  // Pull to refresh function
  const onRefresh = async () => {
    setRefreshing(true)
    await fetchPost()
    setRefreshing(false)
  }

  return (
    <SafeAreaView className='flex-1 bg-primary-main'>
      <ScrollView
        className='px-6 mb-4'
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor='#6366f1'
          />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        onMomentumScrollEnd={(event) => {
          const { layoutMeasurement, contentOffset, contentSize } =
            event.nativeEvent
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 50

          if (isCloseToBottom) {
            setIsLoadingMore(true)
            handleEndReached()
          }
        }}
      >
        <View
          className='flex-row items-center justify-between py-4 bg-primary-main z-10'
          style={{ position: 'sticky', top: 0 }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            className='w-10 h-10 bg-primary-main rounded-full justify-center items-center'
          >
            <Ionicons name='arrow-back' size={20} color='white' />
          </TouchableOpacity>
          <Text className='text-white text-lg font-semibold'>Post Details</Text>
          <View className='w-10' />
        </View>
        <Card>
          <PostHeader post={post} />
          <PostContent post={post} />
        </Card>
        <Divider />
        <PostEngagement
          post={post}
          onLike={() => handleLike()}
          onComment={handleShowCommentInput}
          onShare={async () => {
            try {
              const postUrl = `https://cellar.so/post/${post.id}`
              await Share.share({
                message: postUrl,
                url: postUrl,
              })
            } catch (error) {
              console.error('Error sharing post:', error)
            }
          }}
          onTip={handleTip}
          showTip={true}
          variant='compact'
        />
        {/* Comment Input Card */}
        <View style={{ marginTop: 10 }}>
          {!showCommentInput ? (
            <TouchableOpacity
              className='bg-secondary-light rounded-xl px-4 py-3 border border-dark-300 flex-row items-center'
              activeOpacity={0.85}
              onPress={handleShowCommentInput}
            >
              <Ionicons name='chatbubble-outline' size={18} color='#6366f1' />
              <Text className='text-gray-400 ml-3'>Write a comment...</Text>
            </TouchableOpacity>
          ) : (
            <CommentInputCard
              onPost={(text) => handlePostComment(text)}
              onCancel={() => setShowCommentInput(false)}
              loading={posting}
              onExpand={() => {}}
            />
          )}
        </View>

        {error && (
          <Text style={{ color: '#ef4444', marginTop: 6, fontSize: 13 }}>
            {error}
          </Text>
        )}
        <CommentThreadRenderer />
        {renderFooter()}
      </ScrollView>
    </SafeAreaView>
  )
}

export default PostDetailsModal
