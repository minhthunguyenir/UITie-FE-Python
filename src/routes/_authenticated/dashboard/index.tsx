import { createFileRoute } from '@tanstack/react-router'
import FeedPostCard from '#/components/FeedPostCard'
import Spinner from 'react-bootstrap/Spinner'
import { Nav } from 'react-bootstrap'
import CreatePostForm from '#/components/CreatePostForm'
import { useFeedPosts } from '#/api/usePost'
import { useState } from 'react'
import { Globe, Users } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {
  // 1. Tạo state quản lý tab hiện tại (Mặc định là 'all' - Khám phá toàn trường)
  const [currentScope, setCurrentScope] = useState<'all' | 'following'>('all')

  // 2. Truyền state currentScope vào hook để tự động refetch khi bấm đổi tab
  const { data: postsData, isLoading } = useFeedPosts(currentScope)

  // 3. Vì Backend trả về cấu trúc phân trang, mảng bài viết thực sự nằm trong postsData.data
  // Nếu postsData chưa tải xong hoặc không có, mình cho nó mặc định là mảng rỗng [] để tránh lỗi crash web
  const listPosts = Array.isArray(postsData) 
    ? postsData 
    : (postsData?.data || postsData?.data?.data || [])

  return (
    <div className="container py-4 px-3" style={{ maxWidth: '600px' }}>
      <h4 className="fw-bold mb-4">Bảng tin của bạn</h4>
      <CreatePostForm />

      {/* 🚩 THANH TAB KẾT NỐI CỘNG ĐỒNG: Khám phá & Đang theo dõi */}
      <Nav 
        variant="tabs" 
        activeKey={currentScope} 
        onSelect={(k: any) => k && setCurrentScope(k)} 
        className="mb-4 mt-3 fw-semibold border-bottom"
      >
        <Nav.Item>
          <Nav.Link eventKey="all" className="px-3 pb-2 d-flex align-items-center gap-2"><Globe size={16} /> Khám phá</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="following" className="px-3 pb-2 d-flex align-items-center gap-2"><Users size={16} /> Đang theo dõi</Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Phần hiển thị danh sách bài viết */}
      {isLoading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {/* Duyệt mảng qua biến listPosts đã được bóc tách an toàn */}
          {listPosts.length > 0 ? (
            listPosts.map((post: any) => (
              <FeedPostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="text-center py-5 text-secondary border rounded-4 bg-body-tertiary">
              <p className="mb-0">Chưa có bài viết nào trong luồng này.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}