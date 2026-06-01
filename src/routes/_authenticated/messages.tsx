import ConversationList from '#/components/chat/ConversationList'
import GroupInfoPanel from '#/components/chat/GroupInfoPanel'
import { DmMessageArea, GroupMessageArea } from '#/components/chat/MessageArea'
import { useDeleteGroup, useGroups, useDmConversations } from '#/integrations/useChat'
import type { ActiveConversation } from '#/types/chat'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Card } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import axiosClient from '#/api/axiosClient'
import { z } from 'zod'

const searchSchema = z.object({
  type: z.enum(['dm', 'group']).optional(),
  id: z.coerce.number().optional(),
})

export const Route = createFileRoute('/_authenticated/messages')({
  validateSearch: searchSchema,
  component: MessagesPage,
})

function useDmUserName(userId: number | null, knownName: string | null) {
  return useQuery({
    queryKey: ['user', 'show', userId],
    queryFn: async () => {
      const res = await axiosClient.get(`/user/${userId}`)
      return (res.data.data?.full_name ?? res.data.data?.email ?? `User #${userId}`) as string
    },
    enabled: userId !== null && knownName === null,
    staleTime: 5 * 60 * 1000,
  })
}

function MessagesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate({ from: '/messages' })
  const search = Route.useSearch()
  const { data: conversations } = useDmConversations()
  const { data: groups } = useGroups()
  const deleteGroup = useDeleteGroup()
  const [showGroupInfo, setShowGroupInfo] = useState(false)

  const active: ActiveConversation | null =
    search.type === 'dm' && search.id
      ? { type: 'dm', userId: search.id }
      : search.type === 'group' && search.id
        ? { type: 'group', groupId: search.id }
        : null

  // Resolve DM user name from conversations list first, then API fallback
  const knownDmName =
    active?.type === 'dm'
      ? (conversations?.find((c) => c.user.id === active.userId)?.user.full_name ?? null)
      : null

  const { data: fetchedDmName } = useDmUserName(
    active?.type === 'dm' ? active.userId : null,
    knownDmName,
  )

  const dmUserName = knownDmName ?? fetchedDmName ?? (active?.type === 'dm' ? `User #${active.userId}` : '')

  function selectConversation(conv: ActiveConversation) {
    setShowGroupInfo(false)
    void navigate({
      search: conv.type === 'dm'
        ? { type: 'dm', id: conv.userId }
        : { type: 'group', id: conv.groupId },
    })
  }

  const activeGroup =
    active?.type === 'group' ? groups?.find((g) => g.id === active.groupId) : undefined

  function handleDeleteGroup() {
    if (active?.type !== 'group') return
    deleteGroup.mutate(active.groupId, {
      onSuccess: () => {
        setShowGroupInfo(false)
        void navigate({ search: {} })
      },
    })
  }

  return (
    <div className="container-fluid p-3" style={{ height: 'calc(100vh - 56px)' }}>
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden h-100">
        <div className="d-flex h-100">
          {/* Left: conversation list */}
          <ConversationList active={active} onSelect={selectConversation} />

          {/* Center: message area */}
          <section className="d-flex flex-column flex-grow-1 min-w-0">
            {!active && (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-secondary">
                <p className="mb-0">{t('chat_select_conversation')}</p>
              </div>
            )}

            {active?.type === 'dm' && (
              <DmMessageArea
                userId={active.userId}
                userName={dmUserName}
              />
            )}

            {active?.type === 'group' && activeGroup && (
              <GroupMessageArea
                groupId={active.groupId}
                groupName={activeGroup.group_name}
                myStatus={activeGroup.my_status}
                onInfo={() => setShowGroupInfo((p) => !p)}
              />
            )}
          </section>

          {/* Right: group info panel */}
          {showGroupInfo && active?.type === 'group' && (
            <aside
              className="border-start bg-body flex-shrink-0 overflow-y-auto"
              style={{ width: 260 }}
            >
              <GroupInfoPanel
                groupId={active.groupId}
                onDeleteGroup={handleDeleteGroup}
                onClose={() => setShowGroupInfo(false)}
              />
            </aside>
          )}
        </div>
      </Card>
    </div>
  )
}
