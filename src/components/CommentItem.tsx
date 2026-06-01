import React, { useState, useRef } from 'react'
import { Form, Button } from 'react-bootstrap'
import type { Comment } from '#/types/comment'
import { useCreateComment, useDeleteComment } from '#/api/useComment'
import UserAvatar from './UserAvatar'
import { useStore } from '@tanstack/react-store'
import { authStore } from '#/lib/auth'
import { Trash2, Paperclip, X, Image as ImageIcon, Film, FileText, File as FileIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { presignAttachments, uploadToMinIO } from '#/api/attachmentApi'
import type { AttachmentPayload } from '#/types/post'

interface Props {
  comment: Comment & { replies?: Comment[] }
  postId: number
  onCountChange?: (delta: number) => void
}

const MAX_FILES = 5
const ACCEPTED_EXTENSIONS = ['.docx', '.doc', '.xlsx', '.png', '.jpeg', '.jpg', '.pdf']
const ACCEPTED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'application/pdf',
]
const ACCEPTED_ATTR = ACCEPTED_EXTENSIONS.join(',')

function getFileIcon(file: File): React.ElementType {
  if (file.type.startsWith('image/')) return ImageIcon
  if (file.type.startsWith('video/')) return Film
  if (file.type === 'application/pdf' || file.type.includes('text')) return FileText
  return FileIcon
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'vừa xong'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  return `${Math.floor(h / 24)} ngày trước`
}

