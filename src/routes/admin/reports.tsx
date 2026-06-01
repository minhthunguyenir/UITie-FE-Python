import { exportReportsPdf } from '#/api/useAdmin'
import { createFileRoute } from '@tanstack/react-router'
import { Check, FileDown, X } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Card, Spinner, Table } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useGetReportList, useValidateReport } from '#/api/useReport'

export const Route = createFileRoute('/admin/reports')({
  component: AdminReportsPage,
})

const STATUS_VARIANT: Record<string, string> = {
  Pending: 'warning',
  Resolved: 'success',
  Dismissed: 'secondary',
}

const TYPE_VARIANT: Record<string, string> = {
  Post: 'primary',
  User: 'danger',
}

function AdminReportsPage() {
  const { t } = useTranslation()
  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading, isError } = useGetReportList()
  const { mutate: validateReport } = useValidateReport()
  const reports = data?.data ?? []

  const handleExportPdf = async () => {
    setIsExporting(true)
    try {
      await exportReportsPdf()
    } finally {
      setIsExporting(false)
    }
  }

  const handleResolveReport = (reportId: number) => {
    validateReport({ reportId, status: 'Resolved' })
  }

  const handleDismissReport = (reportId: number) => {
    validateReport({ reportId, status: 'Dismissed' })
  }

  return (
    <div className="container py-4 px-3" style={{ maxWidth: '1100px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">{t('admin_reports_title')}</h4>
          <p className="text-secondary mb-0">{t('admin_reports_subtitle')}</p>
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

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="d-flex justify-content-center py-5">
              <Spinner animation="border" variant="danger" />
            </div>
          ) : isError ? (
            <div className="p-4 text-danger">{t('error_generic')}</div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="bg-body-tertiary">
                <tr>
                  <th className="px-4 py-3">{t('admin_reports_col_id')}</th>
                  <th className="py-3">{t('admin_reports_col_reporter')}</th>
                  <th className="py-3">
                    {t('admin_reports_col_reported_object')}
                  </th>
                  <th className="py-3">{t('admin_reports_col_reason')}</th>
                  <th className="py-3">{t('admin_reports_col_type')}</th>
                  <th className="py-3">{t('admin_reports_col_status')}</th>
                  <th className="py-3">{t('admin_reports_col_date')}</th>
                  <th className="py-3" style={{ width: '120px' }}>
                    {t('admin_reports_col_action')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-secondary py-4">
                      {t('admin_reports_empty')}
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4">{r.id}</td>
                      <td>
                        {r.reporter?.full_name ?? r.reporter?.email ?? '—'}
                      </td>
                      <td>
                        {r.reported_user?.full_name || r.reported_post?.content}
                      </td>
                      <td>{r.reason}</td>
                      <td>
                        <Badge bg={TYPE_VARIANT[r.target_type] ?? 'secondary'}>
                          {r.target_type}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={STATUS_VARIANT[r.status] ?? 'secondary'}>
                          {r.status}
                        </Badge>
                      </td>
                      <td
                        className="text-secondary"
                        style={{ fontSize: '0.875rem' }}
                      >
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        {r.status === 'Pending' ? (
                          <>
                            <Button
                              variant="link"
                              className="text-decoration-none p-2 rounded-3 text-success"
                              title="Resolve"
                              onClick={() => handleResolveReport(r.id)}
                            >
                              <Check size={18} />
                            </Button>
                            <Button
                              variant="link"
                              className="text-decoration-none p-2 rounded-3 text-danger"
                              title="Dismiss"
                              onClick={() => handleDismissReport(r.id)}
                            >
                              <X size={18} />
                            </Button>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
