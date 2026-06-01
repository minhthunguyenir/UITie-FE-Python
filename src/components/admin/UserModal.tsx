  import { useCreateUser, useUpdateUser } from '#/api/useAdmin'
import type { CreateUserRequest, User } from '#/types/user'
import React, { useEffect, useState } from 'react'
import { Button, Form, Modal, Spinner } from 'react-bootstrap'
import toast from 'react-hot-toast'

type Props = {
  visible: boolean
  onClose: () => void
  user?: User
}

const DEFAULT_FORM: CreateUserRequest = {
  role: 'Student',
  email: '',
  full_name: '',
  status: 'Active',
}

const UserModal = ({ visible, onClose, user }: Props) => {
  const [validated, setValidated] = useState(false)
  const [formData, setFormData] = useState<CreateUserRequest>(DEFAULT_FORM)

  const isEditMode = !!user
  const { mutateAsync: createUser, isPending } = useCreateUser()
  const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUser()

  useEffect(() => {
    if (user) {
      setFormData({
        role: user.role,
        email: user.email,
        full_name: user.full_name ?? '',
        status: user.status,
      })
    } else {
      setFormData(DEFAULT_FORM)
    }
  }, [user, visible])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget

    if (!form.checkValidity()) {
      setValidated(true)
      return
    }

    const action = isEditMode
      ? updateUser({ id: user.id, ...formData })
      : createUser(formData)

    action
      .then(() => {
        onClose()
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message || 'Đã có lỗi xảy ra')
      })
  }

  if (!visible) return null

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 fixed-top bg-black bg-opacity-50">
      <div
        className="modal show"
        style={{ display: 'block', position: 'initial' }}
      >
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Title>
              {isEditMode ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
            </Modal.Title>
          </Modal.Header>

          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3" controlId="formBasicRole">
                <Form.Label>Vai trò</Form.Label>
                <Form.Select
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="Student">Sinh viên</option>
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  name="email"
                  required
                  type="email"
                  placeholder="example@ms.uit.edu.vn"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isEditMode}
                />
                <Form.Control.Feedback type="invalid">
                  Vui lòng nhập email hợp lệ
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formBasicFullName">
                <Form.Label>Họ và tên</Form.Label>
                <Form.Control
                  name="full_name"
                  required
                  type="text"
                  placeholder="Họ và tên"
                  value={formData.full_name}
                  onChange={handleChange}
                />
                <Form.Control.Feedback type="invalid">
                  Vui lòng nhập họ và tên
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formBasicStatus">
                <Form.Label>Trạng thái</Form.Label>
                <Form.Select
                  name="status"
                  required
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Locked">Locked</option>
                </Form.Select>
              </Form.Group>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="secondary" type="button" onClick={onClose}>
                Đóng
              </Button>
              <Button variant="primary" type="submit" disabled={isPending}>
                {isEditMode ? 'Cập nhật' : 'Thêm người dùng'}
                {isPending && (
                  <Spinner animation="border" size="sm" className="ms-2" />
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Dialog>
      </div>
    </div>
  )
}

export default UserModal
