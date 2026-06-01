export type ReportStatus = 'Pending' | 'Resolved' | 'Dismissed'
export type ReportTargetType = 'Post' | 'User' | 'Comment'

export interface Report {
  id: number
  reason: string
  status: ReportStatus
  target_type: ReportTargetType
  created_at: string
  reporter: {
    id: number
    full_name: string
    email: string
  }
  target: {
    id: number
    full_name: string
    email: string
  } | null
  
  resolver: {
    id: number
    full_name: string
    email: string
  } | null,

  reported_user: {
    id: number
    full_name: string
  } | null  
  reported_post: {
    id: number
    content: string
  } | null
}