import axiosClient from '#/api/axiosClient'                                                                                                             
import { createAdminUser, getAdminPostList, getAdminUserList, updateAdminUser } from '#/api/userApi'                                                    
import type { Post, ValidatePostRequest } from '#/types/post'                                                                                           
import type { Response } from '#/types/response'                                                                                                        
import type { Statistics } from '#/types/statistic'                                                                                                     
import type { CreateUserRequest, UpdateUserRequest } from '#/types/user'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'                                                                           
import toast from 'react-hot-toast'
                                                                                                                                                        
                
//Super admin manage users                                                                                                                              
export function useGetUserList(search?: string) {
  return useQuery({                                                                                                                                     
    queryKey: ['user-list', search],
    queryFn: () => getAdminUserList(search),                                                                                                            
  })                                                                                                                                                    
}
                                                                                                                                                        
export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUserRequest) => createAdminUser(payload),
    onSuccess: () => {                                                                                                                                  
      toast.success('Tạo người dùng thành công')
      queryClient.invalidateQueries({ queryKey: ['user-list'] })                                                                                        
    },          
  })                                                                                                                                                    
}               

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateUserRequest) => updateAdminUser(id, payload),                                                                
    onSuccess: () => {
      toast.success('Cập nhật thành công')                                                                                                              
      queryClient.invalidateQueries({ queryKey: ['user-list'] })                                                                                        
    },
  })                                                                                                                                                    
}               

export function useDeleteUser() {                                                                                                                       
  const queryClient = useQueryClient()
  return useMutation({                                                                                                                                  
    mutationFn: (id: string) => axiosClient.delete<Response<undefined>>(`/admin/users/${id}`).then((res) => res.data),
    onSuccess: () => {                                                                                                                                  
      toast.success('Xóa người dùng thành công')
      queryClient.invalidateQueries({ queryKey: ['user-list'] })                                                                                        
    },          
  })                                                                                                                                                    
}               

//export users pdf                                                                                                                                      
export async function exportUsersPdf(): Promise<void> {
  const response = await axiosClient.get('/admin/user/export-pdf', {                                                                                    
    responseType: 'blob',                                                                                                                               
  })
                                                                                                                                                        
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url                                                                                                                                       
  link.download = 'users.pdf'
  link.click()                                                                                                                                          
  URL.revokeObjectURL(url)
}                                                                                                                                                       
 
//export posts pdf                                                                                                                                      
export async function exportPostsPdf(): Promise<void> {
  const response = await axiosClient.get('/admin/post/export-pdf', {
    responseType: 'blob',
  })                                                                                                                                                    
 
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))                                                               
  const link = document.createElement('a')
  link.href = url
  link.download = 'posts.pdf'
  link.click()                                                                                                                                          
  URL.revokeObjectURL(url)
}                                                                                                                                                       
                
//export reports pdf
export async function exportReportsPdf(): Promise<void> {
  const response = await axiosClient.get('/admin/report/export-pdf', {                                                                                  
    responseType: 'blob',
  })                                                                                                                                                    
                
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))                                                               
  const link = document.createElement('a')
  link.href = url                                                                                                                                       
  link.download = 'reports.pdf'
  link.click()
  URL.revokeObjectURL(url)
}                                                                                                                                                       
 
//export statistics pdf                                                                                                                                 
export async function exportStatisticsPdf(): Promise<void> {
  const response = await axiosClient.get('/admin/statistic/export-pdf', {
    responseType: 'blob',
  })                                                                                                                                                    
 
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))                                                               
  const link = document.createElement('a')
  link.href = url
  link.download = 'statistics.pdf'
  link.click()                                                                                                                                          
  URL.revokeObjectURL(url)
}                                                                                                                                                       
                

//Admin manage posts
export function useGetPostList() {
  return useQuery({                                                                                                                                     
    queryKey: ['post-list'],
    queryFn: () => getAdminPostList(),                                                                                                                  
  })            
}

export function useValidatePost() {                                                                                                                     
  const queryClient = useQueryClient()
  return useMutation({                                                                                                                                  
    mutationFn: (payload: ValidatePostRequest) =>
      axiosClient.put<Response<undefined>>(`/admin/post/${payload.id}/validate`, payload),
    onSuccess: () => {                                                                                                                                  
      queryClient.invalidateQueries({ queryKey: ['post-list'] })
    },                                                                                                                                                  
  })            
}

//get statistics                                                                                                                                        
export function useGetStatistics() {
  return useQuery({                                                                                                                                     
    queryKey: ['statistics'],
    queryFn: () => axiosClient.get<Statistics>('/admin/statistic'),
  })                                                                                                                                                    
}