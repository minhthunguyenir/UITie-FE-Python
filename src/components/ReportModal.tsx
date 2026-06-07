import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useCreateReport } from '#/api/useReport'; // Đảm bảo đường dẫn này khớp với dự án của bạn

interface ReportModalProps {
  postId: number | string;
  userId?: number | string;
  onClose: () => void;
}

export default function ReportModal({ postId, userId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('');
  
  // Sử dụng Hook thực tế thay vì giả lập
  const { mutate: createReport, isPending } = useCreateReport();

  const handleSubmit = () => {
    // 1. Kiểm tra dữ liệu đầu vào
    if (!reason.trim()) {
      return; // Thông báo lỗi đã được xử lý tự động hoặc bạn có thể thêm toast ở đây
    }

    // 2. Gọi API thực tế dựa vào việc Modal đang nhận postId hay userId
    // Thư dùng câu lệnh điều kiện if-else để rẽ nhánh nha:
    if (userId) {
      // 🚩 TRƯỜNG HỢP: BÁO CÁO TÀI KHOẢN (Bấm từ trang cá nhân)
      createReport(
        { 
          // Ép kiểu về Number để đảm bảo an toàn gửi xuống Backend
          post_id: Number(userId), 
          reason: reason 
        },
        {
          onSuccess: () => {
            onClose(); 
          },
        }
      );
    } else {
      // 🚩 TRƯỜNG HỢP: BÁO CÁO BÀI VIẾT (Cũ ngoài bảng tin Feed)
      createReport(
        { 
          post_id: Number(postId), 
          reason: reason 
        },
        {
          onSuccess: () => {
            onClose(); 
          },
        }
      );
    }
  };

  return (
    <Modal show={true} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="text-danger">
          <i className="fa-solid fa-triangle-exclamation me-2"></i> 
          Báo cáo vi phạm
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Form.Group>
          {/* 🚩 ĐOẠN ĐỔI CHỮ THÔNG MINH: Nếu có userId thì hiện báo cáo tài khoản, ngược lại hiện bài viết */}
          <Form.Label className="fw-bold">
            {userId ? `Lý do báo cáo tài khoản #${userId}:` : `Lý do báo cáo bài viết #${postId}:`}
          </Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            placeholder={userId ? "Ví dụ: Tài khoản giả mạo, spam, lừa đảo, xúc phạm người khác..." : "Ví dụ: Nội dung lừa đảo, xúc phạm, spam, sai sự thật..."}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isPending}
            autoFocus
          />
        </Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={onClose} 
          disabled={isPending}
        >
          Hủy bỏ
        </Button>
        <Button 
          variant="danger" 
          onClick={handleSubmit} 
          disabled={isPending || !reason.trim()}
        >
          {isPending ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Đang gửi...
            </>
          ) : (
            'Gửi báo cáo'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}