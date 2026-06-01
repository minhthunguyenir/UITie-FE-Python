import { Form, Button, Alert } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { fakeResetPassword } from '#/lib/fake-api'
import { Spinner, Card } from 'react-bootstrap'
import { AlertCircle, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react'

const searchSchema = z.object({
  token: z.string().optional().default(''),
})

export const Route = createFileRoute('/_public/reset-password')({
  validateSearch: searchSchema,
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { token } = Route.useSearch()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => fakeResetPassword(token, password),
  })

  useEffect(() => {
    if (mutation.isSuccess) {
      const timer = setTimeout(() => {
        void navigate({ to: '/login' })
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [mutation.isSuccess, navigate])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationError(null)
    if (password !== confirm) {
      setValidationError(t('error_passwords_mismatch'))
      return
    }
    mutation.mutate()
  }

  if (mutation.isSuccess) {
    return (
      <Card className="border-0 shadow-lg rounded-4 overflow-hidden text-center">
        <Card.Body className="p-4 p-sm-5">
          <div className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10" style={{ width: '56px', height: '56px' }}>
            <CheckCircle2 size={28} className="text-success" />
          </div>
          <h4 className="fw-bold mb-0">
            {t('reset_success')}
          </h4>
        </Card.Body>
      </Card>
    )
  }

  const displayError =
    validationError ??
    (mutation.error instanceof Error ? t('error_generic') : null)

  return (
    <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
      <Card.Body className="p-4 p-sm-5">
        <div className="mb-4 text-center">
          <h4 className="fw-bold mb-1">
            {t('reset_title')}
          </h4>
          <p className="text-muted small mb-0">
            {t('reset_subtitle')}
          </p>
        </div>

        {displayError && (
          <Alert variant="danger" className="d-flex align-items-center gap-2 py-2 px-3 small rounded-3">
            <AlertCircle size={18} />
            <span>{displayError}</span>
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-medium">{t('reset_password')}</Form.Label>
            <div className="position-relative">
              <Form.Control
                type={showPass ? 'text' : 'password'}
                placeholder={t('reset_password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="px-3 py-2 pe-5"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted p-2"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="small fw-medium">{t('reset_confirm')}</Form.Label>
            <Form.Control
              type="password"
              placeholder={t('reset_confirm_placeholder')}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              className="px-3 py-2"
            />
          </Form.Group>

          <Button
            type="submit"
            id="reset-submit-btn"
            variant="primary"
            className="w-100 py-2 fw-medium rounded-3 mb-4"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <Spinner animation="border" size="sm" />
                {t('reset_loading')}
              </span>
            ) : (
              t('reset_submit')
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
  )
}
