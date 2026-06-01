import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getReportList, validateReport, createReport } from './reportApi'
import type { ReportStatus } from '#/types/report'
import { toast } from 'react-hot-toast'

// Hook lấy danh sách báo cáo (Dành cho Admin)
export const useGetReportList = () => {
  return useQuery({
    queryKey: ['report', 'list'],
    queryFn: () => getReportList(),
  })
}

// Hook phê duyệt/xử lý báo cáo (Dành cho Admin)
export const useValidateReport = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reportId, status }: { reportId: number; status: ReportStatus }) => 
      validateReport(reportId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', 'list'] })
      toast.success('Cập nhật trạng thái báo cáo thành công!')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật trạng thái.')
    }
  })
}

// Hook gửi báo cáo mới (Dành cho Người dùng)
export const useCreateReport = () => {
  const queryClient = useQueryClient()

  return useMutation({
    // Nhận object từ Form giao diện truyền vào
    mutationFn: ({ post_id, reason }: { post_id: number | string; reason: string }) => 
      createReport(post_id, { reason }), // Rã bọc: truyền post_id làm URL, reason làm body
    onSuccess: () => {
      // Làm mới danh sách báo cáo bên Admin và danh sách bài viết ngoài Feed sinh viên
      queryClient.invalidateQueries({ queryKey: ['report', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.success('Gửi báo cáo vi phạm thành công!')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Gửi báo cáo thất bại.')
    },
  })
}