import type { Attachment, AttachmentPayload, Post } from '#/types/post'
import ReportModal from '@/components/ReportModal'
import {
  Bookmark,
  BookOpen,
  Briefcase,
  ClipboardList,
  Coffee,
  EllipsisVertical,
  File,
  FileText,
  Film,
  Flag,
  Globe,
  Heart,
  Image,
  Lock,
  MessageCircle,
  Paperclip,
  Pencil,
  Share2,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useStore } from '@tanstack/react-store'
import { presignAttachments, uploadToMinIO } from '#/api/attachmentApi'
import { Button, Card, Dropdown, Form, Modal } from 'react-bootstrap'
import UserAvatar from './UserAvatar'
import { authStore } from '#/lib/auth'
import { useDeletePost, useUpdatePost, useToggleLike, useSharePost } from '#/api/usePost'
import toast from 'react-hot-toast'
import { CATEGORIES } from '#/types/category'
import CommentSection from './CommentSection'

const MAX_FILES = 5
const ACCEPTED_EXTENSIONS = [
  '.docx',
  '.doc',
  '.xlsx',
  '.png',
  '.jpeg',
  '.jpg',
  '.pdf',
]
const ACCEPTED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'application/pdf',
]
const ACCEPTED_ATTR = ACCEPTED_EXTENSIONS.join(',')

const VISIBILITY_OPTIONS = [
  { value: 'Public' as const, label: 'Công khai', Icon: Globe },
  { value: 'Private' as const, label: 'Chỉ mình tôi', Icon: Lock },
]

const CATEGORY_ICONS: Record<number, React.ElementType> = {
  1: BookOpen,
  2: ClipboardList,
  3: Briefcase,
  4: Coffee,
}

function getFileIcon(file: File): React.ElementType {
  if (file.type.startsWith('image/')) return Image
  if (file.type.startsWith('video/')) return Film
  if (file.type === 'application/pdf' || file.type.includes('text'))
    return FileText
  return File
}

