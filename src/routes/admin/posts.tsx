import { exportPostsPdf, useGetPostList, useValidatePost } from '#/api/useAdmin'
import { createFileRoute } from '@tanstack/react-router'
import { Check, FileDown, X, Filter } from 'lucide-react'
import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Form,
  Modal,
  Spinner,
  Table,
  Row,
  Col,
} from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/admin/posts')({
  component: AdminPostsPage,
})

const STATUS_VARIANT: Record<string, string> = {
  Pending: 'warning',
  Accepted: 'success',
  Rejected: 'danger',
}

const VISIBILITY_VARIANT: Record<string, string> = {
  Public: 'primary',
  Private: 'secondary',
}

const CATEGORY_NAME: Record<number, string> = {
  1: 'Học tập',
  2: 'Hành chính',
  3: 'Hướng nghiệp',
  4: 'Đời sống',
}

const CATEGORY_VARIANT: Record<number, string> = {
  1: 'primary',
  2: 'secondary',
  3: 'success',
  4: 'danger',
}

function AdminPostsPage() {
  const { t } = useTranslation()

  // 1. Giữ các State lưu bộ lọc bình thường
  const [categoryId, setCategoryId] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  // 2. Trả hook useGetPostList() về nguyên bản không truyền tham số
  const { data, isLoading, isError } = useGetPostList()
  const [isExporting, setIsExporting] = useState(false)

  const [rejectModal, setRejectModal] = useState<{
    show: boolean
    postId: number | null
  }>({
    show: false,
    postId: null,
  })
  const [rejectReason, setRejectReason] = useState('')
  const [rejectReasonError, setRejectReasonError] = useState(false)

  // 3. Trả hàm export về nguyên bản không truyền tham số
  const handleExportPdf = async () => {
    setIsExporting(true)
    try {
      await exportPostsPdf()
    } finally {
      setIsExporting(false)
    }
  }

  const handleClearFilters = () => {
    setCategoryId('')
    setFromDate('')
    setToDate('')
  }

  const rawPosts = data?.data ?? []

  // 4. THỰC HIỆN LOGIC LỌC THÔNG MINH TRÊN FRONT-END:
  const posts = rawPosts.filter((p) => {
    // Lọc theo chủ đề (Category)
    if (categoryId && String(p.category?.id) !== categoryId) {
      return false
    }

    // Lọc theo thời gian: Từ ngày (created_at >= fromDate)
    if (fromDate && p.created_at) {
      const postDate = p.created_at.split('T')[0] // Lấy định dạng Y-m-d từ chuỗi ISO
      if (postDate < fromDate) return false
    }

    // Lọc theo thời gian: Đến ngày (created_at <= toDate)
    if (toDate && p.created_at) {
      const postDate = p.created_at.split('T')[0]
      if (postDate > toDate) return false
    }

    return true
  })

  const { mutate: validatePost, isPending: isValidating } = useValidatePost()

  const handleAccept = (id: number) => {
    validatePost(
      { id, status: 'Accepted' },
      { onSuccess: () => toast.success(t('admin_posts_accept_success')) },
    )
  }

  const handleReject = (id: number) => {
    setRejectReason('')
    setRejectReasonError(false)
    setRejectModal({ show: true, postId: id })
  }

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      setRejectReasonError(true)
      return
    }
    if (rejectModal.postId === null) return

    validatePost(
      {
        id: rejectModal.postId,
        status: 'Rejected',
        reject_reason: rejectReason.trim(),
      },
      {
        onSuccess: () => {
          toast.success(t('admin_posts_reject_success'))
          setRejectModal({ show: false, postId: null })
        },
      },
    )
  }

  const handleCloseRejectModal = () => {
    if (isValidating) return
    setRejectModal({ show: false, postId: null })
  }

  return (
    <div className="container py-4 px-3" style={{ maxWidth: '1100px' }}>
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="fw-bold mb-1">{t('admin_posts_title')}</h4>
            <p className="text-secondary mb-0">{t('admin_posts_subtitle')}</p>
          </div>
          <Button
            variant="outline-danger"
            className="d-flex align-items-center gap-2"
            onClick={handleExportPdf}
            disabled={isExporting}
          >
            <FileDown size={18} />
            <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
          </Button>
        </div>
      </div>

      {/* THANH BỘ LỌC (FILTERS BAR) */}
      <Card className="border-0 shadow-sm rounded-4 mb-4 bg-body-tertiary">
        <Card.Body className="p-3">
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-secondary d-flex align-items-center gap-1">
                  <Filter size={14} /> Chọn chủ đề
                </Form.Label>
                <Form.Select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="rounded-3"
                >
                  <option value="">Tất cả chủ đề</option>
                  {Object.entries(CATEGORY_NAME).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-secondary">Từ ngày</Form.Label>
                <Form.Control
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="rounded-3"
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-secondary">Đến ngày</Form.Label>
                <Form.Control
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="rounded-3"
                />
              </Form.Group>
            </Col>

            <Col md={2} className="d-grid">
              {(categoryId || fromDate || toDate) ? (
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
                  <th className="px-4 py-3">{t('admin_posts_col_id')}</th>
                  <th className="py-3">{t('admin_posts_col_author')}</th>
                  <th className="py-3">{t('admin_posts_col_content')}</th>
                  <th className="py-3">{t('admin_posts_col_category')}</th>
                  <th className="py-3">{t('admin_posts_col_visibility')}</th>
                  <th className="py-3">{t('admin_posts_col_status')}</th>
                  <th className="py-3" style={{ width: '120px' }}>
                    {t('admin_posts_col_action')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {posts?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-secondary py-4">
                      {t('admin_posts_empty')}
                    </td>
                  </tr>
                ) : (
                  posts?.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4">{p.id}</td>
                      <td>{p.author?.full_name ?? p.author?.email ?? '—'}</td>
                      <td style={{ maxWidth: '320px' }}>
                        <span
                          className="d-inline-block text-truncate"
                          style={{ maxWidth: '300px' }}
                          title={p.content ?? ''}
                        >
                          {p.content ?? '—'}
                        </span>
                      </td>
                      <td>
                        <Badge
                          bg={
                            CATEGORY_VARIANT[p.category?.id ?? 0] ?? 'secondary'
                          }
                        >
                          {CATEGORY_NAME[p.category?.id ?? 0] ?? '—'}
                        </Badge>
                      </td>
                      <td>
                        <Badge
                          bg={VISIBILITY_VARIANT[p.visibility] ?? 'secondary'}
                        >
                          {p.visibility}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={STATUS_VARIANT[p.status] ?? 'secondary'}>
                          {p.status}
                        </Badge>
                      </td>
                      <td>
                        {p.status === 'Pending' ? (
                          <>
                            <Button
                              variant="link"
                              className="text-decoration-none p-2 rounded-3 text-success"
                              title="Accept"
                              disabled={isValidating}
                              onClick={() => handleAccept(p.id)}
                            >
                              <Check size={18} />
                            </Button>
                            <Button
                              variant="link"
                              className="text-decoration-none p-2 rounded-3 text-danger"
                              title="Reject"
                              disabled={isValidating}
                              onClick={() => handleReject(p.id)}
                            >
                              <X size={18} />
                            </Button>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={rejectModal.show} onHide={handleCloseRejectModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('admin_posts_reject_modal_title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>
              {t('admin_posts_reject_modal_reason_label')}{' '}
              <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder={t('admin_posts_reject_modal_reason_placeholder')}
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value)
                if (e.target.value.trim()) setRejectReasonError(false)
              }}
              isInvalid={rejectReasonError}
            />
            <Form.Control.Feedback type="invalid">
              {t('admin_posts_reject_modal_reason_required')}
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseRejectModal}
            disabled={isValidating}
          >
            {t('admin_posts_reject_modal_cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmReject}
            disabled={isValidating}
          >
            {isValidating ? (
              <Spinner size="sm" animation="border" />
            ) : (
              t('admin_posts_reject_modal_confirm')
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}