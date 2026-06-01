import axiosClient from './axiosClient'
import type { Pagination } from '#/types/response'
import type { Report, ReportStatus } from '#/types/report'

// --- API dành cho Admin ---
export const getReportList = async (): Promise<Pagination<Report[]>> => {
  const res = await axiosClient.get<Pagination<Report[]>>('/admin/report')
  return res.data
}

export const validateReport = async (reportId: number, status: ReportStatus): Promise<void> => {
  const res = await axiosClient.put<void>(`/admin/report/${reportId}/validate`, { status })
  return res.data
}

// --- API dành cho Người dùng (Thêm mới) ---
// 1. Báo cáo BÀI VIẾT (Khớp với Route::prefix('post'))
export const createReport = async (
  postId: number | string, 
  payload: { reason: string }
): Promise<any> => {
  const res = await axiosClient.post(`/post/${postId}/report`, payload)
  return res.data
}

// 2. Báo cáo TÀI KHOẢN VI PHẠM (Khớp với Route::prefix('user'))
export const createUserReport = async (
  userId: number | string, 
  payload: { reason: string }
): Promise<any> => {
  const res = await axiosClient.post(`/user/${userId}/report`, payload)
  return res.data
}

// Gom tất cả vào một đối tượng để dễ quản lý
export const reportApi = {
  getReportList,
  validateReport,
  createReport,
  createUserReport, 
}