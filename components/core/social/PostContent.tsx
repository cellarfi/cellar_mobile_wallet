import { Post } from '@/types/posts.interface'
import React from 'react'
import { Text, View } from 'react-native'
import DonationCard from './DonationCard'
import MediaGallery from './MediaGallery'
import TokenCallCard from './TokenCallCard'

interface PostContentProps {
  post: Post
}

const PostContent = React.memo(({ post }: PostContentProps) => {
  const renderRegularPost = () => (
    <View className='mb-2'>
      <Text className='text-gray-100 text-base'>{post.content}</Text>
      {post.media && post.media.length > 0 && (
        <View className='mt-2'>
          <MediaGallery media={post.media} />
        </View>
      )}
    </View>
  )

  const renderDonationPost = () => (
    <View>
      {/* Post text content */}
      <Text className='text-gray-100 text-base mb-3'>{post.content}</Text>
      {/* Media gallery */}
      {post.media && post.media.length > 0 && (
        <View className='mb-3'>
          <MediaGallery media={post.media} />
        </View>
      )}
      {/* Donation Card */}
      {post.funding_meta && <DonationCard funding_meta={post.funding_meta} />}
    </View>
  )

  const renderTokenCallPost = () => (
    <View>
      {/* Post text content */}
      <Text className='text-gray-100 text-base mb-3'>{post.content}</Text>
      {/* Media gallery */}
      {post.media && post.media.length > 0 && (
        <View className='mb-3'>
          <MediaGallery media={post.media} />
        </View>
      )}
      {/* Token Call Card */}
      {post.token_meta && <TokenCallCard token_meta={post.token_meta} />}
    </View>
  )

  switch (post.post_type) {
    case 'REGULAR':
      return renderRegularPost()
    case 'DONATION':
      return post.funding_meta ? renderDonationPost() : renderRegularPost()
    case 'TOKEN_CALL':
      return post.token_meta ? renderTokenCallPost() : renderRegularPost()
    default:
      return renderRegularPost()
  }
})

PostContent.displayName = 'PostContent'

export default PostContent
