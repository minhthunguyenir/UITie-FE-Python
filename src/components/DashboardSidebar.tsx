import { Link, useNavigate } from '@tanstack/react-router'
import {
  Home,
  Users,
  MessageCircle,
  User,
  Settings,
  Bookmark,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStore } from '@tanstack/react-store'
import { authStore, clearAuth } from '#/lib/auth'
import { useEffect, useState } from 'react'
import { Image } from 'react-bootstrap'
import UserAvatar from './UserAvatar'

const NAV_ITEMS = [
  { key: 'nav_home', icon: Home, to: '/dashboard' },
  { key: 'nav_profile', icon: User, to: '/profile' },
  { key: 'nav_messages', icon: MessageCircle, to: '/messages' },
] as const

interface DashboardSidebarProps {
  className?: string
  onClose?: () => void
}

export default function DashboardSidebar({
  className = '',
  onClose,
}: DashboardSidebarProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useStore(authStore, (s) => s.user)
  const [mounted, setMounted] = useState(false)
  const isAdminUser = user?.role === 'Admin' || user?.role === 'Super Admin'

  useEffect(() => {
    setMounted(true)
  }, [])

  function handleLogout() {
    onClose?.()
    clearAuth()
    void navigate({ to: '/login' })
  }

  const labels: Record<string, string> = {
    nav_home: t('nav_home'),
    nav_messages: t('nav_messages'),
    nav_profile: t('nav_profile'),
  }

  return (
    <aside
      className={`d-flex flex-column justify-content-between py-4 px-3 h-100 ${className}`}
    >
      {/* Logo */}
      <div>
        <div className="mb-4 px-3">
          <Image src="/logo-uitie.png" alt="UITie" width={50} height={50} />
          <span>UITie</span>
        </div>

        {/* Nav items */}
        <nav className="d-flex flex-column gap-1">
          {NAV_ITEMS.map(({ key, icon: Icon, to }) => (
            <Link
              key={key}
              to={to}
              onClick={onClose}
              className="d-flex align-items-center gap-3 rounded px-3 py-2 text-decoration-none text-secondary fw-medium border-0 bg-transparent"
              activeProps={{
                className: 'text-primary bg-primary bg-opacity-10 fw-bold',
              }}
            >
              <Icon size={20} />
              <span>{labels[key]}</span>
            </Link>
          ))}

          {mounted && isAdminUser && (
            <Link
              to="/admin"
              onClick={onClose}
              className="d-flex align-items-center gap-3 rounded px-3 py-2 text-decoration-none text-danger fw-semibold border-0 bg-transparent mt-2 border-top pt-3"
              activeProps={{
                className: 'bg-danger bg-opacity-10 fw-bold',
              }}
            >
              <ShieldCheck size={20} />
              <span>{t('nav_admin')}</span>
            </Link>
          )}
        </nav>
      </div>

      {/* User + Logout */}
      <div className="d-flex flex-column gap-3 mt-4">
        {/* User card — luôn render để tránh hydration mismatch */}
        <div className="d-flex align-items-center gap-3 rounded bg-body-tertiary p-2 border">
          <UserAvatar fullName={mounted ? (user?.full_name ?? '') : ''} />
          <div className="text-truncate flex-grow-1">
            <p className="mb-0 fw-bold fs-6 text-truncate">
              {mounted ? (user?.full_name ?? '') : ''}
            </p>
            <p className="mb-0 text-secondary small text-truncate">
              {mounted ? (user?.email ?? '') : ''}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          id="sidebar-logout-btn"
          className="btn btn-outline-danger d-flex align-items-center gap-2 w-100 justify-content-center"
        >
          <LogOut size={20} />
          <span>{t('nav_logout')}</span>
        </button>
      </div>
    </aside>
  )
}
