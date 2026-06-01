import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { isAuthenticated } from '#/lib/auth'
import LocaleSwitcher from '#/components/LocaleSwitcher'
import ThemeToggle from '#/components/ThemeToggle'

export const Route = createFileRoute('/_public')({
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: PublicLayout,
})

function PublicLayout() {
  return (
    <div className="position-relative min-vh-100 bg-body">
      {/* Top utility bar */}
      <header className="position-absolute top-0 end-0 z-3 d-flex align-items-center gap-3 p-4">
        <LocaleSwitcher variant="pills" />
        <ThemeToggle />
      </header>

      {/* Centered content */}
      <main className="d-flex min-vh-100 align-items-center justify-content-center px-3 py-5">
        <div className="w-100" style={{ maxWidth: '400px' }}>
          {/* Logo */}
          <div className="mb-5 text-center">
            <span className="fs-2 fw-bold text-primary">
              UITie
            </span>
            <p className="mt-1 small text-muted fw-medium text-uppercase tracking-wide">
              Campus Social Network
            </p>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
