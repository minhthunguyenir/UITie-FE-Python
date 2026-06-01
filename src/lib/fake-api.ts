import type { User } from '#/types/user'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  message: string
}

export interface AuthResponse {
  token: string
  user: User
}



export interface SuggestedUser {
  id: string
  name: string
  handle: string
  avatar: string
  mutualFriends: number
}

export interface TrendingTopic {
  id: string
  tag: string
  posts: number
}

export interface Event {
  id: string
  title: string
  date: string
  location: string
  attendees: number
}

// ─── Fake delay helper ────────────────────────────────────────────────────────

function delay(ms = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function generateToken(userId: string): string {
  const payload = btoa(JSON.stringify({ sub: userId, iat: Date.now() }))
  return `fake.${payload}.signature`
}

// ─── Fake user store (in-memory) ──────────────────────────────────────────────

const fakeUsers: Map<string, { password: string; user: User }> = new Map([
  [
    'demo@uitie.io',
    {
      password: 'password123',
      user: {
        id: 'usr_1',
        email: 'demo@uitie.io',
        full_name: 'Demo User',
        role: 'Student',
        status: 'Active',
      },
    },
  ],
])

// ─── Auth API ─────────────────────────────────────────────────────────────────

export async function fakeLogin(
  email: string,
  password: string,
): Promise<AuthResponse> {
  await delay()
  const entry = fakeUsers.get(email.toLowerCase())
  if (!entry || entry.password !== password) {
    throw new Error('INVALID_CREDENTIALS')
  }
  return {
    token: generateToken(entry.user.id),
    user: entry.user,
  }
}

export async function fakeRegister(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  await delay()
  const emailLower = email.toLowerCase()
  if (fakeUsers.has(emailLower)) {
    throw new Error('EMAIL_TAKEN')
  }
  const id = `usr_${Date.now()}`
  const user: User = {
    id,
    email: emailLower,
    full_name: name,
    role: 'Student',
    status: 'Active',
  }
  fakeUsers.set(emailLower, { password, user })
  return { token: generateToken(id), user }
}

export async function fakeForgotPassword(
  email: string,
): Promise<{ message: string }> {
  await delay()
  // Always pretend we sent an email (security best practice)
  return { message: `Reset link sent to ${email}` }
}

export async function fakeResetPassword(
  _token: string,
  _newPassword: string,
): Promise<{ message: string }> {
  await delay()
  return { message: 'Password updated successfully' }
}


export type Category = {
  id: number
  category_name: string
}

export const fakeFetchFeed = async (): Promise<Category[]> => {
  return [
    { id: 1, category_name: 'Học tập' },
    { id: 2, category_name: 'Hành chính' },
    { id: 3, category_name: 'Hướng nghiệp' },
    { id: 4, category_name: 'Đời sống' },
  ]
}

// ─── Sidebar data ─────────────────────────────────────────────────────────────

export const FAKE_SUGGESTED_USERS: SuggestedUser[] = [
  {
    id: 'usr_7',
    name: 'An Khoa',
    handle: '@an.khoa',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ankh',
    mutualFriends: 12,
  },
  {
    id: 'usr_8',
    name: 'Bảo Châu',
    handle: '@bao.chau',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=baoch',
    mutualFriends: 8,
  },
  {
    id: 'usr_9',
    name: 'Duy Khang',
    handle: '@duy.khang',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=duykh',
    mutualFriends: 5,
  },
]

export const FAKE_TRENDING: TrendingTopic[] = [
  { id: 't1', tag: '#KyThi2025', posts: 1240 },
  { id: 't2', tag: '#HackathonUIT', posts: 892 },
  { id: 't3', tag: '#TuyenSinh2025', posts: 756 },
  { id: 't4', tag: '#HocBong', posts: 543 },
  { id: 't5', tag: '#CampusLife', posts: 412 },
]

// ─── Profiles / Roles ─────────────────────────────────────────────────────────

export type UserRole = 'student' | 'lecturer' | 'alumni' | 'admin'

export interface Profile {
  id: string
  name: string
  handle: string
  role: UserRole
  faculty: string
  major: string
  year?: string
  job?: string
  bio?: string
  avatar: string
  initials: string
  color: string
}

const avatarFor = (seed: string) =>
  `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`

export const PROFILES: Record<string, Profile> = {
  me: {
    id: 'me',
    name: 'Nguyễn Minh An',
    handle: 'minhan',
    role: 'student',
    faculty: 'Khoa CNPM',
    major: 'Kỹ thuật phần mềm',
    year: 'K21',
    bio: 'Sinh viên năm 3 · yêu thích front-end và thiết kế hệ thống.',
    avatar: avatarFor('minhan'),
    initials: 'MA',
    color: '#1E3A8A',
  },
  u1: {
    id: 'u1',
    name: 'Trần Bảo Linh',
    handle: 'baolinh',
    role: 'alumni',
    faculty: 'Khoa HTTT',
    major: 'Hệ thống thông tin',
    year: 'K17 — Alumni',
    job: 'Software Engineer @ Tech Co.',
    bio: 'Cựu sinh viên K17, đang mentor sinh viên năm cuối.',
    avatar: avatarFor('baolinh'),
    initials: 'BL',
    color: '#F97316',
  },
  u2: {
    id: 'u2',
    name: 'TS. Phạm Quốc Huy',
    handle: 'phquy',
    role: 'lecturer',
    faculty: 'Khoa KHMT',
    major: 'Giảng viên',
    bio: 'Giảng viên môn Cấu trúc dữ liệu & Giải thuật.',
    avatar: avatarFor('phquy'),
    initials: 'PH',
    color: '#3B82F6',
  },
  u3: {
    id: 'u3',
    name: 'Lê Thu Hằng',
    handle: 'thuhang',
    role: 'student',
    faculty: 'Khoa CNPM',
    major: 'KTPM',
    year: 'K21',
    bio: 'Đang học K21 CNPM.',
    avatar: avatarFor('thuhang'),
    initials: 'TH',
    color: '#10B981',
  },
  u4: {
    id: 'u4',
    name: 'Võ Đăng Khoa',
    handle: 'dkhoa',
    role: 'student',
    faculty: 'Khoa MMT&TT',
    major: 'ATTT',
    year: 'K22',
    bio: 'CTF & security enthusiast.',
    avatar: avatarFor('dkhoa'),
    initials: 'DK',
    color: '#8B5CF6',
  },
  u5: {
    id: 'u5',
    name: 'Đặng Thanh Tú',
    handle: 'thanhtu',
    role: 'alumni',
    faculty: 'Khoa KHMT',
    major: 'KHMT',
    year: 'K15 — Alumni',
    job: 'Data Scientist',
    avatar: avatarFor('thanhtu'),
    initials: 'TT',
    color: '#EC4899',
  },
  u6: {
    id: 'u6',
    name: 'Hoàng Gia Bảo',
    handle: 'giabao',
    role: 'student',
    faculty: 'Khoa HTTT',
    major: 'HTTT',
    year: 'K22',
    avatar: avatarFor('giabao'),
    initials: 'GB',
    color: '#0EA5E9',
  },
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export type GroupRole = 'admin' | 'member' | 'pending' | 'none'

export interface Group {
  id: string
  name: string
  members: number
  kind: string
  cover: string
  role: GroupRole
  desc: string
}



// ─── Conversations / Messages ─────────────────────────────────────────────────

export interface Conversation {
  id: string
  userId: string
  lastMsg: string
  time: string
  unread: number
  online: boolean
}

export interface ChatAttachment {
  type: 'pdf' | 'zip' | 'doc'
  name: string
  size: string
}

export interface ChatMessage {
  from: string
  text?: string
  time: string
  attachment?: ChatAttachment
}

export const FAKE_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    userId: 'u3',
    lastMsg: 'Tài liệu mình vừa gửi rồi nhé',
    time: '10:24',
    unread: 2,
    online: true,
  },
  {
    id: 'c2',
    userId: 'u1',
    lastMsg: 'Cảm ơn anh rất nhiều ạ!',
    time: '09:11',
    unread: 0,
    online: true,
  },
  {
    id: 'c3',
    userId: 'u2',
    lastMsg: 'Thầy: Nhớ nộp trước 20/04 nhé',
    time: 'hôm qua',
    unread: 1,
    online: false,
  },
  {
    id: 'c4',
    userId: 'u4',
    lastMsg: 'OK để mình gửi write-up',
    time: 'hôm qua',
    unread: 0,
    online: false,
  },
  {
    id: 'c5',
    userId: 'u5',
    lastMsg: 'CV em gửi anh xem qua rồi',
    time: '2 ngày',
    unread: 0,
    online: false,
  },
  {
    id: 'c6',
    userId: 'u6',
    lastMsg: 'Bài tập nhóm mình làm phần nào?',
    time: '3 ngày',
    unread: 0,
    online: true,
  },
]

