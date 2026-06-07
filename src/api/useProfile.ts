import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosClient from '#/api/axiosClient' 

// Hook lấy thông tin Profile
export function useProfile(userId?: string | number) {
  return useQuery({
    queryKey: ['profile', userId || 'me'],
    queryFn: async () => {
      // Cập nhật URL gọi về API Backend bằng các route mới: `/profile` và `/profile/{id}`
      const url = userId ? `/profile/${userId}` : '/profile'
      
      const response = await axiosClient.get(url)
      // Với Django DRF, chúng ta đã bọc kết quả trả về trong key "data" -> nên phải lấy .data.data
      return response.data.data
    },
  })
}

// Hook cập nhật thông tin Profile
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await axiosClient.put('/profile', payload)
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
      // Lấy danh sách bài viết theo user_id qua endpoint Feed (đã thêm filter trong GET /posts/)
      const response = await axiosClient.get(`/posts/`, { params: { user_id: userId } })
      return response.data?.data || []
    },
    enabled: !!userId,
  })
}

// Hook xử lý chức năng Follow / Unfollow
export function useToggleFollow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string | number) => {
      const response = await axiosClient.post(`/profile/${userId}/follow`)
      return response.data
    },
    onSuccess: (_, variables) => {
      // Làm mới lại query profile để UI tự cập nhật số Follower và trạng thái nút bấm
      queryClient.invalidateQueries({ queryKey: ['profile', String(variables)] })
      queryClient.invalidateQueries({ queryKey: ['profile', variables] })
    },
  })
}
