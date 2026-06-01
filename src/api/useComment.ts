import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axiosClient from '#/api/axiosClient'
import type { Comment } from '#/types/comment'

export function useGetComments(postId: number) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const res = await axiosClient.get(`/posts/${postId}/comments`)
      return res.data.data as Comment[]
    },
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { post_id: number; content: string; parent_comment_id?: number }) => {
      const res = await axiosClient.post(`/comments`, payload)
      return res.data
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['comments', variables.post_id] })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { id: number; post_id: number }) => {
      const res = await axiosClient.delete(`/comments/${payload.id}`)
      return res.data
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['comments', variables.post_id] })
    },
  })
}