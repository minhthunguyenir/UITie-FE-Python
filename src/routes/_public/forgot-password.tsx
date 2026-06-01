import { Form, Button, Alert } from 'react-bootstrap'
import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fakeForgotPassword } from '#/lib/fake-api'
import { Spinner, Card } from 'react-bootstrap'
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import AuthGuard from '#/components/AuthGuard'

export const Route = createFileRoute('/_public/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')

  const mutation = useMutation({
    mutationFn: () => fakeForgotPassword(email),
  })

  const apiError = mutation.error instanceof Error ? t('error_generic') : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  if (mutation.isSuccess) {
    return (
      <AuthGuard requireAuth={false} redirectTo="/dashboard">
        <Card className="border-0 shadow-lg rounded-4 overflow-hidden text-center">
          <Card.Body className="p-4 p-sm-5">
            <div
              className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10"
              style={{ width: '56px', height: '56px' }}
            >
              <CheckCircle2 size={28} className="text-success" />
            </div>
            <h4 className="fw-bold mb-2">{t('forgot_success')}</h4>
            <p className="text-muted small mb-4">
              We sent a link to <strong>{email}</strong>
            </p>
            <Link
              to="/login"
              className="d-inline-flex align-items-center gap-2 text-decoration-none small fw-medium text-primary"
            >
              <ArrowLeft size={16} />
              {t('forgot_back')}
            </Link>
          </Card.Body>
        </Card>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth={false} redirectTo="/dashboard">
      <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
        <Card.Body className="p-4 p-sm-5">
          <div className="mb-4 text-center">
            <h4 className="fw-bold mb-1">{t('forgot_title')}</h4>
            <p className="text-muted small mb-0">{t('forgot_subtitle')}</p>
          </div>

          {apiError && (
            <Alert
              variant="danger"
              className="d-flex align-items-center gap-2 py-2 px-3 small rounded-3"
            >
              <AlertCircle size={18} />
              <span>{apiError}</span>
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label className="small fw-medium">
                {t('forgot_email')}
              </Form.Label>
              <Form.Control
                type="email"
                placeholder={t('forgot_email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="px-3 py-2"
              />
            </Form.Group>

            <Button
              type="submit"
              id="forgot-submit-btn"
              variant="primary"
              className="w-100 py-2 fw-medium rounded-3 mb-4"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <Spinner animation="border" size="sm" />
                  {t('forgot_loading')}
                </span>
              ) : (
                t('forgot_submit')
              )}
            </Button>
          </Form>

          <div className="text-center">
            <Link
              to="/login"
              className="d-inline-flex align-items-center gap-2 text-decoration-none small text-muted hover:text-primary transition-colors"
            >
              <ArrowLeft size={16} />
              {t('forgot_back')}
            </Link>
          </div>
        </Card.Body>
      </Card>
    </AuthGuard>
  )
}
