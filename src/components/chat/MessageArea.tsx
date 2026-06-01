import { getEcho } from '#/lib/echo'
import { useStore } from '@tanstack/react-store'
import { authStore } from '#/lib/auth'
import {
  useDmMessages,
  useGroupMessages,
  useSendDmMessage,
  useSendGroupMessage,
} from '#/integrations/useChat'
import type { ChatMessage } from '#/types/chat'
import { Info } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Button, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import ChatInput from './ChatInput'
import GroupJoinPrompt from './GroupJoinPrompt'
import MessageBubble from './MessageBubble'
import UserAvatar from '../UserAvatar'

// ── DM area ─────────────────────────────────────────────────────────

interface DmAreaProps {
  userId: number
  userName: string
  onInfo?: () => void
}

export function DmMessageArea({ userId, userName, onInfo }: DmAreaProps) {
  const { t } = useTranslation()
  const user = useStore(authStore, (s) => s.user)
  const { data, isLoading } = useDmMessages(userId)
  const send = useSendDmMessage(userId)
  const qc = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const messages: ChatMessage[] = data?.data ?? []

  // WebSocket subscription
  useEffect(() => {
    const myId = Number(user?.id)
    const min = Math.min(myId, userId)
    const max = Math.max(myId, userId)

    const channel = getEcho()
      .private(`dm.${min}.${max}`)
      .listen('.MessageSent', () => {
        void qc.invalidateQueries({ queryKey: ['chat', 'dm', userId] })
        void qc.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      })

    return () => {
      channel.stopListening('.MessageSent')
    }
  }, [userId, user?.id, qc])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return (
    <div className="d-flex flex-column h-100">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 p-3 border-bottom bg-body">
        <UserAvatar fullName={userName} />
        <div className="fw-bold flex-grow-1">{userName}</div>
        {onInfo && (
          <Button variant="light" size="sm" className="border" onClick={onInfo}>
            <Info size={16} />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-grow-1 overflow-y-auto p-3 d-flex flex-column gap-2 bg-body-tertiary">
        {isLoading ? (
          <div className="d-flex justify-content-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-secondary py-5">{t('chat_dm_empty', { name: userName })}</div>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.sender.id === Number(user?.id)
            const prev = messages[i - 1]
            const showAvatar = !isOwn && (!prev || prev.sender.id !== msg.sender.id)
            return (
              <MessageBubble key={msg.id} message={msg} isOwn={isOwn} showAvatar={showAvatar} />
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={(p) => send.mutate(p)} isPending={send.isPending} />
    </div>
  )
}

// ── Group area ───────────────────────────────────────────────────────

interface GroupAreaProps {
  groupId: number
  groupName: string
  myStatus: 'Pending' | 'Accepted'
  onInfo: () => void
}

export function GroupMessageArea({ groupId, groupName, myStatus, onInfo }: GroupAreaProps) {
  const { t } = useTranslation()
  const user = useStore(authStore, (s) => s.user)
  const { data, isLoading } = useGroupMessages(myStatus === 'Accepted' ? groupId : null)
  const send = useSendGroupMessage(groupId)
  const qc = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const messages: ChatMessage[] = data?.data ?? []

  useEffect(() => {
    if (myStatus !== 'Accepted') return

    const channel = getEcho()
      .private(`group.${groupId}`)
      .listen('.GroupMessageSent', () => {
        void qc.invalidateQueries({ queryKey: ['chat', 'group', groupId] })
        void qc.invalidateQueries({ queryKey: ['chat', 'groups'] })
      })

    return () => {
      channel.stopListening('.GroupMessageSent')
    }
  }, [groupId, myStatus, qc])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (myStatus === 'Pending') {
    return <GroupJoinPrompt groupId={groupId} groupName={groupName} />
  }

  return (
    <div className="d-flex flex-column h-100">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 p-3 border-bottom bg-body">
        <div
          className="rounded-circle bg-primary bg-opacity-10 border border-primary border-opacity-25 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 40, height: 40 }}
        >
          <span className="text-primary fw-bold">{groupName.charAt(0).toUpperCase()}</span>
        </div>
        <div className="fw-bold flex-grow-1">{groupName}</div>
        <Button variant="light" size="sm" className="border" onClick={onInfo}>
          <Info size={16} />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-grow-1 overflow-y-auto p-3 d-flex flex-column gap-2 bg-body-tertiary">
        {isLoading ? (
          <div className="d-flex justify-content-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-secondary py-5">{t('chat_group_empty')}</div>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.sender.id === Number(user?.id)
            const prev = messages[i - 1]
            const showAvatar = !isOwn && (!prev || prev.sender.id !== msg.sender.id)
            return (
              <MessageBubble key={msg.id} message={msg} isOwn={isOwn} showAvatar={showAvatar} />
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={(p) => send.mutate(p)} isPending={send.isPending} />
    </div>
  )
}
