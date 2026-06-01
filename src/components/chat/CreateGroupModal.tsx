import { useCreateGroup } from '#/integrations/useChat'
import { Search, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button, Form, InputGroup, ListGroup, Modal, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import axiosClient from '#/api/axiosClient'
import UserAvatar from '../UserAvatar'

interface Props {
  show: boolean
  onHide: () => void
  onCreated: (groupId: number) => void
}

interface UserSearchResult {
  id: number
  full_name: string
  email: string
}

export default function CreateGroupModal({ show, onHide, onCreated }: Props) {
  const { t } = useTranslation()
  const createGroup = useCreateGroup()
  const [groupName, setGroupName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [selectedMembers, setSelectedMembers] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  function addMember(user: UserSearchResult) {
    setSelectedMembers((prev) => (prev.some((m) => m.id === user.id) ? prev : [...prev, user]))
    setSearchQuery('')
    setSearchResults([])
  }

  function removeMember(userId: number) {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== userId))
  }

  function handleClose() {
    setGroupName('')
    setSearchQuery('')
    setSearchResults([])
    setSelectedMembers([])
    onHide()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!groupName.trim()) return
    createGroup.mutate(
      {
        group_name: groupName.trim(),
        member_ids: selectedMembers.map((m) => m.id),
      },
      {
        onSuccess: (group) => {
          onCreated(group.id)
          handleClose()
        },
      },
    )
  }

  const selectedIds = new Set(selectedMembers.map((m) => m.id))

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6">{t('chat_create_group_title')}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="d-flex flex-column gap-3">
          <Form.Group>
            <Form.Label className="small fw-semibold">{t('chat_group_name_label')}</Form.Label>
            <Form.Control
              size="sm"
              placeholder={t('chat_group_name_placeholder')}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
              maxLength={100}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label className="small fw-semibold">{t('chat_invite_members_label')}</Form.Label>
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
              <ListGroup className="mt-1 border rounded" style={{ maxHeight: 140, overflowY: 'auto' }}>
                {searchResults.map((u) => (
                  <ListGroup.Item
                    key={u.id}
                    action
                    disabled={selectedIds.has(u.id)}
                    className="d-flex justify-content-between align-items-center py-1 px-2 cursor-pointer"
                    onClick={() => addMember(u)}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <UserAvatar fullName={u.full_name} size={28} />
                      <div>
                        <div className="small fw-semibold">{u.full_name}</div>
                        <div style={{ fontSize: 11 }}>{u.email}</div>
                      </div>
                    </div>
                    {selectedIds.has(u.id) && <span className="small text-success">✓</span>}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}

            {selectedMembers.length > 0 && (
              <div className="d-flex flex-wrap gap-1 mt-2">
                {selectedMembers.map((m) => (
                  <span
                    key={m.id}
                    className="badge bg-primary d-flex align-items-center gap-1"
                    style={{ fontSize: 12 }}
                  >
                    {m.full_name}
                    <button
                      type="button"
                      className="btn btn-sm p-0 border-0 text-white"
                      onClick={() => removeMember(m.id)}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button size="sm" variant="secondary" onClick={handleClose}>
            {t('chat_cancel')}
          </Button>
          <Button
            size="sm"
            variant="primary"
            type="submit"
            disabled={!groupName.trim() || createGroup.isPending}
          >
            {createGroup.isPending ? <Spinner animation="border" size="sm" /> : t('chat_create')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
