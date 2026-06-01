import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPost, deletePost, fetchFeed, searchPost, updatePost, toggleLike, sharePost } from './postApi'
import type { CreatePostPayload, Post, UpdatePostPayload } from '#/types/post'

export const useFeedPosts = (scope: 'all' | 'following' = 'all') => {
  return useQuery({
    queryKey: ['post', 'feed', scope], // 🚩 Thêm scope vào đây để tự động fetch lại khi đổi tab
    queryFn: () => fetchFeed(scope),   // 🚩 Truyền scope sang cho file postApi xử lý
  })
}

export const useSearchPost = (keyword?: string) => {
  return useQuery({
    queryKey: ['post', 'search', keyword],
    queryFn: () => searchPost(keyword),
  })
}

export const useCreatePost = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePostPayload) => createPost(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', 'feed'] })
    },
  })
}

export const useToggleLike = () => {
  return useMutation({
    mutationFn: (id: number) => toggleLike(id),
  })
}

export const useSharePost = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, content }: { id: number; content?: string }) => sharePost(id, content),
    onSuccess: () => {
      // Cập nhật lại Feed để hiển thị bài Share mới ngay lập tức
      queryClient.invalidateQueries({ queryKey: ['post', 'feed'] })
    },
  })
}

export const useUpdatePost = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePostPayload }) =>
      updatePost(id, payload),
    onSuccess: (data, variables) => {
      queryClient.setQueryData<Post[]>(['post', 'feed'], (old) =>
        old
          ? old.map((p) =>
              p.id === variables.id ? { ...p, ...data.data } : p,
            )
          : old,
      )
      queryClient.invalidateQueries({ queryKey: ['post', 'feed'] })
      queryClient.invalidateQueries({ queryKey: ['post', 'search'] })
    },
  })
}

export const useDeletePost = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', 'feed'] })
      queryClient.invalidateQueries({ queryKey: ['post', 'search'] })
    },
  })
}