export const FAKE_MESSAGES: Record<string, ChatMessage[]> = {
  c1: [
    {
      from: 'u3',
      text: 'Hi An! Mình gửi bạn bộ tài liệu ôn CTDL nhé',
      time: '10:18',
    },
    {
      from: 'u3',
      time: '10:19',
      attachment: {
        type: 'pdf',
        name: 'CTDLGT_dethi_2023.pdf',
        size: '2.1 MB',
      },
    },
    {
      from: 'me',
      text: 'Cảm ơn bạn nhiều nha! Mình xem qua rồi',
      time: '10:22',
    },
    { from: 'u3', text: 'Tài liệu mình vừa gửi rồi nhé 👍', time: '10:24' },
  ],
  c2: [
    { from: 'u1', text: 'Chào em, anh xem CV rồi', time: '09:05' },
    {
      from: 'u1',
      text: 'Kinh nghiệm ổn, em có muốn mình refer vào team front-end không?',
      time: '09:06',
    },
    { from: 'me', text: 'Dạ em rất muốn ạ!', time: '09:09' },
    { from: 'me', text: 'Cảm ơn anh rất nhiều ạ!', time: '09:11' },
  ],
  c3: [
    {
      from: 'u2',
      text: 'An ơi, nhóm em xong phần backend chưa?',
      time: 'hôm qua',
    },
    { from: 'me', text: 'Dạ thầy em đang làm phần auth ạ', time: 'hôm qua' },
    { from: 'u2', text: 'Nhớ nộp trước 20/04 nhé', time: 'hôm qua' },
  ],
  c4: [],
  c5: [],
  c6: [],
}