function getAttachmentIcon(
  fileType: 'Image' | 'Video' | 'Document',
): React.ElementType {
  if (fileType === 'Image') return Image
  if (fileType === 'Video') return Film
  return FileText
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

interface FeedPostCardProps {
  post: Post
}

export default function FeedPostCard({ post }: FeedPostCardProps) {
  const user = useStore(authStore, (s) => s.user)

  const initialLikeCount = Array.isArray(post.likes)
    ? post.likes.length
    : Number(post.likes) || 0

  const initialLiked = Array.isArray(post.likes)
    ? post.likes.some((l: any) => l.user_id === user?.id)
    : Boolean(post.liked)

  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [shareCount, setShareCount] = useState(Number(post.shares) || 0)
  const [bookmarked, setBookmarked] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [showComments, setShowComments] = useState(false)

  const initialCommentCount = Array.isArray(post.comments) ? post.comments.length : Number(post.comments) || Number((post as any).comments_count) || 0
  const [commentCount, setCommentCount] = useState(initialCommentCount)
  const currentUser = useStore(authStore, (s) => s.user)
  const sharedPost = (post as any).parent_post || (post as any).parentPost || (post as any).shared_post || (post as any).original_post

  const sharedAuthor = sharedPost?.author || sharedPost?.user || {}
  const sharedAuthorName = sharedAuthor?.full_name || 'Người dùng ẩn danh'

  const { mutate: mutateUpdatePost, isPending: isUpdating } = useUpdatePost()
  const { mutate: mutateDeletePost, isPending: isDeleting } = useDeletePost()
  const { mutate: mutateToggleLike, isPending: isLiking } = useToggleLike()
  const { mutate: mutateSharePost, isPending: isSharing } = useSharePost()

  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // edit form state
  const [editContent, setEditContent] = useState('')
  const [visibility, setVisibility] = useState<'Public' | 'Private'>('Public')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>(
    [],
  )
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const [shareContent, setShareContent] = useState('')

  useEffect(() => {
    if (showEditModal) {
      setEditContent(post.content ?? '')
      setVisibility((post.visibility as 'Public' | 'Private') ?? 'Public')
      setCategoryId(post.category?.id ?? '')
      setExistingAttachments(post.attachments ?? [])
      setNewFiles([])
    }
  }, [showEditModal])

  const selectedVisibility = VISIBILITY_OPTIONS.find(
    (o) => o.value === visibility,
  )!
  const selectedCategory = CATEGORIES.find((c) => c.id === categoryId)
  const CategoryIcon =
    categoryId !== '' ? CATEGORY_ICONS[categoryId as number] : Tag

  const currentUserId = Number(user?.id)
  const postAuthorId = Number(post.author.id)
  const isOwner =
    Number.isFinite(currentUserId) && currentUserId === postAuthorId
  const isAccepted = post.status.toLowerCase() === 'accepted'
  const canManagePost = isOwner && isAccepted

  function handleEditFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? [])
    if (!incoming.length) return
    const valid = incoming.filter((f) => ACCEPTED_MIME_TYPES.includes(f.type))
    const rejected = incoming.length - valid.length
    if (rejected > 0) {
      toast.error(
        `${rejected} file không được hỗ trợ. Chỉ chấp nhận: ${ACCEPTED_EXTENSIONS.join(', ')}`,
      )
    }
    if (!valid.length) {
      if (editFileInputRef.current) editFileInputRef.current.value = ''
      return
    }
    const totalCurrent = existingAttachments.length + newFiles.length
    if (totalCurrent + valid.length > MAX_FILES) {
      toast.error(`Tối đa ${MAX_FILES} file`)
      const allowed = valid.slice(0, MAX_FILES - totalCurrent)
      if (allowed.length > 0) setNewFiles((prev) => [...prev, ...allowed])
    } else {
      setNewFiles((prev) => [...prev, ...valid])
    }
    if (editFileInputRef.current) editFileInputRef.current.value = ''
  }

  function handleLike() {
    if (isLiking) return
    const previousLiked = liked
    const previousCount = likeCount
    setLiked(!previousLiked)
    setLikeCount((prev) => (previousLiked ? prev - 1 : prev + 1))

    mutateToggleLike(post.id, {
      onError: () => {
        setLiked(previousLiked)
        setLikeCount(previousCount)
        toast.error('Lỗi khi thực hiện thao tác thích bài viết.')
      },
    })
  }

  function handleShare() {
    if (isSharing) return
    mutateSharePost({ id: post.id, content: shareContent }, {
      onSuccess: (res) => {
        setShareCount(res?.data?.shares ?? shareCount + 1)
        setShareContent('')
        toast.success('Đã chia sẻ bài viết thành công!')
        setShowShareModal(false)
      },
      onError: () => toast.error('Lỗi khi chia sẻ bài viết.'),
    })
  }

  function removeExistingAttachment(id: number) {
    setExistingAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  function removeNewFile(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleEditSubmit() {
    const trimmed = editContent.trim()
    if (!trimmed) {
      toast.error('Nội dung bài viết không được để trống.')
      return
    }
    if (categoryId === '') {
      toast.error('Vui lòng chọn danh mục bài viết!')
      return
    }

    let newAttachmentPayloads: AttachmentPayload[] = []
    if (newFiles.length > 0) {
      setIsUploadingFiles(true)
      try {
        const presignResults = await presignAttachments(newFiles)
        await Promise.all(
          presignResults.map((r, i) =>
            uploadToMinIO(r.presigned_url, newFiles[i]),
          ),
        )
        newAttachmentPayloads = presignResults.map(
          ({ file_url, file_type, file_name }) => ({
            file_url,
            file_type,
            file_name,
          }),
        )
      } catch {
        toast.error('Upload file thất bại, vui lòng thử lại.')
        setIsUploadingFiles(false)
        return
      }
      setIsUploadingFiles(false)
    }

    const existingPayloads: AttachmentPayload[] = existingAttachments.map(
      (att) => ({
        file_url: att.file_url,
        file_type: att.file_type,
        file_name: att.file_name ?? '',
      }),
    )

    const allAttachments = [...existingPayloads, ...newAttachmentPayloads]

    mutateUpdatePost(
      {
        id: post.id,
        payload: {
          content: trimmed,
          visibility,
          category_id: categoryId as number,
          attachments: allAttachments.length > 0 ? allAttachments : [],
        },
      },
      {
        onSuccess: (res) => {
          if (res.status) {
            toast.success('Cập nhật bài viết thành công.')
            setShowEditModal(false)
          } else {
            toast.error(res.message || 'Cập nhật bài viết thất bại.')
          }
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message ?? 'Cập nhật bài viết thất bại.',
          )
        },
      },
    )
  }

  function handleDeleteConfirm() {
    mutateDeletePost(post.id, {
      onSuccess: (res) => {
        if (res.status) {
          toast.success('Xoá bài viết thành công.')
          setShowDeleteModal(false)
        } else {
          toast.error(res.message || 'Xoá bài viết thất bại.')
        }
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message ?? 'Xoá bài viết thất bại.')
      },
    })
  }

  return (
    <Card className="mb-4 shadow-sm border-0 rounded-4">
      <Card.Body className="p-4">
        {/* Author */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="d-flex align-items-center gap-3">
            <Link
              to="/profile"
              search={
                currentUser?.id === post.author.id
                  ? {}
                  : { user: String(post.author.id) }
              }
              className="text-decoration-none"
            >
              <UserAvatar fullName={post.author.full_name} />
            </Link>
            <div>
              <Link to="/profile" search={
                currentUser?.id === post.author.id ? {} : { user: String(post.author.id) }
              } className="text-decoration-none text-body">
                <h6 className="mb-0 fw-bold">
                {post.author.full_name}
                {sharedPost && (
                  <span className="fw-normal text-muted ms-1" style={{ fontSize: '0.9em' }}>
                    đã chia sẻ một bài viết
                  </span>
                )}
              </h6>
              </Link>
              <div className="d-flex align-items-center gap-1 text-muted small">
                {post.visibility === 'Private' ? (
                  <Lock size={11} />
                ) : (
                  <Globe size={11} />
                )}
                <span>{timeAgo(post.updated_at)}</span>
                {post.is_edited && <span>· edited</span>}
              </div>
            </div>
          </div>

          {canManagePost && (
            <Dropdown align="end">
              <Dropdown.Toggle
                as={Button}
                variant="link"
                className="text-secondary p-1 border-0 shadow-none"
                id={`post-action-${post.id}`}
                bsPrefix="btn"
              >
                <EllipsisVertical size={18} />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item
                  className="d-flex align-items-center gap-2"
                  onClick={() => setShowEditModal(true)}
                >
                  <Pencil size={14} />
                  Edit
                </Dropdown.Item>
                <Dropdown.Item
                  className="d-flex align-items-center gap-2 text-danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 size={14} />
                  Delete
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </div>

        {/* Tags */}
        <div className="mb-2 d-flex flex-wrap gap-2">
          {post.category && (
            <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary fw-normal px-2 py-1 d-inline-flex align-items-center gap-1">
              {(() => {
                const Icon = CATEGORY_ICONS[post.category.id] ?? Tag
                return <Icon size={12} />
              })()}
              <span className="small">{post.category.category_name}</span>
            </span>
          )}
          {post.status.toLowerCase() === 'pending' && (
            <span className="badge rounded-pill bg-warning text-dark fw-normal px-2 py-1 d-inline-flex align-items-center gap-1">
              <span className="small">Chờ duyệt</span>
            </span>
          )}
        </div>

        {/* Content */}
        {post.content && (
          <Card.Text className="mb-4" style={{ whiteSpace: 'pre-line' }}>
            {post.content}
          </Card.Text>
        )}

        {/* Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mb-3 d-flex flex-wrap gap-2">
            {post.attachments.map((att) => {
              if (att.file_type === 'Image') {
                return (
                  <img
                    key={att.id}
                    src={att.view_url}
                    alt={att.file_name ?? 'image'}
                    className="rounded-3"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 300,
                      objectFit: 'cover',
                    }}
                  />
                )
              }
              if (att.file_type === 'Video') {
                return (
                  <video
                    key={att.id}
                    src={att.view_url}
                    controls
                    className="rounded-3 w-100"
                    style={{ maxHeight: 300 }}
                  />
                )
              }
              return (
                <div key={att.id} className="d-flex align-items-end">
                  <a
                    href={att.view_url}
                    download={att.file_name ?? true}
                    target="_blank"
                    rel="noreferrer"
                    className="d-flex align-items-center gap-2 text-decoration-none border rounded-3 px-3 py-2 text-secondary"
                  >
                    <Paperclip size={16} />
                    <span className="small">
                      {att.file_name ?? 'Download file'}
                    </span>
                  </a>
                </div>
              )
            })}
          </div>
        )}

        {/* Shared Post Container */}
        {sharedPost && (
          <div className="border rounded-4 mb-3 overflow-hidden bg-light">
            {/* Original Author */}
            <div className="d-flex align-items-center gap-2 p-3 pb-2 border-bottom bg-white">
              <div style={{ transform: 'scale(0.85)', transformOrigin: 'center left' }}>
                <UserAvatar fullName={sharedAuthorName} />
              </div>
              <div>
                <h6 className="mb-0 fw-bold small text-dark">{sharedAuthorName}</h6>
                <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.75rem' }}>
                  {sharedPost.visibility === 'Private' ? (
                    <Lock size={10} />
                  ) : (
                    <Globe size={10} />
                  )}
                  <span>{timeAgo(sharedPost.updated_at || sharedPost.created_at || new Date().toISOString())}</span>
                </div>
              </div>
            </div>

            {/* Original Content */}
            {sharedPost.content && (
              <div className="px-3 pt-2 pb-1 bg-white">
                <Card.Text className="mb-2 small text-dark" style={{ whiteSpace: 'pre-line' }}>
                  {sharedPost.content}
                </Card.Text>
              </div>
            )}

            {/* Original Attachments */}
            {sharedPost.attachments && sharedPost.attachments.length > 0 && (
              <div className="d-flex flex-wrap gap-2 bg-white pb-3 px-3">
                {sharedPost.attachments.map((att: Attachment) => {
                  if (att.file_type === 'Image') {
                    return (
                      <img
                        key={att.id}
                        src={att.view_url}
                        alt={att.file_name ?? 'image'}
                        className="rounded-3 border"
                        style={{ maxWidth: '100%', maxHeight: 250, objectFit: 'cover' }}
                      />
                    )
                  }
                  if (att.file_type === 'Video') {
                    return (
                      <video key={att.id} src={att.view_url} controls className="rounded-3 w-100 border" style={{ maxHeight: 250 }} />
                    )
                  }
                  return (
                    <div key={att.id} className="d-flex align-items-end w-100 mt-1">
                      <a
                        href={att.view_url}
                        download={att.file_name ?? true}
                        target="_blank"
                        rel="noreferrer"
                        className="d-flex align-items-center gap-2 text-decoration-none border rounded-3 px-3 py-2 text-secondary bg-body-tertiary w-100"
                      >
                        <Paperclip size={16} />
                        <span className="small text-truncate fw-medium">{att.file_name ?? 'Download file'}</span>
                      </a>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="d-flex align-items-center gap-2 pt-3 border-top">
          <Button
            variant="link"
            onClick={handleLike}
            disabled={isLiking}
            className={`d-flex align-items-center gap-2 text-decoration-none p-2 rounded-3 ${
              liked ? 'text-danger bg-danger bg-opacity-10' : 'text-secondary'
            }`}
          >
            <Heart
              size={18}
              className={liked ? 'fill-danger text-danger' : ''}
            />
            <span className="small fw-medium">{likeCount}</span>
          </Button>

          <Button
            variant="link"
            className="d-flex align-items-center gap-2 text-decoration-none p-2 rounded-3 text-secondary"
            onClick={() => setShowComments((prev) => !prev)}
          >
            <MessageCircle size={18} />
            <span className="small fw-medium">{commentCount}</span>
          </Button>

          <Button
            variant="link"
            onClick={() => setShowShareModal(true)}
            disabled={isSharing}
            className="d-flex align-items-center gap-2 text-decoration-none p-2 rounded-3 text-secondary"
          >
            <Share2 size={18} />
            <span className="small fw-medium">{shareCount}</span>
          </Button>

          <Button
            variant="link"
            onClick={() => setIsReportOpen(true)}
            className="d-flex align-items-center gap-2 text-decoration-none p-2 rounded-3 text-secondary hover-text-danger"
            title="Báo cáo bài viết vi phạm"
          >
            <Flag size={18} />
          </Button>

          <Button
            variant="link"
            onClick={() => setBookmarked((p) => !p)}
            className={`ms-auto d-flex align-items-center text-decoration-none p-2 rounded-3 ${
              bookmarked
                ? 'text-warning bg-warning bg-opacity-10'
                : 'text-secondary'
            }`}
          >
            <Bookmark
              size={18}
              className={bookmarked ? 'fill-warning text-warning' : ''}
            />
          </Button>
        </div>

        {showComments && (
          <CommentSection 
            postId={post.id} 
            onCountChange={(delta) => setCommentCount((prev) => prev + delta)}
          />
        )}
      </Card.Body>

      {/* ── Edit modal ─────────────────────────────────────────────────────────── */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit post</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Control
            as="textarea"
            rows={5}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="border-0 bg-light rounded-3 p-3"
            style={{ resize: 'none' }}
          />

          {/* Existing attachments */}
          {existingAttachments.length > 0 && (
            <div className="d-flex flex-column gap-2 mt-3">
              {existingAttachments.map((att) => {
                const AttIcon = getAttachmentIcon(att.file_type)
                return (
                  <div
                    key={att.id}
                    className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-light border"
                    style={{ fontSize: '0.82rem' }}
                  >
                    <AttIcon size={15} className="text-primary flex-shrink-0" />
                    <span
                      className="text-truncate flex-grow-1 text-secondary fw-medium"
                      title={att.file_name ?? undefined}
                    >
                      {att.file_name ?? 'file'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeExistingAttachment(att.id)}
                      className="btn btn-sm p-0 ms-1 d-flex align-items-center justify-content-center text-muted"
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        flexShrink: 0,
                      }}
                      aria-label={`Remove ${att.file_name}`}
                      title="Xóa file"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* New files preview */}
          {newFiles.length > 0 && (
            <div className="d-flex flex-column gap-2 mt-2">
              {newFiles.map((file, index) => {
                const FileIcon = getFileIcon(file)
                return (
                  <div
                    key={`${file.name}-${index}`}
                    className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-light border"
                    style={{ fontSize: '0.82rem' }}
                  >
                    <FileIcon
                      size={15}
                      className="text-primary flex-shrink-0"
                    />
                    <span
                      className="text-truncate flex-grow-1 text-secondary fw-medium"
                      title={file.name}
                    >
                      {file.name}
                    </span>
                    <span
                      className="text-muted flex-shrink-0"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {formatBytes(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeNewFile(index)}
                      className="btn btn-sm p-0 ms-1 d-flex align-items-center justify-content-center text-muted"
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        flexShrink: 0,
                      }}
                      aria-label={`Remove ${file.name}`}
                      title="Xóa file"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {existingAttachments.length + newFiles.length > 0 && (
            <p className="mb-0 mt-1 text-muted" style={{ fontSize: '0.75rem' }}>
              {existingAttachments.length + newFiles.length}/{MAX_FILES} file đã
              chọn
            </p>
          )}

          <div className="d-flex align-items-center gap-2 pt-2 border-top mt-3">
            <input
              ref={editFileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_ATTR}
              style={{ display: 'none' }}
              onChange={handleEditFileChange}
              aria-label="Upload file đính kèm"
            />

            <button
              type="button"
              onClick={() => editFileInputRef.current?.click()}
              disabled={
                existingAttachments.length + newFiles.length >= MAX_FILES
              }
              className="btn btn-light btn-sm d-flex align-items-center gap-1 rounded-3 border text-secondary px-2 py-1"
              title={
                existingAttachments.length + newFiles.length >= MAX_FILES
                  ? `Tối đa ${MAX_FILES} file`
                  : `Chấp nhận: ${ACCEPTED_EXTENSIONS.join(', ')}`
              }
            >
              <Upload size={14} />
              <span className="small">Upload file</span>
            </button>

            {/* Visibility */}
            <Dropdown>
              <Dropdown.Toggle
                variant="light"
                size="sm"
                className="d-flex align-items-center gap-1 rounded-3 border text-secondary px-2 py-1"
                bsPrefix="btn"
              >
                <selectedVisibility.Icon size={14} />
                <span className="small">{selectedVisibility.label}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {VISIBILITY_OPTIONS.map(({ value, label, Icon }) => (
                  <Dropdown.Item
                    key={value}
                    onClick={() => setVisibility(value)}
                    active={visibility === value}
                    className="d-flex align-items-center gap-2"
                  >
                    <Icon size={14} />
                    {label}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>

            {/* Category */}
            <Dropdown>
              <Dropdown.Toggle
                variant="light"
                size="sm"
                className={`d-flex align-items-center gap-1 rounded-3 border px-2 py-1 ${
                  categoryId === '' ? 'text-muted' : 'text-secondary'
                }`}
                bsPrefix="btn"
              >
                <CategoryIcon size={14} />
                <span className="small">
                  {selectedCategory
                    ? selectedCategory.category_name
                    : 'Chọn danh mục'}
                </span>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {CATEGORIES.map((category) => {
                  const Icon = CATEGORY_ICONS[category.id]
                  return (
                    <Dropdown.Item
                      key={category.id}
                      onClick={() => setCategoryId(category.id)}
                      active={categoryId === category.id}
                      className="d-flex align-items-center gap-2"
                    >
                      <Icon size={14} />
                      {category.category_name}
                    </Dropdown.Item>
                  )
                })}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowEditModal(false)}
            disabled={isUpdating || isUploadingFiles}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleEditSubmit}
            disabled={isUpdating || isUploadingFiles}
          >
            {isUpdating || isUploadingFiles ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Delete modal ───────────────────────────────────────────────────────── */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete post</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this post?</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Share modal ───────────────────────────────────────────────────────── */}
      <Modal
        show={showShareModal}
        onHide={() => setShowShareModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận chia sẻ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Nói gì đó về bài viết này..."
            value={shareContent}
            onChange={(e) => setShareContent(e.target.value)}
            style={{ resize: 'none' }}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowShareModal(false)}
            disabled={isSharing}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                />
                Đang chia sẻ...
              </>
            ) : (
              'Chia sẻ'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Report modal ───────────────────────────────────────────────────────── */}
      {isReportOpen && (
        <ReportModal postId={post.id} onClose={() => setIsReportOpen(false)} />
      )}
    </Card>
  )
}
