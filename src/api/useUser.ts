import { getUser } from "#/lib/auth"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { searchUser, lockUser, unlockUser } from "./userApi"
import type { LockUserPayload } from "./userApi" 
import { toast } from "react-hot-toast"


// HOOK tìm kiếm người dùng
export const useSearchUser = (keyword?: string) => {
  return useQuery({
    queryKey: ['user', 'search', keyword],
    queryFn: () => searchUser(keyword),
  })
}

// ==========================================
// --- HOOKS DÀNH CHO ADMIN ---
// ==========================================

/**
 * Hook khóa tài khoản kèm lý do nhập tay
 */
export const useLockUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    // Nhận vào id của user cần khóa và cái object chứa lý do (reason) nhập tay
    mutationFn: ({ userId, payload }: { userId: string | number; payload: LockUserPayload }) => 
      lockUser(userId, payload),
    onSuccess: () => {
      // Làm tươi lại danh sách hoặc kết quả tìm kiếm user trên màn hình Admin Admin Dashboard
      queryClient.invalidateQueries({ queryKey: ['user'] })
      toast.success('Khóa tài khoản người dùng thành công!')
    },
    onError: (error: any) => {
      // Hiện câu lỗi từ Laravel Backend truyền lên (nếu có)
      const serverMessage = error?.response?.data?.message
      toast.error(serverMessage || 'Khóa tài khoản thất bại.')
    }
  })
}

/**
 * Hook mở khóa tài khoản người dùng
 */
export const useUnlockUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    // Mở khóa thì chỉ cần truyền duy nhất cái id của user đó lên thôi
    mutationFn: (userId: string | number) => unlockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      toast.success('Mở khóa tài khoản người dùng thành công!')
    },
    onError: (error: any) => {
      const serverMessage = error?.response?.data?.message
      toast.error(serverMessage || 'Mở khóa tài khoản thất bại.')
    }
  })
}