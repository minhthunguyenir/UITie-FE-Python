import { useSearchPost } from '#/api/usePost'
import { useSearchUser } from '#/api/useUser'
import FeedPostCard from '#/components/FeedPostCard'
import UserCard from '#/components/UserCard'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { Nav, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_authenticated/dashboard/search')({
  component: RouteComponent,
})

function RouteComponent() {
  const { keyword } = useSearch({
    from: '/_authenticated/dashboard/search',
  }) as { keyword: string }
  const { data: posts, isLoading } = useSearchPost(keyword)
  const { data: users, isLoading: isLoadingUsers } = useSearchUser(keyword)
  const { t } = useTranslation()

  const hasPosts = (posts?.data?.length ?? 0) > 0
  const hasUsers = (users?.data?.length ?? 0) > 0

  const defaultTab = hasPosts ? 'posts' : hasUsers ? 'users' : 'posts'
  const [activeTab, setActiveTab] = useState<'posts' | 'users'>(defaultTab)

  const loading = isLoading || isLoadingUsers

  return (
    <div className="py-4 px-3">
      <h4 className="fw-bold mb-1">{t('dashboard_search_title')}</h4>
      {keyword && (
        <p className="text-muted small mb-4">
          {t('dashboard_search_result')}:{' '}
          <span className="fw-semibold text-body">"{keyword}"</span>
        </p>
      )}

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : !hasPosts && !hasUsers ? (
        <div className="text-center py-5 text-muted">
          <p className="mb-0">{t('dashboard_search_no_result')}</p>
        </div>
      ) : (
        <>
          <Nav
            variant="tabs"
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k as 'posts' | 'users')}
            className="mb-4 border-bottom"
          >
            {hasPosts && (
              <Nav.Item>
                <Nav.Link eventKey="posts" className="fw-semibold">
                  {t('dashboard_search_posts')}
                  <span className="ms-2 badge rounded-pill bg-secondary-subtle text-secondary small">
                    {posts?.data?.length}
                  </span>
                </Nav.Link>
              </Nav.Item>
            )}
            {hasUsers && (
              <Nav.Item>
                <Nav.Link eventKey="users" className="fw-semibold">
                  {t('dashboard_search_users')}
                  <span className="ms-2 badge rounded-pill bg-secondary-subtle text-secondary small">
                    {users?.data?.length}
                  </span>
                </Nav.Link>
              </Nav.Item>
            )}
          </Nav>

          {activeTab === 'posts' && hasPosts && (
            <div className="d-flex flex-column">
              {posts?.data?.map((post) => (
                <FeedPostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {activeTab === 'users' && hasUsers && (
            <div className="d-flex flex-column">
              {users?.data?.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
