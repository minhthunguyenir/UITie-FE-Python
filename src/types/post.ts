export interface AttachmentPayload {
  file_url: string
  file_type: 'Image' | 'Video' | 'Document'
  file_name: string
}

export interface CreatePostPayload {
  content?: string
  visibility?: 'Public' | 'Private'
  category_id?: number
  attachments?: AttachmentPayload[]
}

  export interface UpdatePostPayload {
    content?: string
    visibility?: 'Public' | 'Private'
    category_id?: number
    attachments?: AttachmentPayload[]
  }

  export interface Attachment {
    id: number
    file_type: 'Image' | 'Video' | 'Document'
    file_name: string | null
    view_url: string
    file_url: string
  }
  
  export interface Post {
    id: number
    content: string | null
    visibility: 'Public' | 'Private'
    status: 'Pending' | 'Accepted' | 'Rejected'
    is_edited: boolean
    created_at: string
    updated_at: string
    author: {
      id: number
      full_name: string
      email: string
    }
    category: {
      id: number
      category_name: string
    } | null
    likes: number
    comments: number
    shares: number
    liked: boolean
    attachments?: Attachment[]
  }

export interface ValidatePostRequest {
  id: number
  status: 'Accepted' | 'Rejected'
  reject_reason?: string
}