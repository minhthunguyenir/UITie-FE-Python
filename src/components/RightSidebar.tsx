import { Button } from 'react-bootstrap'
import { UserPlus, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTrendingCategories } from '#/api/useCategory'
import { useSuggestedFollows } from '#/api/useSuggestedFollows'
import UserAvatar from './UserAvatar'
import { Link } from '@tanstack/react-router'
import { useToggleFollow } from '#/api/useProfile'
import toast from 'react-hot-toast'

export default function RightSidebar() {
  const { t } = useTranslation()
  const { data: trendingCategories = [], isLoading } = useTrendingCategories()
  const { data: suggestedFollows = [], isLoading: isLoadingSuggest, refetch: refetchSuggested } = useSuggestedFollows()
  const { mutate: toggleFollow, isPending: isTogglingFollow } = useToggleFollow()

  return (
    <aside className="d-flex flex-column gap-4 py-4 px-3">
      {/* Trending Topics */}
      <div>
        <div className="mb-3 d-flex align-items-center gap-2">
          <TrendingUp className="text-primary" size={18} />
          <h6 className="mb-0 fw-bold">{t('dashboard_trending')}</h6>
        </div>
        
        {isLoading ? (
          <div className="text-muted small">Đang tải...</div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {trendingCategories.map((category) => (
              <div key={category.id} className="d-flex align-items-center justify-content-between gap-2">
                <h6 className="mb-0 fw-bold text-truncate" title={category.category_name}>{category.category_name}</h6>
                <p className="mb-0 text-muted flex-shrink-0" style={{ fontSize: '0.75rem' }}>
                  {category.post_count} posts
                </p>
              </div>
            ))}
            {trendingCategories.length === 0 && <div className="text-muted small">Không có dữ liệu.</div>}
          </div>
        )}
      </div>

      <hr className="my-1 border-secondary" />

      {/* Suggested Users */}
      <section>
        <div className="mb-3 d-flex align-items-center gap-2">
          <UserPlus className="text-primary" size={18} />
          <h6 className="mb-0 fw-bold">{t('dashboard_suggested')}</h6>
        </div>
        
        {isLoadingSuggest ? (
          <div className="text-muted small">Đang tải...</div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {suggestedFollows.map((user) => {
              const matchText = user.match_score > 0 
                ? `Có ${user.match_score} thông tin chung`
                : 'Gợi ý cho bạn'

              return (
                <div key={user.id} className="d-flex align-items-center gap-2">
                  <Link
                    to="/profile"
                    search={{ user: String(user.id) }}
                    className="text-decoration-none flex-shrink-0"
                  >
                    <UserAvatar fullName={user.full_name} avatar={user.avatar} />
                  </Link>
                  <div className="flex-grow-1 text-truncate">
                    <Link
                      to="/profile"
                      search={{ user: String(user.id) }}
                      className="text-decoration-none text-body"
                    >
                      <p className="mb-0 fw-semibold text-truncate small" title={user.full_name}>
                        {user.full_name}
                      </p>
                    </Link>
                    <p className="mb-0 text-muted text-truncate" style={{ fontSize: '0.75rem' }} title={matchText}>
                      {matchText}
                    </p>
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="rounded-pill fw-medium py-1 px-3"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => toggleFollow(user.id, {
                      onSuccess: () => {
                        toast.success('Đã theo dõi thành công!')
                        refetchSuggested()
                      },
                      onError: () => {
                        toast.error('Có lỗi xảy ra, vui lòng thử lại.')
                      }
                    })}
                    disabled={isTogglingFollow}
                  >
                    Follow
                  </Button>
                </div>
              )
            })}
            {suggestedFollows.length === 0 && <div className="text-muted small">Không có gợi ý nào.</div>}
          </div>
        )}
      </section>
    </aside>
  )
}
