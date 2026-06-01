import AuthGuard from '#/components/AuthGuard'
import { useLogin } from '#/api/useLogin'
import { isAuthenticated } from '#/lib/auth'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, Form, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_public/login')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    if (isAuthenticated()) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { mutateAsync, isPending } = useLogin() // isPending === isLoading

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form) // email + password
    await mutateAsync({
      email: data.get('email') as string,
      password: data.get('password') as string,
    })
  }

  return (
    <AuthGuard requireAuth={false} redirectTo="/dashboard">
      <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
        <Card.Body className="p-4 p-sm-5">
          <div className="mb-4 text-center">
            <h4 className="fw-bold mb-1">{t('login_title')}</h4>
            <p className="text-muted small mb-0">{t('login_subtitle')}</p>
          </div>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-medium">
                {t('login_email')}
              </Form.Label>
              <Form.Control
                type="email"
                placeholder={t('login_email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                name="email"
                className="px-3 py-2"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <Form.Label className="small fw-medium mb-0">
                  {t('login_password')}
                </Form.Label>
                <Link
                  to="/forgot-password"
                  className="text-decoration-none small text-primary fw-medium"
                >
                  {t('login_forgot')}
                </Link>
              </div>
              <div className="position-relative">
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('login_password_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  name="password"
                  className="px-3 py-2 pe-5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted p-2"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Form.Group>

            <Button
              type="submit"
              id="login-submit-btn"
              variant="primary"
              className="w-100 py-2 fw-medium rounded-3 mb-4"
              disabled={isPending}
            >
              {isPending ? (
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <Spinner animation="border" size="sm" />
                  {t('login_loading')}
                </span>
              ) : (
                t('login_submit')
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </AuthGuard>
  )
}
