import { Card, Button, Badge, Image, Nav, Row, Col, Modal, Form, Spinner } from 'react-bootstrap'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Camera,
  Check,
  MessageSquare,
  Settings as SettingsIcon,
  UserPlus,
  BookOpen,
} from 'lucide-react'
import type { UserRole } from '#/lib/fake-api'
import { useProfile, useUpdateProfile, useUserPosts, useToggleFollow } from '#/api/useProfile'
import ReportModal from '../../components/ReportModal'
import toast from 'react-hot-toast'
import FeedPostCard from '#/components/FeedPostCard'

export const Route = createFileRoute('/_authenticated/profile')({
  validateSearch: (search: Record<string, unknown>) => {
    const validSearch: { user?: string } = {}
    if (typeof search.user === 'string') {
      validSearch.user = search.user
    }
    return validSearch
  },
  component: ProfilePage,
})

const ROLE_BADGE: Record<
  UserRole,
  { label: string; bg: string; text: string }
> = {
  student: { label: 'Sinh viên', bg: 'info-subtle', text: 'info-emphasis' },
  lecturer: {
    label: 'Giảng viên',
    bg: 'primary-subtle',
    text: 'primary-emphasis',
  },
  alumni: { label: 'Cựu SV', bg: 'warning-subtle', text: 'warning-emphasis' },
  admin: { label: 'Admin', bg: 'danger-subtle', text: 'danger-emphasis' },
}

function RoleBadge({ role }: { role: string }) {
  // Chuẩn hóa role lấy từ database sang UserRole key
  const normalizedRole = role ? (role.toLowerCase().includes('admin') ? 'admin' : role.toLowerCase()) : 'student'
  const r = ROLE_BADGE[normalizedRole as UserRole] || ROLE_BADGE.student
  return (
    <Badge bg={r.bg} text={r.text} className="border fw-semibold">
      {r.label}
    </Badge>
  )
}

