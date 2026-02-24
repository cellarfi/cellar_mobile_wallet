import { Post } from '@/types/posts.interface'
import { apiResponse, httpRequest } from '../api.helpers'

export const PostsRequests = {
  createPost: async (payload: any) => {
    try {
      const api = httpRequest()
      const response = await api.post(`/posts`, payload)
      return apiResponse(true, 'Post created', response.data.data)
    } catch (err: any) {
      console.log('Error creating post:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error while creating post',
        err
      )
    }
  },

  updatePost: async (payload: { id: string; content: string }) => {
    try {
      const api = httpRequest()
      const response = await api.patch(`/posts`, payload)
      return apiResponse(true, 'Post updated', response.data.data)
    } catch (err: any) {
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error while updating post',
        err
      )
    }
  },

  deletePost: async (id: string) => {
    try {
      const api = httpRequest()
      const response = await api.delete(`/posts/${id}`)
      return apiResponse(true, 'Post deleted', response.data)
    } catch (err: any) {
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error while deleting post',
        err
      )
    }
  },

  getPosts: async (page: string) => {
    try {
      const api = httpRequest()
      const response = await api.get(
        `/posts?${new URLSearchParams({ page: page, pageSize: '10' })}`
      )
      // console.log(
      //   'posts fetched successfully',
      //   (response.data.data as Post[]).slice(0, 3)
      // )
      return apiResponse<Post[]>(
        true,
        'posts fetched successfully',
        response.data.data
      )
    } catch (err: any) {
      console.log('Error fetching address book entries:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error fetching posts entries',
        err
      )
    }
  },

  trendingPosts: async (page: string) => {
    try {
      const api = httpRequest()
      const response = await api.get(
        `/posts/trending?${new URLSearchParams({ page: page, pageSize: '10' })}`
      )
      return apiResponse<Post[]>(
        true,
        'trending posts fetched successfully',
        response.data.data
      )
    } catch (err: any) {
      console.log('Error fetching trending posts:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error fetching posts entries',
        err
      )
    }
  },

  followingPosts: async (page: string) => {
    try {
      const api = httpRequest()
      const response = await api.get(
        `/follows/posts?${new URLSearchParams({ page: page, pageSize: '10' })}`
      )
      return apiResponse<Post[]>(
        true,
        'trending posts fetched successfully',
        response.data.data
      )
    } catch (err: any) {
      console.log('Error fetching trending posts:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error fetching posts entries',
        err
      )
    }
  },

  getUserPosts: async (
    tagName: string,
    page: string = '1',
    pageSize: string = '10'
  ) => {
    try {
      const api = httpRequest()
      const response = await api.get(
        `/posts/user/${tagName}?${new URLSearchParams({ page, pageSize })}`
      )
      return apiResponse<Post[]>(
        true,
        'user posts fetched successfully',
        response.data.data,
        response.data.pagination
      )
    } catch (err: any) {
      console.log('Error fetching user posts:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error fetching user posts',
        err
      )
    }
  },

  getPost: async (id: string, page: string) => {
    try {
      const api = httpRequest()
      const response = await api.get(
        `/posts/${id}?${new URLSearchParams({ page: page, pageSize: '10' })}`
      )
      return apiResponse<Post>(
        true,
        'post fetched successfully',
        response.data.data
      )
    } catch (err: any) {
      console.log('Error fetching address book entries:', err?.response?.data)
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error fetching address book entries',
        err
      )
    }
  },

  searchPosts: async (query: string, type?: string) => {
    try {
      const api = httpRequest()
      const response = await api.get(
        `/posts/search?query=${encodeURIComponent(query)}${type ? `&type=${type}` : ''}`
      )
      return apiResponse(
        true,
        'posts search fetched successfully',
        response.data.data
      )
    } catch (err: any) {
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error searching posts',
        err
      )
    }
  },

  likePost: async (id: string) => {
    try {
      const api = httpRequest()
      const response = await api.post(`/posts/likes/${id}`)
      return apiResponse(true, 'post liked successfully', response.data.data)
    } catch (err: any) {
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error liking post',
        err
      )
    }
  },

  unlikePost: async (id: string, post_id: string) => {
    const payload = {
      id,
      post_id,
    }
    try {
      const api = httpRequest()
      const response = await api.delete('/posts/likes', { data: payload })
      return apiResponse(true, 'post unliked successfully', response.data.data)
    } catch (err: any) {
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error unliking post',
        err
      )
    }
  },

  incrementFundingAmount: async (postId: string, amount: number) => {
    try {
      const api = httpRequest()
      const response = await api.patch(`/posts/${postId}/increment-funding`, {
        amount,
      })
      return apiResponse(true, 'Funding amount updated', response.data.data)
    } catch (err: any) {
      return apiResponse(
        false,
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Error updating funding amount',
        err
      )
    }
  },
}
