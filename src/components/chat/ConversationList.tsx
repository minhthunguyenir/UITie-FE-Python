import { useDmConversations, useGroups } from '#/integrations/useChat'
import type { ActiveConversation, DmConversation, GroupChat } from '#/types/chat'
import { MessageSquare, Plus, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Form, InputGroup, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import CreateGroupModal from './CreateGroupModal'
import NewDmModal from './NewDmModal'
import UserAvatar from '../UserAvatar'

interface Props {
  active: ActiveConversation | null
  onSelect: (conv: ActiveConversation) => void
}

type UnifiedItem =
  | { kind: 'dm'; conv: DmConversation; sortKey: number }
  | { kind: 'group'; group: GroupChat; sortKey: number }

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function sortKey(lastMsg: { created_at: string } | null, fallback?: string): number {
  if (lastMsg) return new Date(lastMsg.created_at).getTime()
  if (fallback) return new Date(fallback).getTime()
  return 0
}

export default function ConversationList({ active, onSelect }: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showNewDm, setShowNewDm] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const { data: conversations, isLoading: convLoading } = useDmConversations()
  const { data: groups, isLoading: groupsLoading } = useGroups()

  const unified: UnifiedItem[] = [
    ...(conversations ?? [])
      .filter((c) => !search || c.user.full_name.toLowerCase().includes(search.toLowerCase()))
      .map((c): UnifiedItem => ({ kind: 'dm', conv: c, sortKey: sortKey(c.last_message) })),
    ...(groups ?? [])
      .filter((g) => !search || g.group_name.toLowerCase().includes(search.toLowerCase()))
      .map((g): UnifiedItem => ({ kind: 'group', group: g, sortKey: sortKey(g.last_message, g.created_at) })),
  ].sort((a, b) => b.sortKey - a.sortKey)

  const isLoading = convLoading || groupsLoading

  return (
    <aside className="border-end d-flex flex-column flex-shrink-0 bg-body" style={{ width: 300 }}>
      {/* Header */}
      <div className="p-3 border-bottom">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">{t('chat_header')}</h5>
          <div className="position-relative">
            <Button
              size="sm"
              variant="light"
              className="border d-flex align-items-center justify-content-center"
              style={{ width: 32, height: 32 }}
              onClick={() => setShowPicker((p) => !p)}
              title={t('chat_new_chat')}
            >
              <Plus size={16} />
            </Button>

            {showPicker && (
              <>
                <div
                  className="position-fixed top-0 start-0 w-100 h-100"
                  style={{ zIndex: 99 }}
                  onClick={() => setShowPicker(false)}
                />
                <div
                  className="position-absolute end-0 mt-1 bg-body border rounded shadow-sm"
                  style={{ zIndex: 100, minWidth: 160 }}
                >
                  <button
                    type="button"
                    className="w-100 d-flex align-items-center gap-2 px-3 py-2 border-0 bg-transparent text-start border-bottom"
                    onClick={() => {
                      setShowPicker(false)
                      setShowNewDm(true)
                    }}
                  >
                    <MessageSquare size={14} />
                    <span className="small">{t('chat_new_dm')}</span>
                  </button>
                  <button
                    type="button"
                    className="w-100 d-flex align-items-center gap-2 px-3 py-2 border-0 bg-transparent text-start"
                    onClick={() => {
                      setShowPicker(false)
                      setShowCreateGroup(true)
                    }}
                  >
                    <Users size={14} />
                    <span className="small">{t('chat_new_group')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <InputGroup size="sm">
          <InputGroup.Text className="bg-body-secondary border-0">
            <Search size={12} />
          </InputGroup.Text>
          <Form.Control
            placeholder={t('chat_search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-body-secondary border-0"
          />
        </InputGroup>
      </div>

      {/* Unified list */}
      <div className="overflow-y-auto flex-grow-1">
        {isLoading ? (
          <div className="d-flex justify-content-center py-4">
            <Spinner animation="border" size="sm" variant="secondary" />
          </div>
        ) : unified.length === 0 ? (
          <div className="text-center text-secondary small py-4">{t('chat_no_conversations')}</div>
        ) : (
          unified.map((item) => {
            if (item.kind === 'dm') {
              const c = item.conv
              const isActive = active?.type === 'dm' && active.userId === c.user.id
              return (
                <button
                  key={`dm-${c.user.id}`}
                  type="button"
                  onClick={() => onSelect({ type: 'dm', userId: c.user.id })}
                  className={`w-100 d-flex align-items-center gap-2 p-3 border-bottom border-0 text-start ${isActive ? 'bg-primary-subtle' : 'bg-body'}`}
                  style={{ borderLeft: isActive ? '3px solid var(--bs-primary)' : '3px solid transparent' }}
                >
                  <UserAvatar fullName={c.user.full_name} size={44} />
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex justify-content-between align-items-baseline">
                      <span className="fw-semibold text-truncate">{c.user.full_name}</span>
                      {c.last_message && (
                        <span className="small text-secondary ms-2 flex-shrink-0">
                          {timeAgo(c.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="small text-secondary text-truncate">
                      {c.last_message?.content ?? t('chat_attachment')}
                    </div>
                  </div>
                </button>
              )
            }

            const g = item.group
            const isActive = active?.type === 'group' && active.groupId === g.id
            const isPending = g.my_status === 'Pending'
            return (
              <button
                key={`group-${g.id}`}
                type="button"
                onClick={() => onSelect({ type: 'group', groupId: g.id })}
                className={`w-100 d-flex align-items-center gap-2 p-3 border-bottom border-0 text-start ${isActive ? 'bg-primary-subtle' : 'bg-body'}`}
                style={{ borderLeft: isActive ? '3px solid var(--bs-primary)' : '3px solid transparent' }}
              >
                <div
                  className="rounded-circle bg-primary bg-opacity-10 border border-primary border-opacity-25 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 44, height: 44 }}
                >
                  <span className="text-primary fw-bold">{g.group_name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex justify-content-between align-items-baseline">
                    <div className="d-flex align-items-center gap-1 min-w-0 overflow-hidden">
                      <span className="fw-semibold text-truncate">{g.group_name}</span>
                      <Badge bg="secondary" pill style={{ fontSize: 9, padding: '2px 5px', flexShrink: 0 }}>
                        {t('chat_group_badge')}
                      </Badge>
                    </div>
                    <div className="d-flex align-items-center gap-1 flex-shrink-0 ms-2">
                      {isPending && (
                        <Badge bg="warning" text="dark" pill style={{ fontSize: 10 }}>
                          {t('chat_invited_badge')}
                        </Badge>
                      )}
                      {g.last_message && (
                        <span className="small text-secondary">{timeAgo(g.last_message.created_at)}</span>
                      )}
                    </div>
                  </div>
                  <div className="small text-secondary text-truncate">
                    {isPending
                      ? t('chat_invited_status')
                      : g.last_message
                        ? `${g.last_message.sender?.full_name ?? t('chat_someone')}: ${g.last_message.content ?? t('chat_attachment')}`
                        : t('chat_group_member_count', { count: g.member_count })}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      <NewDmModal
        show={showNewDm}
        onHide={() => setShowNewDm(false)}
        onSelect={(conv) => {
          onSelect(conv)
        }}
      />

      <CreateGroupModal
        show={showCreateGroup}
        onHide={() => setShowCreateGroup(false)}
        onCreated={(id) => {
          onSelect({ type: 'group', groupId: id })
        }}
      />
    </aside>
  )
}
