import { useQuery } from '@tanstack/react-query'
import axiosClient from '#/api/axiosClient'

export interface TrendingCategory {
  id: number
  category_name: string
  posts_count: number
}

export function useTrendingCategories() {
  return useQuery({
    queryKey: ['trendingCategories'],
    queryFn: async () => {
      const res = await axiosClient.get('/categories/trending')
      return res.data.data as TrendingCategory[]
    },
  })
}
