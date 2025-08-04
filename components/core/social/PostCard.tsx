import { Colors } from '@/constants/Colors'
import { commentsRequests } from '@/libs/api_requests/comments.request'
import { PostsRequests } from '@/libs/api_requests/posts.request'
import { useAuthStore } from '@/store/authStore'
import { Comment as ThreadComment } from '@/types/comment.interface'
import { Post } from '@/types/posts.interface'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import {
  Button,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import CommentInputCard from './CommentInputCard'
import CommentThread from './CommentThread'
import MediaGallery from './MediaGallery'

function formatAmount(amount: string | null) {
  if (!amount) return '0'
  return parseFloat(amount).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })
}

// router function to redirect to Send Modal with donation wallet address
// function handleDonation(
//   address: string,
//   memo: string,
//   postId: string,
//   selectedToken: string
// ) {
//   router.push({
//     pathname: "/(modals)/send",
//     params: {
//       recipient: address,
//       currentMemo: memo + "Donation",
//       postId,
//       donation: "true",
//       selectedToken,
//     },
//   });
// }

// Simple, dark horizontal progress bar for donation
const DonationProgressBar = ({
  current,
  target,
}: {
  current: string
  target: string
}) => {
  const currentNum = parseFloat(current || '0')
  const targetNum = parseFloat(target || '1')
  const percent = Math.min((currentNum / targetNum) * 100, 100)
  const overFunded = currentNum > targetNum

  return (
    <View style={{ marginVertical: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 2,
        }}
      >
        <Text style={{ color: '#e5e7eb', fontWeight: 'bold', fontSize: 13 }}>
          Raised: {formatAmount(current)}
        </Text>
        <Text style={{ color: '#e5e7eb', fontWeight: 'bold', fontSize: 13 }}>
          Target: {formatAmount(target)}
        </Text>
      </View>
      <View
        style={{
          height: 10,
          backgroundColor: '#23272f',
          borderRadius: 5,
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <View
          style={{
            width: `${percent}%`,
            height: '100%',
            backgroundColor: overFunded ? '#22c55e' : '#475569',
            borderRadius: 5,
          }}
        />
      </View>
      {overFunded && (
        <Text
          style={{
            color: '#22c55e',
            fontWeight: 'bold',
            marginTop: 4,
            fontSize: 13,
          }}
        >
          Overfunded by {formatAmount((currentNum - targetNum).toString())}!
        </Text>
      )}
    </View>
  )
}

const TokenCallCard = ({ token_meta }: { token_meta: Post['token_meta'] }) => {
  const isUpcoming =
    token_meta?.launch_date && new Date(token_meta.launch_date) > new Date()
  return (
    <View
      style={{
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
        backgroundColor: '#23272f',
        borderWidth: 1,
        borderColor: '#2d3340',
        shadowColor: '#23272f',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
      >
        {token_meta?.logo_url && (
          <Image
            source={{ uri: token_meta.logo_url }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              marginRight: 12,
              backgroundColor: '#18181b',
            }}
          />
        )}
        <View>
          <Text style={{ color: '#e5e7eb', fontWeight: 'bold', fontSize: 17 }}>
            {token_meta?.token_name}{' '}
            <Text style={{ color: '#94a3b8' }}>
              ({token_meta?.token_symbol})
            </Text>
          </Text>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}
          >
            {isUpcoming ? (
              <Text
                style={{
                  color: '#fbbf24',
                  fontWeight: 'bold',
                  fontSize: 12,
                  marginRight: 8,
                }}
              >
                Upcoming
              </Text>
            ) : (
              <Text
                style={{
                  color: '#22c55e',
                  fontWeight: 'bold',
                  fontSize: 12,
                  marginRight: 8,
                }}
              >
                Live
              </Text>
            )}
            {token_meta?.launch_date && (
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                Launch: {new Date(token_meta.launch_date).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
      </View>
      {token_meta?.description && (
        <Text style={{ color: '#e5e7eb', fontSize: 14, marginBottom: 6 }}>
          {token_meta.description}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 8,
        }}
      >
        {token_meta?.initial_price && (
          <Text style={{ color: '#e5e7eb', fontSize: 13, marginRight: 8 }}>
            Initial: ${token_meta.initial_price}
          </Text>
        )}
        {token_meta?.target_price && (
          <Text style={{ color: '#e5e7eb', fontSize: 13, marginRight: 8 }}>
            Target: ${token_meta.target_price}
          </Text>
        )}
        {token_meta?.market_cap && (
          <Text style={{ color: '#e5e7eb', fontSize: 13, marginRight: 8 }}>
            MC: ${token_meta.market_cap}
          </Text>
        )}
      </View>
      {/*
      <TouchableOpacity
        style={{
          backgroundColor: "#2d3340",
          borderRadius: 8,
          paddingVertical: 8,
          paddingHorizontal: 20,
          alignSelf: "flex-start",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Buy</Text>
      </TouchableOpacity>
      */}
    </View>
  )
}

type PostCardProps = {
  post: Post
  onLike?: (postId: string) => void
}

const PostCard = ({ post, onLike }: PostCardProps) => {
  const [showCommentInput, setShowCommentInput] = React.useState(false)
  const [comments, setComments] = React.useState<ThreadComment[]>([])
  const [posting, setPosting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const { profile } = useAuthStore()
  const [showMenu, setShowMenu] = React.useState(false)
  const [editing, setEditing] = React.useState(false)
  const [editedContent, setEditedContent] = React.useState('')
  const menuButtonRef = React.useRef(null)

  // User header
  const handleMenu = () => {
    setShowMenu((v) => !v)
  }

  const isOwner = profile?.id === post.user_id
  const handleEdit = () => {
    setShowMenu(false)
    setEditedContent(post.content)
    setEditing(true)
  }

  const handleViewProfile = () => {
    setShowMenu(false)
    router.push({
      pathname: '/(modals)/user-profile',
      params: { tagName: post.user.tag_name },
    })
  }

  const userHeader = (
    <View className='flex-row items-center mb-2 relative'>
      {post.user.profile_picture_url ? (
        <Image
          source={{ uri: post.user.profile_picture_url }}
          className='w-10 h-10 rounded-full bg-secondary-light mr-2'
        />
      ) : (
        <View className='w-10 h-10 rounded-full bg-dark-300 mr-2 justify-center items-center'>
          <Text className='text-white text-base font-semibold'>
            {post.user.display_name?.[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
      )}
      <View className='flex-1'>
        <Text className='text-white font-semibold text-base'>
          {post.user.display_name}
          <Text className='text-gray-400 font-normal'>
            {' '}
            @{post.user.tag_name}
          </Text>
        </Text>
        <Text className='text-gray-500 text-xs mt-0.5'>
          {new Date(post.created_at).toLocaleString()}
        </Text>
      </View>
      <TouchableOpacity
        ref={menuButtonRef}
        onPress={handleMenu}
        className='p-2 ml-2'
        activeOpacity={0.7}
      >
        <Ionicons name='ellipsis-horizontal' size={20} color='#94a3b8' />
      </TouchableOpacity>
      {/* Custom popover menu */}
      {showMenu && (
        <>
          {/* Overlay to close menu when clicking outside */}
          <TouchableOpacity
            className='absolute inset-0 z-30'
            style={{ left: 0, top: 0, right: 0, bottom: 0 }}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          />
          <View
            className='absolute z-40 right-0 top-10 bg-primary-main rounded-xl shadow-lg border border-dark-300 min-w-[160px]'
            style={{ elevation: 8 }}
          >
            <TouchableOpacity
              className='px-4 py-3 border-b border-dark-300'
              onPress={handleViewProfile}
            >
              <Text className='text-primary-400 font-semibold text-base'>
                View user profile
              </Text>
            </TouchableOpacity>
            {isOwner && (
              <TouchableOpacity className='px-4 py-3' onPress={handleEdit}>
                <Text className='text-primary-400 font-semibold text-base'>
                  Edit
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </View>
  )

  // Content rendering by type
  let contentBlock = null
  if (post.post_type === 'REGULAR') {
    contentBlock = (
      <View style={{ marginBottom: 8 }}>
        <Text style={{ color: '#e5e7eb', fontSize: 16 }}>{post.content}</Text>
        {post.media && post.media.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <MediaGallery media={post.media} />
          </View>
        )}
      </View>
    )
  } else if (post.post_type === 'DONATION' && post.funding_meta) {
    contentBlock = (
      <View
        style={{
          backgroundColor: '#18181b',
          borderRadius: 10,
          padding: 12,
          marginBottom: 8,
        }}
      >
        <Text style={{ color: '#e5e7eb', fontSize: 16, marginBottom: 4 }}>
          {post.content}
        </Text>
        {post.media && post.media.length > 0 && (
          <View style={{ marginVertical: 8 }}>
            <MediaGallery media={post.media} />
          </View>
        )}
        <Text style={{ color: '#e5e7eb', fontWeight: 'bold', fontSize: 13 }}>
          Target: {formatAmount(post.funding_meta.target_amount)}
        </Text>
      </View>
    )
  } else if (post.post_type === 'TOKEN_CALL' && post.token_meta) {
    contentBlock = (
      <View>
        <TokenCallCard token_meta={post.token_meta} />
        {post.media && post.media.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <MediaGallery media={post.media} />
          </View>
        )}
      </View>
    )
  }

  // Engagement row (likes, comments, share)
  const engagementRow = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 18,
          }}
          onPress={() => {
            onLike?.(post.id)
          }}
        >
          <Ionicons
            name={post.like?.status ? 'heart' : 'heart-outline'}
            size={22}
            color={post.like?.status ? '#ef4444' : '#475569'}
          />
          <Text style={{ color: '#94a3b8', fontSize: 13, marginLeft: 4 }}>
            {post._count.like}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 18,
          }}
          onPress={() => setShowCommentInput((v) => !v)}
        >
          <Ionicons name='chatbubble-outline' size={20} color='#475569' />
          <Text style={{ color: '#94a3b8', fontSize: 13, marginLeft: 4 }}>
            {post._count.comment + comments.length || 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <Ionicons name='arrow-redo-outline' size={20} color='#475569' />
          <Text style={{ color: '#94a3b8', fontSize: 13, marginLeft: 4 }}>
            Share
          </Text>
        </TouchableOpacity>
      </View>
      <View>
        <TouchableOpacity
          onPress={() => {
            router.push({
              pathname: '/(modals)/send',
              params: {
                recipient: post.user.wallets.address,
                currentMemo: post.user.display_name + ' Tip',
              },
            })
          }}
          className='flex-row items-center mr-2'
        >
          <Ionicons name='cash-outline' size={20} color='#475569' />
        </TouchableOpacity>
      </View>
    </View>
  )

  const handleReply = (commentId: string) => {}

  const handleLike = (commentId: string) => {}

  // Handle posting a comment (backend integration)
  const handlePostComment = async (text: string) => {
    if (!profile) return
    setPosting(true)
    setError(null)
    try {
      const res = await commentsRequests.createComment({
        postId: post.id,
        text,
      })
      if (res.success) {
        const newComment: ThreadComment = {
          id: res.data?.id || Math.random().toString(36).slice(2),
          user: {
            display_name: profile.display_name,
            tag_name: profile.tag_name,
            profile_picture_url: profile.profile_picture_url || undefined,
          },
          content: text,
          created_at: new Date().toISOString(),
          post_id: '',
          user_id: '',
          updated_at: '',
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
        setComments((prev) => [newComment, ...prev])
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

  // Handle deleting a comment (backend integration)
  const handleDeleteComment = async (commentId: string) => {
    if (!profile) return
    setPosting(true)
    setError(null)
    try {
      const res = await commentsRequests.deleteComment({
        id: commentId,
        postId: post.id,
      })
      if (res.success) {
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

  // Handle editing post content
  const editPostContent = async () => {
    if (!post.id || editedContent) return
    setPosting(true)
    setError(null)
    try {
      // Call your API to update the post content
      const res = await PostsRequests.updatePost({
        id: post.id,
        content: editedContent.trim(),
      })
      if (res.success) {
        setEditing(false)
        alert('Post updated successfully')
      } else {
        setError(res.message || 'Failed to update post')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to update post')
    } finally {
      setPosting(false)
    }
    setEditing(false)
    setEditedContent(post.content) // Reset to original content
  }
  // router function to redirect to Post Details Modal
  const handlePress = () => {
    router.push({
      pathname: '/(modals)/post-details',
      params: { postId: post.id },
    })
  }

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handlePress}
      style={{
        backgroundColor: Colors.dark.secondaryLight,
        borderRadius: 16,
        marginBottom: 18,
        padding: 16,
        shadowColor: '#334155',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      {userHeader}
      {contentBlock}
      {engagementRow}
      {/* Animated Comment Input Card */}
      {showCommentInput && (
        <CommentInputCard
          onPost={handlePostComment}
          onCancel={() => setShowCommentInput(false)}
          loading={posting}
          onExpand={() => {}}
        />
      )}
      {/* Comment Thread (local only) */}
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
      {error && (
        <Text style={{ color: '#ef4444', marginTop: 6, fontSize: 13 }}>
          {error}
        </Text>
      )}

      {/* Edit Post Modal */}
      <Modal visible={editing} animationType='slide' transparent>
        <View className='flex-1 justify-center items-center bg-black/60'>
          <View className='bg-primary-main rounded-2xl p-6 w-11/12'>
            <Text className='text-white text-lg font-bold mb-4'>Edit Post</Text>
            <TextInput
              className='bg-secondary-light text-white rounded-xl p-3 mb-4 min-h-[80px]'
              multiline
              value={editedContent}
              onChangeText={setEditedContent}
            />
            <View className='flex-row justify-end gap-x-3'>
              <Button
                title='Cancel'
                onPress={() => setEditing(false)}
                color='#64748b'
              />
              <Button
                title='Save'
                onPress={() => {
                  editPostContent()
                }}
                color={Colors.dark.secondary}
              />
            </View>
          </View>
        </View>
      </Modal>
    </TouchableOpacity>
  )
}

export default PostCard
