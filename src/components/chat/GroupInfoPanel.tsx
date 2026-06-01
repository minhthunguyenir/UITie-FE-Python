import { useGroupDetail, useInviteMember, useLeaveGroup, useRemoveMember } from '#/integrations/useChat'
import { useStore } from '@tanstack/react-store'
import { authStore } from '#/lib/auth'
import { Search, Trash2, UserMinus, UserPlus, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button, Form, InputGroup, ListGroup, Modal, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import axiosClient from '#/api/axiosClient'
import UserAvatar from '../UserAvatar'

interface Props {
  groupId: number
  onDeleteGroup: () => void
  onClose: () => void
}

interface UserSearchResult {
  id: number
  full_name: string
  email: string
}

export default function GroupInfoPanel({ groupId, onDeleteGroup, onClose }: Props) {
  const { t } = useTranslation()
  const user = useStore(authStore, (s) => s.user)
  const { data: group, isLoading } = useGroupDetail(groupId)
  const inviteMember = useInviteMember(groupId)
  const removeMember = useRemoveMember(groupId)
  const leaveGroup = useLeaveGroup()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isOwner = group?.created_by === Number(user?.id)

  function handleSearch(q: string) {
    setSearchQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 2) {
      setSearchResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await axiosClient.get('/user/search', { params: { keyword: q } })
        setSearchResults(res.data.data ?? [])
      } finally {
        setSearching(false)
      }
    }, 500)
  }

  function handleInvite(userId: number) {
    inviteMember.mutate(userId, {
      onSuccess: () => {
        setSearchQuery('')
        setSearchResults([])
      },
    })
  }

  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  if (!group) return null

  const memberIds = new Set(group.members.map((m) => m.user.id))

  return (
    <div className="d-flex flex-column h-100 p-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h6 className="fw-bold mb-0">{t('chat_group_info_title')}</h6>
        <Button variant="link" className="p-0 text-secondary" onClick={onClose}>
          <X size={18} />
        </Button>
      </div>

      <h5 className="fw-bold text-center mb-1">{group.group_name}</h5>
      <p className="text-secondary small text-center mb-3">
        {t('chat_group_member_count', { count: group.members.length })}
      </p>

      {/* Invite member search (owner only) */}
      {isOwner && (
        <div className="mb-3">
          <p className="small fw-semibold mb-1">{t('chat_invite_member')}</p>
          <InputGroup size="sm">
            <InputGroup.Text>
              <Search size={12} />
            </InputGroup.Text>
            <Form.Control
              placeholder={t('chat_search_users_placeholder')}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </InputGroup>
          {searching && <div className="small text-secondary mt-1">{t('chat_searching')}</div>}
          {searchResults.length > 0 && (
            <ListGroup className="mt-1" style={{ maxHeight: 140, overflowY: 'auto' }}>
              {searchResults
                .filter((u) => !memberIds.has(u.id))
                .map((u) => (
                  <ListGroup.Item
                    key={u.id}
                    className="d-flex justify-content-between align-items-center py-1 px-2"
                  >
                    <div className="d-flex align-items-center gap-2">
                      <UserAvatar fullName={u.full_name} size={28} />
                      <div>
                        <div className="small fw-semibold">{u.full_name}</div>
                        <div className="text-secondary" style={{ fontSize: 11 }}>
                          {u.email}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="py-0 px-2"
                      onClick={() => handleInvite(u.id)}
                      disabled={inviteMember.isPending}
                    >
                      <UserPlus size={12} />
                    </Button>
                  </ListGroup.Item>
                ))}
            </ListGroup>
          )}
        </div>
      )}

      {/* Member list */}
      <p className="small fw-semibold mb-1">{t('chat_members')}</p>
      <div className="flex-grow-1 overflow-y-auto">
        <ListGroup>
          {group.members.map((m) => (
            <ListGroup.Item
              key={m.id}
              className="d-flex justify-content-between align-items-center py-2 px-2"
            >
              <div className="d-flex align-items-center gap-2">
                <UserAvatar fullName={m.user.full_name} size={32} />
                <div>
                  <div className="small fw-semibold">
                    {m.user.full_name}
                    {m.user.id === group.created_by && (
                      <span className="ms-1 badge bg-warning text-dark" style={{ fontSize: 9 }}>
                        {t('chat_owner_badge')}
                      </span>
                    )}
                  </div>
                  <div className="text-secondary" style={{ fontSize: 11 }}>
                    {m.status}
                  </div>
                </div>
              </div>
              {isOwner && m.user.id !== group.created_by && (
                <Button
                  size="sm"
                  variant="outline-danger"
                  className="py-0 px-2"
                  onClick={() => removeMember.mutate(m.user.id)}
                  disabled={removeMember.isPending}
                >
                  <UserMinus size={12} />
                </Button>
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>

      {/* Actions */}
      <div className="mt-3 d-flex flex-column gap-2">
        {!isOwner && (
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => leaveGroup.mutate(groupId)}
            disabled={leaveGroup.isPending}
          >
            {leaveGroup.isPending ? <Spinner animation="border" size="sm" /> : t('chat_leave_group')}
          </Button>
        )}
        {isOwner && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={14} className="me-1" />
            {t('chat_delete_group')}
          </Button>
        )}
      </div>

      {/* Delete confirmation modal */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title className="fs-6">{t('chat_delete_group_title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="small">
          {t('chat_delete_group_body')}
        </Modal.Body>
        <Modal.Footer>
          <Button size="sm" variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            {t('chat_cancel')}
          </Button>
          <Button size="sm" variant="danger" onClick={onDeleteGroup}>
            {t('chat_delete')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
