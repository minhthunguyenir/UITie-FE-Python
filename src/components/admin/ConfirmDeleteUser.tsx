import { useCreateUser, useDeleteUser, useUpdateUser } from '#/api/useAdmin'
import type { CreateUserRequest, User } from '#/types/user'
import React, { useEffect, useState } from 'react'
import { Button, Form, Modal, Spinner } from 'react-bootstrap'
import toast from 'react-hot-toast'

type Props = {
  visible: boolean
  onClose: () => void
  userId?: string
}

const ConfirmDeleteUserModal = ({ visible, onClose, userId }: Props) => {
  const { mutateAsync: deleteUser, isPending } = useDeleteUser()

  const onConfirm = () => {
    deleteUser(userId as string)
      .then(() => {
        toast.success('Xóa người dùng thành công')
        onClose()
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message || 'Đã có lỗi xảy ra')
      })
      .finally(() => {
        onClose()
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
            <Modal.Title>Xóa người dùng</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Bạn có chắc chắn muốn xóa người dùng này không?</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button variant="danger" onClick={onConfirm}>
              Xác nhận
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </div>
    </div>
  )
}

export default ConfirmDeleteUserModal
