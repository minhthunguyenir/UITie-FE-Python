import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { setAuth } from '#/lib/auth'
import axiosClient from '#/api/axiosClient'
import toast from 'react-hot-toast'
import type { LoginRequest, LoginResponse } from '#/types/user'
import type { Response } from '#/types/response'


export function useLogin() { // -> hook, call api, quản lí state, data, loading, error, isFetching, refetch,...
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (payload: LoginRequest) =>
      axiosClient.post<Response<LoginResponse>>('/login', payload),
    onSuccess: (data) => {
      if (!data.data.data.token) {
        toast.error(data.data.message || 'Đăng nhập thất bại')
        return
      }
      setAuth(data.data.data.token, data.data.data.user)
      if(data.data.data.user.role === 'Admin' || data.data.data.user.role === 'Super Admin') {
        navigate({ to: '/admin' })
        return
      }
      navigate({ to: '/dashboard' })
    },
    onError: (error: any) => {
      const status = error?.response?.status
      if (status !== 403) {
        toast.error(error?.response?.data?.message || 'Đăng nhập thất bại')
      }
    },
  })
}