import { commentsRequests } from '@/libs/api_requests/comments.request'
import {
  usePostDetailsStore,
  useSocialEventsStore,
} from '@/store/socialEventsStore'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function CreateCommentModal() {
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { postId } = useLocalSearchParams()
  const triggerRefresh = useSocialEventsStore((state) => state.triggerRefresh)
  const triggerPostDetailsRefresh = usePostDetailsStore(
    (state) => state.triggerRefresh
  )

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await commentsRequests.createComment({
        postId: postId as string,
        text: comment,
      })
      if (res.success) {
        triggerRefresh()
        triggerPostDetailsRefresh()
        router.back()
      } else {
        setError(res.message || 'Failed to add comment')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to add comment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-dark-50 px-6 justify-center'>
      <View className='bg-dark-200 rounded-2xl p-6'>
        <Text className='text-white text-xl font-bold mb-4'>Add Comment</Text>
        <TextInput
          className='bg-dark-300 text-white rounded-xl px-4 py-3 mb-4'
          placeholder='Write a comment...'
          placeholderTextColor='#888'
          multiline
          value={comment}
          onChangeText={setComment}
          style={{ minHeight: 60 }}
        />
        {error && <Text className='text-red-500 mb-2'>{error}</Text>}
        <TouchableOpacity
          className='bg-primary-500 rounded-xl py-3 items-center'
          onPress={handleSubmit}
          disabled={loading || !comment.trim()}
        >
          {loading ? (
            <ActivityIndicator color='#fff' />
          ) : (
            <Text className='text-white font-semibold'>Comment</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          className='absolute top-4 right-4'
          onPress={() => router.back()}
        >
          <Ionicons name='close' size={24} color='#fff' />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
