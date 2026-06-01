import { presignAttachments, uploadToMinIO } from '#/api/attachmentApi'
import type { PresignResult } from '#/api/attachmentApi'
import { Paperclip, Send, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button, Form, InputGroup, Spinner } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

interface Props {
  onSend: (payload: {
    content?: string
    attachments?: Array<{ file_url: string; file_type: string; file_name: string }>
  }) => void
  isPending: boolean
}

const ACCEPTED_TYPES =
  'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export default function ChatInput({ onSend, isPending }: Props) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSend() {
    const text = draft.trim()
    if (!text && pendingFiles.length === 0) return

    try {
      let attachments: Array<{ file_url: string; file_type: string; file_name: string }> = []

      if (pendingFiles.length > 0) {
        setUploading(true)
        const presigned: PresignResult[] = await presignAttachments(pendingFiles, 'messages')
        await Promise.all(presigned.map((p, i) => uploadToMinIO(p.presigned_url, pendingFiles[i]!)))
        attachments = presigned.map((p) => ({
          file_url: p.file_url,
          file_type: p.file_type,
          file_name: p.file_name,
        }))
        setUploading(false)
      }

      onSend({ content: text || undefined, attachments: attachments.length ? attachments : undefined })
      setDraft('')
      setPendingFiles([])
    } catch {
      setUploading(false)
      toast.error(t('chat_upload_failed'))
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setPendingFiles((prev) => [...prev, ...files].slice(0, 10))
    e.target.value = ''
  }

  const isBusy = isPending || uploading

  return (
    <div className="p-3 border-top bg-body">
      {pendingFiles.length > 0 && (
        <div className="d-flex gap-2 flex-wrap mb-2">
          {pendingFiles.map((f, i) => (
            <div
              key={i}
              className="d-flex align-items-center gap-1 bg-body-secondary rounded px-2 py-1 small"
            >
              <span className="text-truncate" style={{ maxWidth: 120 }}>
                {f.name}
              </span>
              <button
                type="button"
                className="btn btn-sm p-0 border-0 text-secondary"
                onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <InputGroup className="rounded-pill border bg-body-secondary px-2">
        <input
          ref={fileRef}
          type="file"
          hidden
          multiple
          accept={ACCEPTED_TYPES}
          onChange={handleFileChange}
        />
        <Button
          variant="link"
          className="text-secondary px-2"
          onClick={() => fileRef.current?.click()}
          disabled={isBusy}
        >
          <Paperclip size={18} />
        </Button>

        <Form.Control
          placeholder={t('chat_type_message')}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void handleSend()
            }
          }}
          className="border-0 bg-transparent shadow-none"
          disabled={isBusy}
        />

        <Button
          variant={draft.trim() || pendingFiles.length ? 'primary' : 'secondary'}
          className="rounded-circle d-flex align-items-center justify-content-center my-1"
          style={{ width: 36, height: 36 }}
          disabled={isBusy || (!draft.trim() && pendingFiles.length === 0)}
          onClick={() => void handleSend()}
        >
          {isBusy ? <Spinner animation="border" size="sm" /> : <Send size={16} />}
        </Button>
      </InputGroup>
    </div>
  )
}
