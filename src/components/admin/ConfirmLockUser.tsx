import React, { useState } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import { useLockUser } from '#/api/useUser'

interface ConfirmLockUserProps {
  visible: boolean
  onClose: () => void
  userId: string | undefined
}

export default function ConfirmLockUserModal({ visible, onClose, userId }: ConfirmLockUserProps) {
  const [reason, setReason] = useState('')
  const lockUserMutation = useLockUser()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    // Kích hoạt mutation gửi id và lý do nhập tay lên Backend
    lockUserMutation.mutate(
      {
        userId,
        payload: { reason },
      },
      {
        onSuccess: () => {
          setReason('') // Xóa trắng ô nhập liệu sau khi khóa thành công
          onClose()     // Đóng Pop-up
        },
      }
    )
  }

  const handleClose = () => {
    setReason('') // Reset lại ô nhập nếu admin bấm hủy không khóa nữa
    onClose()
  }

  return (
    <Modal show={visible} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold h5 text-danger">Khóa tài khoản người dùng</Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="pt-2">
          <p className="text-secondary small mb-3">
            Vui lòng nhập tay lý do khóa tài khoản này. Hệ thống sẽ gửi thông báo và áp dụng hình phạt lập tức lên sinh viên.
          </p>
          
          <Form.Group controlId="lockReason">
            <Form.Label className="fw-semibold small">Lý do khóa tài khoản</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Ví dụ: Tài khoản cố tình đăng tải các bài viết chứa liên kết độc hại, spam nhiều lần..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              disabled={lockUserMutation.isPending}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={handleClose} disabled={lockUserMutation.isPending}>
            Hủy bỏ
          </Button>
          <Button variant="danger" type="submit" disabled={lockUserMutation.isPending}>
            {lockUserMutation.isPending ? 'Đang xử lý...' : 'Xác nhận khóa'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}