function ProfilePage() {
  const { user: userId } = Route.useSearch()

  const [tab, setTab] = useState<string>('posts')

  // Hook TanStack Query tự động quản lý fetching
  const { data: profileData, isLoading, isError } = useProfile(userId)
  
  // Ưu tiên cờ is_me từ Backend (đúng trong mọi trường hợp), hoặc fallback về !userId nếu URL trống
  const isMe = profileData?.is_me || !userId
  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateProfile()
  const { data: posts, isLoading: isLoadingPosts } = useUserPosts(profileData?.id)
  const { mutate: toggleFollow, isPending: isTogglingFollow } = useToggleFollow()

  const displayedPosts = posts?.filter((post: any) => post.status !== 'Rejected') || []

  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState({
    full_name: '',
    phone_number: '',
    faculty: '',
    class_name: '',
    academic_year: '',
  })

  // 🚩 CODE CẬP NHẬT: Khai báo State điều khiển đóng/mở Modal báo cáo tài khoản
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  // Đưa dữ liệu hiện tại vào form khi mở modal
  const handleOpenEdit = () => {
    if (profileData) {
      setEditData({
        full_name: profileData.full_name || '',
        phone_number: profileData.phone_number || '',
        faculty: profileData.faculty || '',
        class_name: profileData.class_name || '',
        academic_year: profileData.academic_year || '',
      })
    }
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    try {
      await updateProfile(editData)
      toast.success('Cập nhật hồ sơ thành công!')
      setShowEditModal(false)
    } catch (error) {
      console.error('Lỗi khi cập nhật hồ sơ:', error)
      toast.error('Đã xảy ra lỗi khi cập nhật hồ sơ. Vui lòng kiểm tra lại!')
    }
  }

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  if (isError || !profileData) {
    return (
      <div className="text-center py-5 text-secondary">
        <p>Không thể tải thông tin hồ sơ.</p>
      </div>
    )
  }

  const avatarUrl = profileData.avatar || 'https://github.com/shadcn.png'

  return (
    <div>
      {/* Cover */}
      <div
        className="position-relative"
        style={{
          height: 240,
          background: 'linear-gradient(120deg,#1E3A8A,#3B82F6)',
        }}
      >
        {isMe && (
          <Button
            size="sm"
            variant="light"
            className="position-absolute end-0 bottom-0 m-3 d-flex align-items-center gap-2 fw-semibold"
          >
            <Camera size={15} /> Đổi ảnh bìa
          </Button>
        )}
      </div>

      {/* Header */}
      <div className="bg-body border-bottom">
        <div className="container-xl px-3 px-md-4">
          <div
            className="d-flex flex-column flex-md-row align-items-md-end gap-3 pb-3"
            style={{ marginTop: -56 }}
          >
            <div
              className="position-relative"
              style={{ width: 140, height: 140 }}
            >
              <Image
                src={avatarUrl}
                roundedCircle
                width={140}
                height={140}
                className="border border-4 border-body shadow-sm bg-body object-fit-cover"
              />
              {isMe && (
                <Button
                  variant="primary"
                  className="position-absolute bottom-0 end-0 rounded-circle p-2 d-flex align-items-center justify-content-center"
                  style={{ width: 36, height: 36 }}
                >
                  <Camera size={16} />
                </Button>
              )}
            </div>

            <div className="flex-grow-1 pt-2">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h3 className="mb-0 fw-bold">{profileData.full_name}</h3>
                <RoleBadge role={profileData.role} />
              </div>
              <div className="d-flex gap-3 small mt-2">
                <span>
                  <strong>{displayedPosts.length}</strong>{' '}
                  <span className="text-secondary">bài viết</span>
                </span>
                <span>
                  <strong>{profileData.followers_count ?? 0}</strong>{' '}
                  <span className="text-secondary">người theo dõi</span>
                </span>
                <span>
                  <strong>{profileData.following_count ?? 0}</strong>{' '}
                  <span className="text-secondary">đang theo dõi</span>
                </span>
              </div>
            </div>

            <div className="d-flex gap-2">
              {isMe ? (
                <Button
                  variant="outline-primary"
                  className="d-flex align-items-center gap-2"
                  onClick={handleOpenEdit}
                >
                  <SettingsIcon size={16} /> Chỉnh sửa hồ sơ
                </Button>
              ) : (
                <>
                  <Button
                variant={profileData.is_following ? 'light' : 'primary'}
                onClick={() => toggleFollow(profileData.id)}
                disabled={isTogglingFollow}
                    className="d-flex align-items-center gap-2 border"
                  >
                {profileData.is_following ? <Check size={16} /> : <UserPlus size={16} />}
                {profileData.is_following ? 'Đang theo dõi' : 'Theo dõi'}
                  </Button>
                  <Button
                    variant="outline-primary"
                    className="d-flex align-items-center gap-2"
                  >
                    <MessageSquare size={16} /> Nhắn tin
                  </Button>

                  {/* 🚩 CODE CẬP NHẬT: Thêm nút bấm Báo cáo tài khoản cho Profile người khác */}
                  <Button
                    variant="outline-danger"
                    className="d-flex align-items-center gap-2"
                    onClick={() => setIsReportModalOpen(true)}
                  >
                    🚩 Báo cáo
                  </Button>

                  {/* 🚩 CODE CẬP NHẬT: Nhúng Modal báo cáo chạy ngầm và truyền userId qua */}
                  {isReportModalOpen && (
                    <ReportModal
                      onClose={() => setIsReportModalOpen(false)}
                      userId={profileData?.id}
                      postId={0}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          <Nav
            variant="underline"
            activeKey={tab}
            onSelect={(k) => k && setTab(k)}
            className="border-0"
          >
            {[
              ['posts', 'Bài viết'],
              ['photos', 'Ảnh'],
              ['docs', 'Tài liệu'],
            ].map(([k, l]) => (
              <Nav.Item key={k}>
                <Nav.Link eventKey={k} className="fw-semibold">
                  {l}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </div>
      </div>

      {/* Body */}
      <div className="container-xl py-4 px-3 px-md-4">
        <Row className="g-4">
          <Col lg={4}>
            <Card className="border-0 shadow-sm rounded-4 mb-3">
              <Card.Body>
                <Card.Title className="fs-6 fw-bold mb-3">
                  Thông tin
                </Card.Title>
                {[
                  ['Khoa', profileData.faculty || '—'],
                  ['Lớp', profileData.class_name || '—'],
                  ['Khoá', profileData.academic_year || '—'],
                  ['Email', profileData.email || '—'],
                  profileData.phone_number ? ['Số điện thoại', profileData.phone_number] : null,
                ]
                  .filter((r): r is [string, string] => Array.isArray(r))
                  .map(([k, v]) => (
                    <div
                      key={k}
                      className="d-flex justify-content-between py-2 border-bottom small"
                    >
                      <span className="text-secondary">{k}</span>
                      <span className="fw-semibold text-end">{v}</span>
                    </div>
                  ))}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8}>
            {tab === 'posts' ? (
              <div className="d-flex flex-column gap-3">
                {isLoadingPosts ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : displayedPosts.length > 0 ? (
                  displayedPosts.map((post: any) => (
                    <FeedPostCard key={post.id} post={{ ...post, author: post.user || post.author || profileData }} />
                  ))
                ) : (
                  <Card className="border-0 shadow-sm rounded-4 text-center py-5">
                    <Card.Body>
                      <BookOpen size={36} className="text-secondary opacity-50" />
                      <p className="mt-3 mb-0 text-secondary">
                        Chưa có bài viết nào.
                      </p>
                    </Card.Body>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="border-0 shadow-sm rounded-4 text-center py-5">
                <Card.Body>
                  <BookOpen size={36} className="text-secondary opacity-50" />
                  <p className="mt-3 mb-0 text-secondary">
                    Chưa có nội dung trong tab "{tab}".
                  </p>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>

        {/* Edit Profile Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-5 fw-bold">Chỉnh sửa hồ sơ</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="fw-medium">Họ và tên</Form.Label>
                <Form.Control
                  type="text"
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-medium">Số điện thoại</Form.Label>
                <Form.Control
                  type="text"
                  value={editData.phone_number}
                  onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                  placeholder="09xx xxx xxx"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-medium">Khoa</Form.Label>
                <Form.Control
                  type="text"
                  value={editData.faculty}
                  onChange={(e) => setEditData({ ...editData, faculty: e.target.value })}
                  placeholder="Công nghệ phần mềm..."
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-medium">Lớp</Form.Label>
                <Form.Control
                  type="text"
                  value={editData.class_name}
                  onChange={(e) => setEditData({ ...editData, class_name: e.target.value })}
                  placeholder="SE114.O21..."
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-medium">Khóa</Form.Label>
                <Form.Control
                  type="text"
                  value={editData.academic_year}
                  onChange={(e) => setEditData({ ...editData, academic_year: e.target.value })}
                  placeholder="2022-2026"
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={isUpdating}>Hủy</Button>
            <Button variant="primary" onClick={handleSaveEdit} disabled={isUpdating}>
              {isUpdating ? <Spinner size="sm" /> : 'Lưu thay đổi'}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  )
}