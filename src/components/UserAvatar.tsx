interface Props {
  fullName: string
  avatar?: string | null
  size?: number
}

const COLORS = [
  { bg: '#DBEAFE', text: '#1D4ED8' },
  { bg: '#DCFCE7', text: '#15803D' },
  { bg: '#FEF9C3', text: '#A16207' },
  { bg: '#FCE7F3', text: '#9D174D' },
  { bg: '#EDE9FE', text: '#6D28D9' },
  { bg: '#CFFAFE', text: '#0E7490' },
  { bg: '#FFEDD5', text: '#C2410C' },
  { bg: '#F1F5F9', text: '#475569' },
]

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return (parts[0].slice(0, 2)).toUpperCase()
  return (parts[0][0]! + parts[parts.length - 1][0]!).toUpperCase()
}

function getColor(fullName: string) {
  let hash = 0
  for (let i = 0; i < fullName.length; i++) {
    hash = fullName.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]!
}

const UserAvatar = ({ fullName, avatar, size = 40 }: Props) => {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={fullName}
        className="rounded-circle object-fit-cover border flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }

  const initials = getInitials(fullName)
  const color = getColor(fullName)
  const fontSize = size * 0.35

  return (
    <div
      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-semibold"
      style={{
        width: size,
        height: size,
        backgroundColor: color.bg,
        color: color.text,
        fontSize,
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  )
}

export default UserAvatar
