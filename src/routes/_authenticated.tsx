import AuthGuard from '#/components/AuthGuard'
import DashboardSidebar from '#/components/DashboardSidebar'
import LocaleSwitcher from '#/components/LocaleSwitcher'
import RightSidebar from '#/components/RightSidebar'
import ThemeToggle from '#/components/ThemeToggle'
import { isAuthenticated } from '#/lib/auth'
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { Menu, Search } from 'lucide-react'
import { useState } from 'react'
import { Offcanvas } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { t } = useTranslation()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const showRightSidebar = pathname === '/dashboard'
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

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
          <DashboardSidebar onClose={() => setMenuOpen(false)} />
        </Offcanvas.Body>
      </Offcanvas>

      <div className="d-flex flex-column min-vh-100 bg-body">
        {/* Top Navbar */}
        <header
          className="sticky-top z-3 d-flex align-items-center gap-3 border-bottom bg-body-tertiary bg-opacity-75 px-3 px-lg-4 flex-shrink-0"
          style={{ height: '56px', backdropFilter: 'blur(10px)' }}
        >
          {/* Burger button */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="btn btn-sm p-1 border-0 text-secondary flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          {/* Search */}
          <div
            className="position-relative flex-grow-1"
            style={{ maxWidth: '400px' }}
          >
            <Search
              className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
              size={16}
            />
            <input
              type="search"
              id="dashboard-search"
              placeholder={t('dashboard_search')}
              className="form-control form-control-sm bg-body-secondary border-0 ps-5 rounded-pill text-body"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDownCapture={(e) =>
                e.key === 'Enter' &&
                search.trim() !== '' &&
                navigate({ to: '/dashboard/search?keyword=' + search })
              }
            />
          </div>

          {/* Controls */}
          <div className="ms-auto d-flex align-items-center gap-2">
            <LocaleSwitcher variant="pills" />
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="d-flex flex-grow-1 min-vh-0">
          {/* Feed area */}
          <div className="flex-grow-1 min-vw-0 overflow-y-auto">
            <Outlet />
          </div>

          {/* Right Sidebar */}
          {showRightSidebar && (
            <aside
              className="d-none d-xl-block border-start bg-body-tertiary overflow-y-auto flex-shrink-0"
              style={{ width: '300px' }}
            >
              <RightSidebar />
            </aside>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
