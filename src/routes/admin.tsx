import AdminSidebar from '#/components/admin/AdminSidebar'
import AuthGuard from '#/components/AuthGuard'
import LocaleSwitcher from '#/components/LocaleSwitcher'
import ThemeToggle from '#/components/ThemeToggle'
import { isAuthenticated } from '#/lib/auth'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Menu, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Offcanvas } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/admin')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <AuthGuard requireAuth={true} redirectTo="/login">
      {/* Burger menu offcanvas */}
      <Offcanvas
        show={menuOpen}
        onHide={() => setMenuOpen(false)}
        className="bg-body-tertiary"
        style={{ width: '280px' }}
      >
        <Offcanvas.Body className="p-0 d-flex flex-column">
          <AdminSidebar onClose={() => setMenuOpen(false)} />
        </Offcanvas.Body>
      </Offcanvas>

      <div className="d-flex flex-column min-vh-100 bg-body">
        <header
          className="sticky-top z-3 d-flex align-items-center gap-3 border-bottom bg-body-tertiary bg-opacity-75 px-3 px-lg-4 flex-shrink-0"
          style={{ height: '56px', backdropFilter: 'blur(10px)' }}
        >
          {/* Burger button */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="btn btn-sm p-1 border-0 text-danger flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div className="d-flex align-items-center gap-2 fw-bold text-danger">
            <ShieldCheck size={18} />
            <span>{t('admin_header_title')}</span>
          </div>

          <div className="ms-auto d-flex align-items-center gap-2">
            <LocaleSwitcher variant="pills" />
            <ThemeToggle />
          </div>
        </header>

        <main className="d-flex flex-grow-1 min-vh-0">
          <div className="flex-grow-1 min-vw-0 overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
