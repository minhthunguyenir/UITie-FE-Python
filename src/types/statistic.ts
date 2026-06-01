export interface Statistics {
  users: number
  reports: number
  posts: number
  postByCategory: {
    category_name: string
    total: string
  }[]
}
