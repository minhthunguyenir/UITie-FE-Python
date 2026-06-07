import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosClient from '#/api/axiosClient'

export function useGetComments(postId: number) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/posts/${postId}/comments`)
      return data.data
    },
    enabled: !!postId,
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { post_id: number; content?: string; parent_comment_id?: number; attachments?: any[] }) => {
      const { data } = await axiosClient.post(`/posts/${payload.post_id}/comments`, payload)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.post_id] })
    },
  })
}

export function useUpdateComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, post_id, payload }: { id: number; post_id: number; payload: any }) => {
      const { data } = await axiosClient.put(`/posts/comments/${id}`, payload)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.post_id] })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, post_id }: { id: number; post_id: number }) => {
      const { data } = await axiosClient.delete(`/posts/comments/${id}`)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.post_id] })
    },
  })
}