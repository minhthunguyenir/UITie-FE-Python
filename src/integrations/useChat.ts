import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createGroup,
  deleteGroup,
  fetchConversations,
  fetchDmMessages,
  fetchGroupDetail,
  fetchGroupMessages,
  fetchGroups,
  inviteMember,
  joinGroup,
  leaveGroup,
  rejectGroup,
  removeMember,
  sendDmMessage,
  sendGroupMessage,
} from './chatApi'

// ── DM Conversations ────────────────────────────────────────────────

export function useDmConversations() {
  return useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: fetchConversations,
  })
}

export function useDmMessages(userId: number | null) {
  return useQuery({
    queryKey: ['chat', 'dm', userId],
    queryFn: () => fetchDmMessages(userId!),
    enabled: userId !== null,
  })
}

export function useSendDmMessage(userId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      content?: string
      attachments?: Array<{ file_url: string; file_type: string; file_name: string }>
    }) => sendDmMessage(userId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat', 'dm', userId] })
      void qc.invalidateQueries({ queryKey: ['chat', 'conversations'] })
    },
  })
}

// ── Group Chats ──────────────────────────────────────────────────────

export function useGroups() {
  return useQuery({
    queryKey: ['chat', 'groups'],
    queryFn: fetchGroups,
  })
}

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { group_name: string; member_ids?: number[] }) =>
      createGroup(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat', 'groups'] })
    },
  })
}

export function useGroupDetail(id: number | null) {
  return useQuery({
    queryKey: ['chat', 'group-detail', id],
    queryFn: () => fetchGroupDetail(id!),
    enabled: id !== null,
  })
}

export function useDeleteGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteGroup(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat', 'groups'] })
    },
  })
}

export function useGroupMessages(groupId: number | null) {
  return useQuery({
    queryKey: ['chat', 'group', groupId],
    queryFn: () => fetchGroupMessages(groupId!),
    enabled: groupId !== null,
  })
}

export function useSendGroupMessage(groupId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      content?: string
      attachments?: Array<{ file_url: string; file_type: string; file_name: string }>
    }) => sendGroupMessage(groupId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat', 'group', groupId] })
      void qc.invalidateQueries({ queryKey: ['chat', 'groups'] })
    },
  })
}

export function useInviteMember(groupId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => inviteMember(groupId, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat', 'group-detail', groupId] })
    },
  })
}

export function useRemoveMember(groupId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => removeMember(groupId, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat', 'group-detail', groupId] })
    },
  })
}

export function useJoinGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => joinGroup(id),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: ['chat', 'groups'] })
      void qc.invalidateQueries({ queryKey: ['chat', 'group', id] })
      void qc.invalidateQueries({ queryKey: ['chat', 'group-detail', id] })
    },
  })
}

export function useRejectGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => rejectGroup(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat', 'groups'] })
    },
  })
}

export function useLeaveGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => leaveGroup(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat', 'groups'] })
    },
  })
}
