import { exportStatisticsPdf, useGetStatistics } from '#/api/useAdmin'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  BookOpen,
  FileDown,
  FileText,
  Flag,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, Card, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/admin/')({
  component: AdminOverviewPage,
})

const STATS = [
  {
    key: 'users' as const,
    labelKey: 'admin_stat_users',
    icon: Users,
    to: '/admin/users',
    color: 'text-primary',
    bg: 'bg-primary bg-opacity-10',
  },
  {
    key: 'posts' as const,
    labelKey: 'admin_stat_posts',
    icon: FileText,
    to: '/admin/posts',
    color: 'text-success',
    bg: 'bg-success bg-opacity-10',
  },
  {
    key: 'reports' as const,
    labelKey: 'admin_stat_reports',
    icon: Flag,
    to: '/admin/reports',
    color: 'text-danger',
    bg: 'bg-danger bg-opacity-10',
  },
]

const CATEGORY_COLORS = [
  { color: 'text-primary', bg: 'bg-primary bg-opacity-10' },
  { color: 'text-success', bg: 'bg-success bg-opacity-10' },
  { color: 'text-warning', bg: 'bg-warning bg-opacity-10' },
  { color: 'text-info', bg: 'bg-info bg-opacity-10' },
  { color: 'text-danger', bg: 'bg-danger bg-opacity-10' },
  { color: 'text-secondary', bg: 'bg-secondary bg-opacity-10' },
]

function AdminOverviewPage() {
  const { t } = useTranslation()
  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading } = useGetStatistics()
  const statistics = data?.data

  const finalStats = useMemo(
    () =>
      STATS.map((stat) => ({
        ...stat,
        // @ts-ignore
        value: statistics?.[stat.key] ?? '—',
      })),
    [statistics],
  )

  const handleExportPdf = async () => {
    setIsExporting(true)
    try {
      await exportStatisticsPdf()
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="container py-4 px-3" style={{ maxWidth: '1100px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">{t('admin_overview_title')}</h4>
          <p className="text-secondary mb-0">{t('admin_overview_subtitle')}</p>
        </div>
        <Button
          variant="outline-danger"
          className="d-flex align-items-center gap-2"
          onClick={handleExportPdf}
          disabled={isExporting}
        >
          <FileDown size={18} />
          <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="danger" />
        </div>
      ) : (
        <>
          {/* Main stats */}
          <div className="row g-3 mb-4">
            {finalStats.map(
              ({ key, value, labelKey, icon: Icon, to, color, bg }) => (
                <div key={key} className="col-12 col-sm-6 col-lg-3">
                  <Link to={to} className="text-decoration-none">
                    <Card className="border-0 shadow-sm rounded-4 h-100">
                      <Card.Body className="p-3 d-flex align-items-center gap-3">
                        <div
                          className={`rounded-3 d-flex align-items-center justify-content-center ${bg} ${color}`}
                          style={{
                            width: '48px',
                            height: '48px',
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={24} />
                        </div>
                        <div>
                          <p className="mb-0 small text-secondary">
                            {t(labelKey)}
                          </p>
                          <p className="mb-0 fs-4 fw-bold text-body">{value}</p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Link>
                </div>
              ),
            )}
          </div>

          {/* Posts by category */}
          {statistics?.postByCategory &&
            statistics.postByCategory.length > 0 && (
              <>
                <h6 className="fw-semibold text-secondary mb-3">
                  {t('admin_stat_by_category')}
                </h6>
                <div className="row g-3">
                  {statistics.postByCategory.map((cat, index) => {
                    const { color, bg } =
                      CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                    return (
                      <div
                        key={cat.category_name}
                        className="col-12 col-sm-6 col-lg-3"
                      >
                        <Card className="border-0 shadow-sm rounded-4 h-100">
                          <Card.Body className="p-3 d-flex align-items-center gap-3">
                            <div
                              className={`rounded-3 d-flex align-items-center justify-content-center ${bg} ${color}`}
                              style={{
                                width: '48px',
                                height: '48px',
                                flexShrink: 0,
                              }}
                            >
                              <BookOpen size={24} />
                            </div>
                            <div>
                              <p className="mb-0 small text-secondary">
                                {cat.category_name}
                              </p>
                              <p className="mb-0 fs-4 fw-bold text-body">
                                {cat.total}
                              </p>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
        </>
      )}
    </div>
  )
}
