import type {
  ChatMessage,
  DmConversation,
  GroupChat,
  GroupDetail,
  GroupMember,
} from '#/types/chat'
import axiosClient from '#/api/axiosClient'

interface MessagePayload {
  content?: string
  attachments?: Array<{ file_url: string; file_type: string; file_name: string }>
}

interface PaginatedMessages {
  data: ChatMessage[]
  meta: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}

// ── DM Conversations ────────────────────────────────────────────────

export const fetchConversations = (): Promise<DmConversation[]> =>
  axiosClient.get('/conversations').then((r) => r.data.data)

export const fetchDmMessages = (userId: number, page = 1): Promise<PaginatedMessages> =>
  axiosClient
    .get(`/conversations/${userId}/messages`, { params: { page } })
    .then((r) => ({ data: r.data.data, meta: r.data.meta }))

export const sendDmMessage = (
  userId: number,
  payload: MessagePayload,
): Promise<ChatMessage> =>
  axiosClient.post(`/conversations/${userId}/messages`, payload).then((r) => r.data.data)

// ── Group Chats ──────────────────────────────────────────────────────

export const fetchGroups = (): Promise<GroupChat[]> =>
  axiosClient.get('/groups').then((r) => r.data.data)

export const createGroup = (payload: {
  group_name: string
  member_ids?: number[]
}): Promise<GroupChat> => axiosClient.post('/groups', payload).then((r) => r.data.data)

export const fetchGroupDetail = (id: number): Promise<GroupDetail> =>
  axiosClient.get(`/groups/${id}`).then((r) => r.data.data)

export const deleteGroup = (id: number): Promise<void> =>
  axiosClient.delete(`/groups/${id}`).then(() => undefined)

export const fetchGroupMessages = (id: number, page = 1): Promise<PaginatedMessages> =>
  axiosClient
    .get(`/groups/${id}/messages`, { params: { page } })
    .then((r) => ({ data: r.data.data, meta: r.data.meta }))

export const sendGroupMessage = (
  id: number,
  payload: MessagePayload,
): Promise<ChatMessage> =>
  axiosClient.post(`/groups/${id}/messages`, payload).then((r) => r.data.data)

export const inviteMember = (
  groupId: number,
  userId: number,
): Promise<GroupMember> =>
  axiosClient
    .post(`/groups/${groupId}/members`, { user_id: userId })
    .then((r) => r.data.data)

export const removeMember = (groupId: number, userId: number): Promise<void> =>
  axiosClient.delete(`/groups/${groupId}/members/${userId}`).then(() => undefined)

export const joinGroup = (id: number): Promise<void> =>
  axiosClient.post(`/groups/${id}/join`).then(() => undefined)

export const rejectGroup = (id: number): Promise<void> =>
  axiosClient.post(`/groups/${id}/reject`).then(() => undefined)

export const leaveGroup = (id: number): Promise<void> =>
  axiosClient.delete(`/groups/${id}/leave`).then(() => undefined)
