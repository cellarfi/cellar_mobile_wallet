import CommentInputCard from '@/components/core/social/CommentInputCard'
import CommentThread from '@/components/core/social/CommentThread'
import MediaGallery from '@/components/core/social/MediaGallery'
import { useTokenOverview } from '@/hooks/useTokenOverview'
import { commentsRequests } from '@/libs/api_requests/comments.request'
import { PostsRequests } from '@/libs/api_requests/posts.request'
import { formatAddress, formatNumber } from '@/libs/string.helpers'
import { useAuthStore } from '@/store/authStore'
import { usePostDetailsStore } from '@/store/socialEventsStore'
import { Comment as ThreadComment } from '@/types/comment.interface'
import { Post } from '@/types/posts.interface'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
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

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text className='text-white text-lg font-bold mb-2 tracking-tight'>
    {children}
  </Text>
)

// router function to redirect to Donate Modal
function handleDonation(
  address: string,
  postId: string,
  currentAmount: string,
  targetAmount: string
) {
  router.push({
    pathname: '/(modals)/donate',
    params: {
      postId: postId || '',
      walletAddress: address,
      campaignTitle: 'Donation Campaign',
      currentAmount: currentAmount || '0',
      targetAmount: targetAmount || '0',
    },
  })
}

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
    <View className='my-2'>
      <View className='flex-row justify-between mb-1'>
        <Text className='text-gray-200 font-bold text-xs'>
          Raised: {formatNumber(Number(current))}
        </Text>
        <Text className='text-gray-200 font-bold text-xs'>
          Target: {formatNumber(Number(target))}
        </Text>
      </View>
      <View className='h-2 bg-dark-300 rounded-full w-full overflow-hidden'>
        <View
          style={{ width: `${percent}%` }}
          className={`h-2 ${
            overFunded ? 'bg-success-400' : 'bg-primary-500'
          } rounded-full`}
        />
      </View>
      {overFunded && (
        <Text className='text-success-400 font-bold mt-1 text-xs'>
          Overfunded by {formatNumber(currentNum - targetNum)}!
        </Text>
      )}
    </View>
  )
}

