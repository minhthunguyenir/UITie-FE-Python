import { createFileRoute, redirect } from '@tanstack/react-router'
import { Card } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { isSuperAdmin } from '#/lib/auth'

export const Route = createFileRoute('/admin/settings')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    if (!isSuperAdmin()) {
      throw redirect({ to: '/admin' })
    }
  },
  component: AdminSettingsPage,
})

function AdminSettingsPage() {
  const { t } = useTranslation()
  return (
    <div className="container py-4 px-3" style={{ maxWidth: '1100px' }}>
      <h4 className="fw-bold mb-1">{t('admin_settings_title')}</h4>
      <p className="text-secondary mb-4">{t('admin_settings_subtitle')}</p>
      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-4 text-secondary">
          {t('admin_settings_placeholder')}
        </Card.Body>
      </Card>
    </div>
  )
}
