import { useQuery } from '@tanstack/react-query'
import axiosClient from '#/api/axiosClient'

export interface SuggestedUser {
  id: number
  full_name: string
  avatar?: string
  match_score: number
  faculty?: string
  class_name?: string
  academic_year?: string
}

export function useSuggestedFollows() {
  return useQuery({
    queryKey: ['suggestedFollows'],
    queryFn: async () => {
      const res = await axiosClient.get('/users/suggested-follows')
      return res.data.data as SuggestedUser[]
    },
  })
}
