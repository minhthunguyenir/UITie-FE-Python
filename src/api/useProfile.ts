import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosClient from '#/api/axiosClient' 

// Hook lấy thông tin Profile
export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ['profile', userId || 'me'],
    queryFn: async () => {
      // Nếu có userId thì gọi `/user/{id}`, nếu không thì gọi `/user/profile` lấy của chính mình
      const url = userId ? `/user/${userId}` : '/user/profile'
      
      const response = await axiosClient.get(url)
      // Backend trả về thẳng object user, lấy luôn response.data chứ không lấy .data.data nha Thư
      return response.data
    },
  })
}

// Hook cập nhật thông tin Profile
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await axiosClient.put('/user/profile', payload)
      return response.data
    },
    onSuccess: () => {
      // Khi cập nhật thành công, xóa cache để useQuery tự động fetch lại data mới
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

// Hook lấy danh sách bài viết của user
export function useUserPosts(userId?: string | number) {
  return useQuery({
    queryKey: ['user-posts', userId],
    queryFn: async () => {
      if (!userId) return []
      const response = await axiosClient.get(`/users/${userId}/posts`)
      return response.data.data
    },
    enabled: !!userId,
  })
}
