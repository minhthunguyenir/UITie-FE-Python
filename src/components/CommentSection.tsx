import React, { useState, useMemo, useRef } from 'react'
import { Form, Button } from 'react-bootstrap'
import { useGetComments, useCreateComment } from '#/api/useComment'
import CommentItem from './CommentItem'
import type { Comment } from '#/types/comment'
import UserAvatar from './UserAvatar'
import { useStore } from '@tanstack/react-store'
import { authStore } from '#/lib/auth'
import { Paperclip, X, Image as ImageIcon, Film, FileText, File as FileIcon } from 'lucide-react'
import { presignAttachments, uploadToMinIO } from '#/api/attachmentApi'
import type { AttachmentPayload } from '#/types/post'
import toast from 'react-hot-toast'

interface Props {
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

export default function CommentSection({ postId, onCountChange }: Props) {
  const { data: comments = [], isLoading } = useGetComments(postId)
  const { mutate: createComment, isPending } = useCreateComment()
  const user = useStore(authStore, (s) => s.user)
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Group mảng comment phẳng (flat array) thành một mảng cây nhiều cấp
  const rootComments = useMemo(() => {
    const map = new Map<string, Comment & { replies: Comment[] }>()
    comments.forEach((c) => {
      // Đảm bảo đưa key về chuỗi (String) đề phòng ID kiểu BigInt trả về lúc là số, lúc là chuỗi
      map.set(String(c.id), { ...c, replies: [] })
    })

    const roots: (Comment & { replies: Comment[] })[] = []
    map.forEach((c) => {
      const rawParentId = c.parent_comment_id ?? (c as any).parentCommentId
      
      // Chặn các giá trị rác kiểu 'null', '0', 'undefined' (nếu có)
      if (rawParentId && String(rawParentId) !== 'null' && String(rawParentId) !== '0') {
        const parent = map.get(String(rawParentId))
        if (parent) {
          parent.replies.push(c)
        } else {
          // FALLBACK: Tránh rủi ro bị mất comment nếu reply một ID đã bị xoá
          roots.push(c)
        }
      } else {
        roots.push(c)
      }
    })
    return roots
  }, [comments])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && attachments.length === 0) return

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

    createComment(
      { 
        post_id: postId, 
        content: content.trim() || undefined,
        attachments: attachmentPayloads.length > 0 ? attachmentPayloads : undefined 
      },
      { onSuccess: () => {
          setContent('')
          setAttachments([])
          onCountChange?.(1)
      }}
    )
  }

  return (
    <div className="pt-3 mt-3 border-top">
      {isLoading ? (
        <div className="text-center py-3 small text-muted">Đang tải bình luận...</div>
      ) : (
        <div className="d-flex flex-column gap-3 mb-4">
          {rootComments.map((comment) => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              postId={postId} 
              onCountChange={onCountChange}
            />
          ))}
        </div>
      )}

      <Form onSubmit={handleSubmit} className="d-flex gap-2 align-items-start">
        <UserAvatar fullName={user?.full_name ?? '?'} />
        <div className="flex-grow-1">
          <Form.Control
            as="textarea"
            rows={1}
            placeholder="Viết bình luận..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="rounded-3 bg-light border-0 py-2 px-3 small"
            style={{ resize: 'none', fontSize: '0.875rem' }}
          />
          {/* Preview file đính kèm */}
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
                      title="Xóa file"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
          
          {(content.trim() || attachments.length > 0) && (
            <div className="d-flex justify-content-between align-items-center mt-2">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_ATTR}
                  className="d-none"
                  onChange={handleFileChange}
                />
                <Button 
                  variant="link" 
                  className="p-0 text-secondary d-flex align-items-center gap-1 text-decoration-none" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attachments.length >= MAX_FILES}
                >
                  <Paperclip size={16} />
                  <span style={{ fontSize: '0.8rem' }}>Đính kèm</span>
                </Button>
              </div>
              <Button type="submit" size="sm" variant="primary" disabled={isPending || isUploading} className="rounded-pill px-3 py-1 fw-medium" style={{ fontSize: '0.8rem' }}>
                {isPending || isUploading ? 'Đang gửi...' : 'Gửi'}
              </Button>
            </div>
          )}
        </div>
      </Form>
    </div>
  )
}