import type { User, CreateUserRequest, UpdateUserRequest } from "#/types/user"
import type { Pagination, Response } from "#/types/response"
import axiosClient from "./axiosClient"
import type { Post } from "#/types/post"

export const searchUser = async (keyword?: string): Promise<Pagination<User[]>> => {
  const res = await axiosClient.get<Pagination<User[]>>('/user/search', { params: { keyword } })
  return res.data
}

export const getAdminUserList = async (search?: string): Promise<Response<User[]>> => {
  const res = await axiosClient.get<Response<User[]>>('/super-admin/user', { params: search ? { search } : undefined })
  return res.data
}

export const createAdminUser = async (payload: CreateUserRequest): Promise<Response<undefined>> => {
  const res = await axiosClient.post<Response<undefined>>('/super-admin/user', payload)
  return res.data
}

export const updateAdminUser = async (id: string, payload: Omit<UpdateUserRequest, 'id'>): Promise<Response<undefined>> => {
  const res = await axiosClient.put<Response<undefined>>(`/super-admin/user/${id}`, payload)
  return res.data
}

export const getAdminPostList = async (search?: string): Promise<Response<Post[]>> => {
  const res = await axiosClient.get<Response<Post[]>>('/admin/post', { params: search ? { search } : undefined })
  return res.data
}

/**
 * Khóa tài khoản kèm lý do nhập tay
 */
export interface LockUserPayload {
  reason: string
}
export const lockUser = async (id: string | number, payload: LockUserPayload): Promise<Response<undefined>> => {
  const res = await axiosClient.put<Response<undefined>>(`/admin/user/${id}/lock`, payload)
  return res.data
}

/**
 * Mở khóa tài khoản
 */
export const unlockUser = async (id: string | number): Promise<Response<undefined>> => {
  const res = await axiosClient.put<Response<undefined>>(`/admin/user/${id}/unlock`)
  return res.data
}