const PostDetailsModal = () => {
  const { postId: rawPostId } = useLocalSearchParams()
  const postIdRef = useRef(rawPostId)

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
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

  // Get token address from post if available
  const tokenAddress = post?.token_meta?.token_address || ''
  const { token: tokenData } = useTokenOverview(tokenAddress)

  // Update ref when postId changes
  useEffect(() => {
    postIdRef.current = rawPostId
  }, [rawPostId])

  // function to like a post
  const handleLike = async () => {
    setPost((prev) =>
      prev
        ? {
            ...prev,
            like: {
              ...prev.like,
              status: !prev.like.status,
            },
            _count: {
              ...prev._count,
              like: prev.like.status
                ? (prev._count.like || 0) - 1
                : (post?._count.like || 0) + 1,
            },
          }
        : null
    )

    try {
      if (post?.like?.status) {
        // Unlike the post
        const response = await PostsRequests.unlikePost(post.like.id, post.id)
        if (!response.success) {
          throw new Error('Failed to unlike post')
        }
      } else {
        // Like the post
        const response = await PostsRequests.likePost(post?.id || '')
        if (!response.success) {
          throw new Error('Failed to like post')
        }
        // Update the like id with the response data
        setPost((prev) =>
          prev
            ? {
                ...prev,
                like: { ...prev.like, id: response.data.id },
              }
            : null
        )
      }
    } catch (error) {
      console.log(error)
      // Revert the changes if the API call fails
      if (post) {
        setPost(post)
      }
      alert('Failed to update like status')
    }
  }

  const redirectToUserProfile = (tagName: string) => {
    router.push({
      // pathname: '/(screens)/user-profile/[tag_name]',
      pathname: '/profile/[tag_name]',
      params: { tag_name: tagName },
    })
  }

  // Memoize the token object for swap
  const token = tokenData
    ? {
        address: tokenData.tokenOverview.address,
        name: tokenData.tokenOverview.name,
        symbol: tokenData.tokenOverview.symbol,
        decimals: tokenData.tokenOverview.decimals,
        logoURI: tokenData.tokenOverview.logoURI,
        price: tokenData.tokenOverview.price,
        priceChange24hPercent:
          tokenData.tokenOverview.priceChange24hPercent || 0,
        v24hUSD: tokenData.tokenOverview.v24hUSD,
        fdv: tokenData.tokenOverview.fdv,
        marketCap: tokenData.tokenOverview.marketCap,
        liquidity: tokenData.tokenOverview.liquidity,
      }
    : undefined

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

  // User header
  const userHeader = (
    <Pressable
      className='flex-row items-center mb-4'
      onPress={() => redirectToUserProfile(post.user.tag_name)}
    >
      {post.user?.profile_picture_url ? (
        <Image
          source={{ uri: post.user.profile_picture_url }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#23272f',
            marginRight: 10,
          }}
        />
      ) : (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#23272f',
            marginRight: 10,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16 }}>
            {post.user?.display_name?.[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
      )}
      <View className='flex-1'>
        <Text className='flex-col text-white font-bold text-base leading-tight'>
          {post.user?.display_name}
          <Text className='text-gray-400 font-normal'>
            {' '}
            @{post.user.tag_name}
          </Text>
        </Text>
        <Text className='text-gray-500 text-xs mt-0.5'>
          {new Date(post.created_at).toLocaleString()}
        </Text>
      </View>
      <Ionicons name='ellipsis-horizontal' size={22} color='#6366f1' />
    </Pressable>
  )

  // Content rendering by type
  let contentBlock = null
  if (post.post_type === 'REGULAR') {
    contentBlock = (
      <View>
        <SectionTitle>Post</SectionTitle>
        <Text className='text-white text-base leading-relaxed mb-1'>
          {post.content}
        </Text>
        {post.media?.length ? (
          <View className='mt-3'>
            <MediaGallery media={post.media} maxItems={4} />
          </View>
        ) : null}
      </View>
    )
  } else if (post.post_type === 'DONATION' && post.funding_meta) {
    const { wallet_address } = post.funding_meta || {}
    contentBlock = (
      <Card>
        <SectionTitle>Donation</SectionTitle>
        <Text className='text-white text-base leading-relaxed mb-2'>
          {post.content}
        </Text>
        {post.media?.length ? (
          <View className='mt-3'>
            <MediaGallery media={post.media} maxItems={4} />
          </View>
        ) : null}
        <DonationProgressBar
          current={post.funding_meta.current_amount}
          target={post.funding_meta.target_amount}
        />
        <View className='flex-row items-center mt-2'>
          <Ionicons name='wallet-outline' size={18} color='#6366f1' />
          <Text className='text-gray-400 text-xs ml-2'>
            {post.funding_meta.token_symbol || 'Token'} on{' '}
            {post.funding_meta.chain_type}
          </Text>
        </View>
        {post.funding_meta.deadline && (
          <Text className='text-gray-500 text-xs mt-1'>
            Ends: {new Date(post.funding_meta.deadline).toLocaleDateString()}
          </Text>
        )}
        <Divider />
        <Text className='text-white font-bold text-sm mb-1'>
          Funding Details
        </Text>
        {wallet_address ? (
          <View className='flex-row justify-between items-center mb-1'>
            <Text className='text-gray-400 text-xs'>Wallet:</Text>
            <View className='flex-row items-center'>
              <Text className='text-white text-xs font-mono mr-2'>
                {formatAddress(wallet_address)}
              </Text>
              <TouchableOpacity
                onPress={() => handleCopyWallet(wallet_address)}
                className='p-1'
                activeOpacity={0.8}
              >
                <Ionicons
                  name={copied ? 'checkmark-outline' : 'copy-outline'}
                  size={16}
                  color='#6366f1'
                />
              </TouchableOpacity>
              {copied && (
                <Text className='text-success-400 text-xs ml-1'>Copied!</Text>
              )}
            </View>
          </View>
        ) : null}
        <Text className='text-gray-400 text-xs mt-0.5'>
          Status: {post.funding_meta.status}
        </Text>
        {/* Donate Button - Allow donations for ACTIVE and COMPLETED campaigns */}
        {(post.funding_meta.status === 'ACTIVE' ||
          post.funding_meta.status === 'COMPLETED') && (
          <TouchableOpacity
            className='bg-primary-500 rounded-xl py-2 px-6 self-start mt-4'
            activeOpacity={0.92}
            onPress={() =>
              handleDonation(
                post.funding_meta?.wallet_address || '',
                post.id || '',
                post.funding_meta?.current_amount || '0',
                post.funding_meta?.target_amount || '0'
              )
            }
          >
            <Text className='text-white font-bold'>Donate</Text>
          </TouchableOpacity>
        )}
      </Card>
    )
  } else if (post.post_type === 'TOKEN_CALL' && post.token_meta) {
    contentBlock = (
      <Card>
        <SectionTitle>Token Call</SectionTitle>
        <View className='flex-row items-center mb-2'>
          {post.token_meta.logo_url && (
            <Image
              source={{ uri: post.token_meta.logo_url }}
              className='w-14 h-14 rounded-full mr-3 bg-dark-300 border border-dark-300'
            />
          )}
          <View>
            <Text className='text-white font-bold text-base leading-tight'>
              {post.token_meta.token_name}{' '}
              <Text className='text-gray-400'>
                ({post.token_meta.token_symbol})
              </Text>
            </Text>
            {post.token_meta.launch_date && (
              <Text className='text-gray-500 text-xs mt-0.5'>
                Launch:{' '}
                {new Date(post.token_meta.launch_date).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
        <Text className='text-white text-base leading-relaxed mb-1'>
          {post.content}
        </Text>
        {post.media?.length ? (
          <View className='mt-3'>
            <MediaGallery media={post.media} maxItems={4} />
          </View>
        ) : null}
        {post.token_meta.description && (
          <Text className='text-gray-200 text-xs mb-1'>
            {post.token_meta.description}
          </Text>
        )}
        <View className='flex-row flex-wrap gap-2 mb-2'>
          {post.token_meta.initial_price && (
            <Text className='text-white text-xs mr-2'>
              Initial: ${post.token_meta.initial_price}
            </Text>
          )}
          {post.token_meta.target_price && (
            <Text className='text-white text-xs mr-2'>
              Target: ${post.token_meta.target_price}
            </Text>
          )}
          {post.token_meta.market_cap && (
            <Text className='text-white text-xs mr-2'>
              MC: ${post.token_meta.market_cap}
            </Text>
          )}
        </View>
        <TouchableOpacity
          className='bg-primary-500 rounded-xl py-2 px-6 self-start mt-2'
          activeOpacity={0.92}
          onPress={() =>
            handleTokenSwap(
              post.token_meta?.token_address || '',
              post.token_meta?.token_symbol || '',
              post.token_meta?.token_name || ''
            )
          }
        >
          <Text className='text-white font-bold'>Buy</Text>
        </TouchableOpacity>
      </Card>
    )
  }

  // Engagement row (likes, comments, share)
  const engagementRow = (
    <View className='flex-row items-center justify-between mt-2 mb-4'>
      <View className='flex-row items-center'>
        <TouchableOpacity className='flex-row items-center mr-4'>
          <Ionicons
            name={post.like?.status ? 'heart' : 'heart-outline'}
            size={22}
            color={post.like?.status ? '#ef4444' : '#475569'}
            onPress={() => handleLike()}
          />
          <Text className='text-gray-400 text-xs ml-1'>{post._count.like}</Text>
        </TouchableOpacity>
        <TouchableOpacity className='flex-row items-center mr-4'>
          <Ionicons name='chatbubble-outline' size={20} color='#475569' />
          <Text className='text-gray-400 text-xs ml-1'>
            {post._count.comment}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className='flex-row items-center'>
          <Ionicons name='arrow-redo-outline' size={20} color='#475569' />
          <Text className='text-gray-400 text-xs ml-1'>Share</Text>
        </TouchableOpacity>
      </View>
      <View>
        <TouchableOpacity
          onPress={() => {
            router.push({
              pathname: '/(modals)/send',
              params: { recipient: post.user.wallets.address },
            })
          }}
          className='flex-row items-center mr-2'
        >
          <Ionicons name='cash-outline' size={20} color='#475569' />
        </TouchableOpacity>
      </View>
    </View>
  )

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

  // Copy wallet address handler
  const handleCopyWallet = async (address: string) => {
    try {
      await Clipboard.setStringAsync(address)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (e) {
      // Optionally handle error
    }
  }

  // Router function to redirect to Swap Modal with token details
  function handleTokenSwap(
    tokenAddress: string,
    tokenSymbol: string,
    tokenName: string
  ) {
    router.push({
      pathname: '/(screens)/swap',
      params: {
        outputToken: token ? JSON.stringify(token) : '',
        tokenSymbol,
        tokenName,
      },
    })
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
          {userHeader}
          {contentBlock}
        </Card>
        <Divider />
        {engagementRow}
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