export default function CommentItem({ comment, postId, onCountChange }: Props) {
  const user = useStore(authStore, (s) => s.user)
  const { mutate: createReply, isPending: isReplying } = useCreateComment()
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment()
  const [isReplyingOpen, setIsReplyingOpen] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentUserId = Number(user?.id)
  const isOwner = currentUserId === Number(comment.user.id)
  const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin'
  const canDelete = isOwner || isAdmin

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? [])
    if (!incoming.length) return

    const valid = incoming.filter((f) => ACCEPTED_MIME_TYPES.includes(f.type))
    const rejected = incoming.length - valid.length
    if (rejected > 0) {
      toast.error(`${rejected} file không được hỗ trợ. Chỉ chấp nhận: ${ACCEPTED_EXTENSIONS.join(', ')}`)
    }

    if (!valid.length) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const combined = [...attachments, ...valid]
    if (combined.length > MAX_FILES) {
      toast.error(`Tối đa ${MAX_FILES} file đính kèm`)
      const allowed = valid.slice(0, MAX_FILES - attachments.length)
      if (allowed.length > 0) setAttachments((prev) => [...prev, ...allowed])
    } else {
      setAttachments(combined)
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() && attachments.length === 0) return

    let attachmentPayloads: AttachmentPayload[] = []
    if (attachments.length > 0) {
      setIsUploading(true)
      try {
        const presignResults = await presignAttachments(attachments)
        await Promise.all(presignResults.map((r, i) => uploadToMinIO(r.presigned_url, attachments[i])))
        attachmentPayloads = presignResults.map(({ file_url, file_type, file_name }) => ({
          file_url, file_type, file_name
        }))
      } catch {
        toast.error('Upload file thất bại, vui lòng thử lại.')
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    }

    createReply(
      { 
        post_id: postId, 
        content: replyContent.trim() || undefined, 
        parent_comment_id: comment.id,
        attachments: attachmentPayloads.length > 0 ? attachmentPayloads : undefined 
      },
      {
        onSuccess: () => {
          setReplyContent('')
          setAttachments([])
          setIsReplyingOpen(false)
          onCountChange?.(1)
        },
      }
    )
  }

  const handleDelete = () => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return
    deleteComment(
      { id: comment.id, post_id: postId },
      {
        onSuccess: () => {
          toast.success('Đã xóa bình luận')
          onCountChange?.(-1)
        },
        onError: () => toast.error('Xóa bình luận thất bại'),
      }
    )
  }

  return (
    <div className="d-flex gap-2 w-100">
      <UserAvatar fullName={comment.user.full_name} />
      <div className="flex-grow-1">
        <div className="bg-light rounded-4 px-3 py-2">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="fw-bold small">{comment.user.full_name}</span>
            {canDelete && (
              <button
                type="button"
                className="btn btn-link p-0 text-muted hover-text-danger border-0 text-decoration-none"
                onClick={handleDelete}
                disabled={isDeleting}
                title="Xóa bình luận"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          {comment.content && (
            <div className="small text-break" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
              {comment.content}
            </div>
          )}
          
          {/* Hiển thị file đính kèm nếu có */}
          {(comment as any).attachments && (comment as any).attachments.length > 0 && (
            <div className="mt-2 d-flex flex-column gap-2">
              {(comment as any).attachments.map((att: any) => {
                if (att.file_type === 'Image') {
                  return <img key={att.id} src={att.view_url} alt="attachment" className="rounded-3 border" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover' }} />
                }
                if (att.file_type === 'Video') {
                  return <video key={att.id} src={att.view_url} controls className="rounded-3 border" style={{ maxWidth: '100%', maxHeight: 200 }} />
                }
                return (
                  <a key={att.id} href={att.view_url} target="_blank" rel="noreferrer" className="d-flex align-items-center gap-2 text-decoration-none border rounded-3 px-2 py-1 text-secondary small bg-white d-inline-flex" style={{ width: 'fit-content' }}>
                    <Paperclip size={14} />
                    <span className="text-truncate fw-medium" style={{ maxWidth: 200 }}>{att.file_name || 'Download file'}</span>
                  </a>
                )
              })}
            </div>
          )}
        </div>
        <div className="d-flex gap-3 align-items-center mt-1 ms-2 mb-2">
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
            {timeAgo(comment.created_at)}
          </span>
          <button
            type="button"
            className="btn btn-link p-0 text-muted fw-medium text-decoration-none border-0"
            style={{ fontSize: '0.75rem' }}
            onClick={() => setIsReplyingOpen(!isReplyingOpen)}
          >
            Phản hồi
          </button>
        </div>

        {isReplyingOpen && (
          <Form onSubmit={handleReplySubmit} className="d-flex gap-2 align-items-start mt-2 mb-3">
            <UserAvatar fullName={user?.full_name ?? '?'} />
            <div className="flex-grow-1">
              <Form.Control
                as="textarea"
                rows={1}
                placeholder={`Phản hồi ${comment.user.full_name}...`}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="rounded-3 bg-light border-0 py-2 px-3 small"
                style={{ resize: 'none', fontSize: '0.875rem' }}
                autoFocus
              />
              
              {/* Xem trước file của comment con (Reply) */}
              {attachments.length > 0 && (
                <div className="d-flex flex-column gap-2 mt-2">
                  {attachments.map((file, index) => {
                    const FileIcon = getFileIcon(file)
                    return (
                      <div key={`${file.name}-${index}`} className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-light border" style={{ fontSize: '0.82rem' }}>
                        <FileIcon size={15} className="text-primary flex-shrink-0" />
                        <span className="text-truncate flex-grow-1 text-secondary fw-medium" title={file.name}>{file.name}</span>
                        <span className="text-muted flex-shrink-0" style={{ whiteSpace: 'nowrap' }}>{formatBytes(file.size)}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="btn btn-sm p-0 ms-1 d-flex align-items-center justify-content-center text-muted"
                          style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, lineHeight: 1 }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mt-2">
                <div>
                  <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_ATTR} className="d-none" onChange={handleFileChange} />
                  <Button variant="link" className="p-0 text-secondary d-flex align-items-center gap-1 text-decoration-none" onClick={() => fileInputRef.current?.click()} disabled={attachments.length >= MAX_FILES}>
                    <Paperclip size={16} />
                    <span style={{ fontSize: '0.8rem' }}>Đính kèm</span>
                  </Button>
                </div>
                <div className="d-flex gap-2">
                  <Button variant="light" size="sm" className="rounded-pill px-3 py-1 fw-medium" style={{ fontSize: '0.8rem' }} onClick={() => setIsReplyingOpen(false)} disabled={isReplying || isUploading}>
                    Hủy
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="rounded-pill px-3 py-1 fw-medium" style={{ fontSize: '0.8rem' }} disabled={isReplying || isUploading || (!replyContent.trim() && attachments.length === 0)}>
                    {isReplying || isUploading ? 'Đang gửi...' : 'Gửi'}
                  </Button>
                </div>
              </div>
            </div>
          </Form>
        )}

        {/* Đệ quy gọi chính nó để render comment lồng nhau */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="d-flex flex-column gap-3 mt-3 ms-4 ps-3 border-start border-2" style={{ borderColor: 'rgba(108, 117, 125, 0.25)' }}>
            {comment.replies.map((reply) => (
              <CommentItem 
                key={reply.id} 
                comment={reply as any} 
                postId={postId} 
                onCountChange={onCountChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}