export interface DmConversation {
  user: { id: number; full_name: string }
  last_message: { content: string | null; created_at: string } | null
}

export interface GroupChat {
  id: number
  group_name: string
  created_by: number
  member_count: number
  my_status: 'Pending' | 'Accepted'
  last_message: {
    content: string | null
    created_at: string
    sender: { id: number; full_name: string } | null
  } | null
  created_at: string
}

export interface ChatAttachment {
  id: number
  file_name: string
  file_type: 'Image' | 'Video' | 'Document'
  view_url: string
}

export interface ChatMessage {
  id: number
  content: string | null
  sender: { id: number; full_name: string }
  attachments: ChatAttachment[]
  created_at: string
}

export interface GroupMember {
  id: number
  user: { id: number; full_name: string }
  status: 'Pending' | 'Accepted' | 'Rejected'
  joined_at: string | null
}

export interface GroupDetail {
  id: number
  group_name: string
  created_by: number
  my_status: 'Pending' | 'Accepted'
  members: GroupMember[]
}

export type ActiveConversation =
  | { type: 'dm'; userId: number }
  | { type: 'group'; groupId: number }
