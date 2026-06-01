import type { ChatAttachment, ChatMessage } from '#/types/chat'
import { FileText, Video } from 'lucide-react'
import UserAvatar from '../UserAvatar'

interface Props {
  message: ChatMessage
  isOwn: boolean
  showAvatar: boolean
}

function AttachmentPreview({ attachment, isOwn }: { attachment: ChatAttachment; isOwn: boolean }) {
  if (attachment.file_type === 'Image') {
    return (
      <img
        src={attachment.view_url}
        alt={attachment.file_name ?? 'image'}
        className="rounded-2 mt-1"
        style={{ maxWidth: '220px', maxHeight: '160px', objectFit: 'cover', display: 'block' }}
      />
    )
  }

  const Icon = attachment.file_type === 'Video' ? Video : FileText
  return (
    <a
      href={attachment.view_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`d-flex align-items-center gap-2 mt-1 text-decoration-none ${isOwn ? 'text-white' : 'text-body'}`}
    >
      <Icon size={16} />
      <span className="small text-truncate" style={{ maxWidth: '180px' }}>
        {attachment.file_name ?? 'File'}
      </span>
    </a>
  )
}

export default function MessageBubble({ message, isOwn, showAvatar }: Props) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      className={`d-flex align-items-end gap-2 ${isOwn ? 'justify-content-end' : 'justify-content-start'}`}
    >
      {!isOwn && (
        <div style={{ width: 28, flexShrink: 0 }}>
          {showAvatar && (
            <UserAvatar fullName={message.sender.full_name ?? ''} size={28} />
          )}
        </div>
      )}

      <div style={{ maxWidth: '70%' }}>
        {!isOwn && showAvatar && (
          <div className="small text-secondary mb-1 ms-1">{message.sender.full_name}</div>
        )}
        <div
          className={`px-3 py-2 shadow-sm ${isOwn ? 'bg-primary text-white' : 'bg-body border'}`}
          style={{
            borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            fontSize: 14,
          }}
        >
          {message.content && <div>{message.content}</div>}
          {message.attachments?.map((a) => (
            <AttachmentPreview key={a.id} attachment={a} isOwn={isOwn} />
          ))}
        </div>
        <div className={`small text-secondary mt-1 ${isOwn ? 'text-end' : ''}`}>{time}</div>
      </div>
    </div>
  )
}
