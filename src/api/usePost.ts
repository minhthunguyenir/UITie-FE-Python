import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosClient from './axiosClient'
import type { Post, CreatePostPayload } from '#/types/post'

// 1. Lấy danh sách bài viết trên feed
export const useFeedPosts = (scope: 'all' | 'following' = 'all') => {
  return useQuery({
    queryKey: ['feedPosts', scope],
    queryFn: async () => {
      const res = await axiosClient.get(`/posts/?scope=${scope}`)
      // Django DRF trả về format { data: [...] } theo quy tắc bắt buộc
      return res.data?.data || []
    },
  })
}

// 2. Tạo bài viết mới
export const useCreatePost = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreatePostPayload) => {
      const res = await axiosClient.post('/posts/', payload)
      return res.data
    },
    onSuccess: () => {
      // Refresh lại danh sách trên Dashboard sau khi đăng bài
      queryClient.invalidateQueries({ queryKey: ['feedPosts'] })
    },
  })
}

// 3. Cập nhật bài viết
export const useUpdatePost = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number, payload: CreatePostPayload }) => {
      const res = await axiosClient.put(`/posts/${id}`, payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedPosts'] })
    },
  })
}

// 4. Xóa bài viết
export const useDeletePost = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await axiosClient.delete(`/posts/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedPosts'] })
    },
  })
}

// 5. Like/Bỏ Like bài viết
export const useToggleLike = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (postId: number) => {
      const res = await axiosClient.post(`/posts/${postId}/like`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedPosts'] })
    },
  })
}

// 6. Chia sẻ bài viết
export const useSharePost = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, content }: { id: number, content: string }) => {
      const res = await axiosClient.post(`/posts/${id}/share`, { content })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedPosts'] })
    },
  })
}