import { useRef, useState } from 'react'
import { Button, Card, Dropdown, Form } from 'react-bootstrap'
import {
  Globe,
  Lock,
  BookOpen,
  ClipboardList,
  Briefcase,
  Coffee,
  Tag,
  Upload,
  X,
  FileText,
  Image,
  Film,
  File,
} from 'lucide-react'
import { useCreatePost } from '../api/usePost'
import type { AttachmentPayload, CreatePostPayload } from '../types/post'
import { presignAttachments, uploadToMinIO } from '../api/attachmentApi'
import { CATEGORIES } from '#/types/category'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

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
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'image/png',
  'image/jpeg', // .jpeg / .jpg
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function CreatePostForm() {
  const [content, setContent] = useState('')
  const [focused, setFocused] = useState(false)
  const [visibility, setVisibility] = useState<'Public' | 'Private'>('Public')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { mutate, isPending } = useCreatePost()
  const { t } = useTranslation()

  const isExpanded = focused || content.length > 0

  const selectedVisibility = VISIBILITY_OPTIONS.find(
    (o) => o.value === visibility,
  )!
  const selectedCategory = CATEGORIES.find((c) => c.id === categoryId)
  const CategoryIcon =
    categoryId !== '' ? CATEGORY_ICONS[categoryId as number] : Tag

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? [])
    if (!incoming.length) return

    // Filter out unsupported types and notify once if any were rejected
    const valid = incoming.filter((f) => ACCEPTED_MIME_TYPES.includes(f.type))
    const rejected = incoming.length - valid.length
    if (rejected > 0) {
      toast.error(
        `${rejected} file không được hỗ trợ. Chỉ chấp nhận: ${ACCEPTED_EXTENSIONS.join(', ')}`,
      )
    }

    if (!valid.length) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const combined = [...attachments, ...valid]
    if (combined.length > MAX_FILES) {
      toast.error(t('error_max_files', { max: MAX_FILES }))
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

    if (categoryId === '') {
      toast.error(t('error_missing_category'))
      return
    }

    let attachmentPayloads: AttachmentPayload[] = []

    if (attachments.length > 0) {
      try {
        const presignResults = await presignAttachments(attachments)
        await Promise.all(
          presignResults.map((result, i) =>
            uploadToMinIO(result.presigned_url, attachments[i]),
          ),
        )
        attachmentPayloads = presignResults.map(
          ({ file_url, file_type, file_name }) => ({
            file_url,
            file_type,
            file_name,
          }),
        )
      } catch {
        toast.error('Upload file thất bại, vui lòng thử lại.')
        return
      }
    }

    const payload: CreatePostPayload = {
      content: content.trim() || undefined,
      visibility,
      category_id: categoryId as number,
      attachments:
        attachmentPayloads.length > 0 ? attachmentPayloads : undefined,
    }

    mutate(payload, {
      onSuccess: (res) => {
        if (res.status) {
          setContent('')
          setVisibility('Public')
          setCategoryId('')
          setAttachments([])
          toast.success(t('toast_upload_post_success'))
        }
      },
      onError: (error: any) => {
        const message =
          error?.response?.data?.message ?? t('error_upload_post_failed')
        toast.error(message)
      },
    })
  }

  return (
    <Card
      className="mb-4 rounded-4"
      style={{
        border: '1.5px solid rgba(13,110,253,0.20)',
        boxShadow: '0 4px 24px rgba(13,110,253,0.15)',
      }}
    >
      <Card.Body className="p-4">
        <Form onSubmit={handleSubmit}>
          <Form.Control
            as="textarea"
            rows={1}
            placeholder={t('post_placeholder_text')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="border-0 bg-light rounded-3 mb-3 p-3"
            style={{
              resize: 'none',
              minHeight: isExpanded ? '80px' : '40px',
              transition: 'min-height 0.2s ease',
              overflow: isExpanded ? 'auto' : 'hidden',
            }}
          />

          {/* Attachment preview list */}
          {attachments.length > 0 && (
            <div className="d-flex flex-column gap-2 mb-3">
              {attachments.map((file, index) => {
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
                      onClick={() => removeFile(index)}
                      className="btn btn-sm p-0 ms-1 d-flex align-items-center justify-content-center text-muted"
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        flexShrink: 0,
                        lineHeight: 1,
                      }}
                      aria-label={`Remove ${file.name}`}
                      title="Xóa file"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )
              })}
              <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>
                {attachments.length}/{MAX_FILES} file đã chọn
              </p>
            </div>
          )}

          <div className="d-flex align-items-center gap-2 pt-2 border-top flex-wrap">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_ATTR}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              aria-label="Upload file đính kèm"
            />

            {/* Upload trigger button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={attachments.length >= MAX_FILES}
              className="btn btn-light btn-sm d-flex align-items-center gap-1 rounded-3 border text-secondary px-2 py-1"
              title={
                attachments.length >= MAX_FILES
                  ? `Tối đa ${MAX_FILES} file`
                  : `Chấp nhận: ${ACCEPTED_EXTENSIONS.join(', ')}`
              }
            >
              <Upload size={14} />
              <span className="small">Upload file</span>
            </button>

            {/* Visibility dropdown */}
            <Dropdown>
              <Dropdown.Toggle
                variant="light"
                size="sm"
                className="d-flex align-items-center gap-1 rounded-3 border text-secondary px-2 py-1"
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

            {/* Category dropdown */}
            <Dropdown>
              <Dropdown.Toggle
                variant="light"
                size="sm"
                className={`d-flex align-items-center gap-1 rounded-3 border px-2 py-1 ${categoryId === '' ? 'text-muted' : 'text-secondary'}`}
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

            <div className="flex-grow-1" />

            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="rounded-3 px-3"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-1"
                    role="status"
                    aria-hidden="true"
                  />
                  Đang đăng...
                </>
              ) : (
                'Đăng bài'
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  )
}
