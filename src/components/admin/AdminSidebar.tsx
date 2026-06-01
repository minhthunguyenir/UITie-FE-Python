import { Link, useNavigate } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Users,
  FileText,
  Flag,
  ArrowLeftCircle,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStore } from '@tanstack/react-store'
import { authStore, clearAuth } from '#/lib/auth'
import { useEffect, useState } from 'react'
import UserAvatar from '../UserAvatar'

import type { UserRole } from '#/types/user'

const NAV_ITEMS: ReadonlyArray<{
  key: string
  icon: typeof LayoutDashboard
  to: string
  roles: ReadonlyArray<UserRole>
}> = [
  {
    key: 'admin_nav_overview',
    icon: LayoutDashboard,
    to: '/admin',
    roles: ['Admin', 'Super Admin'],
  },
  {
    key: 'admin_nav_users',
    icon: Users,
    to: '/admin/users',
    roles: ['Super Admin'],
  },
  {
    key: 'admin_nav_posts',
    icon: FileText,
    to: '/admin/posts',
    roles: ['Admin', 'Super Admin'],
  },
  {
    key: 'admin_nav_reports',
    icon: Flag,
    to: '/admin/reports',
    roles: ['Admin', 'Super Admin'],
  },
]

interface AdminSidebarProps {
  className?: string
  onClose?: () => void
}

export default function AdminSidebar({
  className = '',
  onClose,
}: AdminSidebarProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useStore(authStore, (s) => s.user)
  const [mounted, setMounted] = useState(false)
  const role = user?.role
  const visibleItems = NAV_ITEMS.filter((item) =>
    role ? item.roles.includes(role) : false,
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  function handleLogout() {
    onClose?.()
    clearAuth()
    void navigate({ to: '/login' })
  }

  return (
    <aside
      className={`d-flex flex-column justify-content-between py-4 px-3 h-100 ${className}`}
    >
      <div>
        <div className="mb-4 px-3 d-flex align-items-center gap-2">
          <ShieldCheck size={22} className="text-danger" />
          <span className="fs-4 fw-black text-danger">UITie Admin</span>
        </div>

        <nav className="d-flex flex-column gap-1">
          {visibleItems.map(({ key, icon: Icon, to }) => (
            <Link
              key={key}
              to={to}
              onClick={onClose}
              activeOptions={{ exact: to === '/admin' }}
              className="d-flex align-items-center gap-3 rounded px-3 py-2 text-decoration-none text-secondary fw-medium border-0 bg-transparent"
              activeProps={{
                className: 'text-danger bg-danger bg-opacity-10 fw-bold',
              }}
            >
              <Icon size={20} />
              <span>{t(key)}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-3 border-top pt-3">
          <Link
            to="/dashboard"
            onClick={onClose}
            className="d-flex align-items-center gap-3 rounded px-3 py-2 text-decoration-none text-secondary fw-medium"
          >
            <ArrowLeftCircle size={20} />
            <span>{t('admin_back_to_app')}</span>
          </Link>
        </div>
      </div>

      <div className="d-flex flex-column gap-3 mt-4">
        <div className="d-flex align-items-center gap-3 rounded bg-body-tertiary p-2 border">
          <UserAvatar fullName={mounted ? (user?.full_name ?? '') : ''} />
          <div className="text-truncate flex-grow-1">
            <p className="mb-0 fw-bold fs-6 text-truncate">
              {mounted ? (user?.full_name ?? '') : ''}
            </p>
            <p className="mb-0 text-danger small text-truncate fw-semibold">
              {role === 'Super Admin'
                ? t('admin_role_super_admin')
                : role === 'Admin'
                  ? t('admin_role_admin')
                  : t('admin_role_student')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          id="admin-sidebar-logout-btn"
          className="btn btn-outline-danger d-flex align-items-center gap-2 w-100 justify-content-center"
        >
          <LogOut size={20} />
          <span>{t('nav_logout')}</span>
        </button>
      </div>
    </aside>
  )
}
