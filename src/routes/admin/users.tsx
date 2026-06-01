import { createFileRoute } from '@tanstack/react-router'
import {
  Card,
  Spinner,
  Table,
  Badge,
  Button,
  Form,
  Row,
  Col,
} from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { exportUsersPdf, useGetUserList } from '#/api/useAdmin'
import { FileDown, Pencil, Plus, Search, Filter, Lock, Unlock } from 'lucide-react'
import React, { useState } from 'react'
import UserModal from '#/components/admin/UserModal'
import type { User, UserRole, UserStatus } from '#/types/user'
import ConfirmDeleteUserModal from '#/components/admin/ConfirmDeleteUser'
import { useLockUser, useUnlockUser } from '#/api/useUser'
import ConfirmLockUserModal from 'src/components/admin/ConfirmLockUser.tsx'

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const { t } = useTranslation()
  
  // 🚩 1. Thiết lập các State lưu bộ lọc (Filters)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Gọi API lấy danh sách User gốc về
  const { data, isLoading, isError } = useGetUserList()
  const rawUsers = data?.data ?? []

  // 🚩 2. Logic lọc thông minh trực tiếp trên Front-end
  const users = rawUsers.filter((u) => {
    // Lọc theo Từ khóa (Tìm tương đối theo Tên hoặc Email, không phân biệt hoa thường)
    if (keyword.trim()) {
      const searchKey = keyword.toLowerCase()
      const fullNameMatch = u.full_name?.toLowerCase().includes(searchKey) ?? false
      const emailMatch = u.email?.toLowerCase().includes(searchKey) ?? false
      if (!fullNameMatch && !emailMatch) return false
    }

    // Lọc theo Trạng thái (Active, Inactive, Locked)
    if (statusFilter && u.status !== statusFilter) {
      return false
    }

    return true
  })

  const ROLE_VARIANT: Record<UserRole, string> = {
    'Super Admin': 'danger',
    Admin: 'warning',
    Student: 'secondary',
  }

  // Cập nhật lại màu sắc Badge Trạng thái cho trực quan
  const STATUS_VARIANT: Record<UserStatus, string> = {
    Active: 'success',
    Inactive: 'secondary',
    Locked: 'danger', // Đổi sang đỏ cho nổi bật trạng thái bị khóa
  }

  const [userModalVisible, setUserModalVisible] = useState(false)
  const [confirmDeleteUserModal, setConfirmDeleteUserModal] = useState<
    string | undefined
  >(undefined)
  const [confirmLockUserModal, setConfirmLockUserModal] = useState<string | undefined>(undefined)
  
  const lockUserMutation = useLockUser()
  const unlockUserMutation = useUnlockUser()

  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const handleOpenAddUserModal = () => {
    setUserModalVisible(true)
  }

  const handleOpenEditUserModal = (user: User) => {
    setEditingUser(user)
    setUserModalVisible(true)
  }

  const handleCloseUserModal = () => {
    setUserModalVisible(false)
    setEditingUser(null)
  }

  const handleCloseConfirmDeleteUser = () => {
    setConfirmDeleteUserModal(undefined)
  }

  const handleExportPdf = async () => {
    setIsExporting(true)
    try {
      await exportUsersPdf()
    } finally {
      setIsExporting(false)
    }
  }

  // 🚩 Hàm xóa nhanh bộ lọc người dùng
  const handleClearFilters = () => {
    setKeyword('')
    setStatusFilter('')
  }

  // --- HÀM XỬ LÝ LOCK / UNLOCK ---
  const handleOpenConfirmLockUser = (user: User) => {
    setConfirmLockUserModal(user.id)
  }

  const handleCloseConfirmLockUser = () => {
    setConfirmLockUserModal(undefined)
  }

  const handleUnlockUser = (userId: string | number) => {
    if (confirm('Bạn có chắc chắn muốn mở khóa tài khoản này không?')) {
      unlockUserMutation.mutate(userId)
    }
  }

  return (
    <div className="container py-4 px-3" style={{ maxWidth: '1100px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">{t('admin_users_title')}</h4>
          <p className="text-secondary mb-0">{t('admin_users_subtitle')}</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button
            variant="outline-danger"
            className="d-flex align-items-center gap-2 rounded-3"
            onClick={handleExportPdf}
            disabled={isExporting}
          >
            <FileDown size={18} />
            <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
          </Button>

          <Button
            className="d-flex align-items-center gap-2 rounded-3"
            onClick={handleOpenAddUserModal}
          >
            <Plus size={18} />
            <span>{t('admin_users_add_user')}</span>
          </Button>
        </div>
      </div>

      {/* 🚩 3. ĐẮP THANH BỘ LỌC TÌM KIẾM USER SIÊU MƯỢT */}
      <Card className="border-0 shadow-sm rounded-4 mb-4 bg-body-tertiary">
        <Card.Body className="p-3">
          <Row className="g-3 align-items-end">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-secondary d-flex align-items-center gap-1">
                  <Search size={14} /> Tìm kiếm tài khoản
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhập tên hoặc email người dùng..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="rounded-3"
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-secondary d-flex align-items-center gap-1">
                  <Filter size={14} /> Trạng thái
                </Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-3"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="Active">Active (Hoạt động)</option>
                  <option value="Inactive">Inactive (Chưa kích hoạt)</option>
                  <option value="Locked">Locked (Đang bị khóa)</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2} className="d-grid">
              {(keyword || statusFilter) ? (
                <Button 
                  variant="link" 
                  className="text-danger text-decoration-none text-center p-2 small"
                  onClick={handleClearFilters}
                >
                  Xóa bộ lọc
                </Button>
              ) : (
                <div style={{ height: '38px' }}></div>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="d-flex justify-content-center py-5">
              <Spinner animation="border" variant="danger" />
            </div>
          ) : isError ? (
            <div className="p-4 text-danger">{t('error_generic')}</div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="bg-body-tertiary">
                <tr>
                  <th className="px-4 py-3">{t('admin_users_col_id')}</th>
                  <th className="px-4 py-3">{t('admin_users_col_name')}</th>
                  <th className="py-3">{t('admin_users_col_email')}</th>
                  <th className="py-3">{t('admin_users_col_role')}</th>
                  <th className="py-3">{t('admin_users_col_status')}</th>
                  <th className="py-3" style={{ width: '120px' }}>{t('admin_users_col_action')}</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-secondary py-4">
                      Không tìm thấy người dùng nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4">{u.id}</td>
                      <td className="px-4 fw-medium">{u.full_name ?? '—'}</td>
                      <td>{u.email}</td>
                      <td>
                        <Badge
                          bg={ROLE_VARIANT[u.role as UserRole] ?? 'secondary'}
                        >
                          {u.role ?? 'Student'}
                        </Badge>
                      </td>
                      <td>
                        <Badge
                          bg={
                            STATUS_VARIANT[u.status as UserStatus] ??
                            'secondary'
                          }
                        >
                          {u.status ?? 'Active'}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="link"
                          className="text-decoration-none p-2 rounded-3 text-secondary"
                          onClick={() => handleOpenEditUserModal(u as User)}
                          title="Chỉnh sửa thông tin"
                        >
                          <Pencil size={18} />
                        </Button>
                        {u.status === 'Locked' ? (
                          <Button
                            variant="link"
                            className="text-decoration-none p-2 rounded-3 text-success"
                            onClick={() => handleUnlockUser(u.id)}
                            title="Mở khóa tài khoản"
                          >
                            <Unlock size={18} />
                          </Button>
                        ) : (
                          <Button
                            variant="link"
                            className="text-decoration-none p-2 rounded-3 text-danger"
                            onClick={() => handleOpenConfirmLockUser(u as User)}
                            title="Khóa tài khoản"
                          >
                            <Lock size={18} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <UserModal
        visible={userModalVisible}
        onClose={handleCloseUserModal}
        user={editingUser ?? undefined}
      />

      <ConfirmDeleteUserModal
        visible={!!confirmDeleteUserModal}
        onClose={handleCloseConfirmDeleteUser}
        userId={confirmDeleteUserModal}
      />

      <ConfirmLockUserModal
        visible={!!confirmLockUserModal}
        onClose={handleCloseConfirmLockUser}
        userId={confirmLockUserModal}
      />  
    </div>
  )
}