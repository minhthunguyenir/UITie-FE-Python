import { useEffect, useState } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { isAdmin, isAuthenticated } from '#/lib/auth'
import { Spinner } from 'react-bootstrap'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth: boolean // true = cần login | false = cần chưa login
  redirectTo: string
}

export default function AuthGuard({
  children,
  requireAuth,
  redirectTo,
}: AuthGuardProps) {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  const currentRoute = useRouterState({
    select: (state) => state.location.pathname,
  })

  useEffect(() => {
    const authed = isAuthenticated()
    const isAdminRole = isAdmin()

    if (!isAdminRole && currentRoute.includes('/admin')) {
      void navigate({ to: '/dashboard' })
      return
    }

    const shouldRedirect = requireAuth ? !authed : authed

    if (shouldRedirect) {
      void navigate({ to: redirectTo })
    } else {
      setChecking(false)
    }
  }, [])

  if (checking) {
    return (
      <div
        className="d-flex align-items-center justify-content-center vh-100 bg-body"
        style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
      >
        <div className="text-center">
          <Spinner
            animation="border"
            variant="primary"
            style={{ width: '2.5rem', height: '2.5rem' }}
          />
          <p className="mt-3 text-secondary small">Đang tải...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
