# DOOH Business Requirements (BRD)

Đặc tả yêu cầu nghiệp vụ cốt lõi của nền tảng DOOH Media Platform.

---

## 1. Phân Hệ Quản Lý Màn Hình (Venue Management)
- **Tạo & Quản lý Venue**: Mã màn hình (`code`), tên địa điểm, địa chỉ/toạ độ GPS, độ phân giải (16:9 ngang, 9:16 dọc hoặc custom px).
- **Bảo mật phần cứng**: Mỗi Venue được cấp 1 `secret_key` tự động để phục vụ xác thực chữ ký HMAC và mã hóa token.
- **Giả lập màn hình (Screen Simulator)**: Nút xem mô phỏng trực quan phát sóng ngay trên CMS trước khi nghiệm thu ngoài trời.

---

## 2. Phân Hệ Phân Phối Quảng Cáo (Delivery & Line Items)
- **Cấu trúc**: `Campaign` (Chiến dịch lớn) $\rightarrow$ `Line Items` (Từng hạng mục phát sóng).
- **Định dạng Creative hỗ trợ**:
  - **Banner Ảnh**: JPG, PNG, WebP (cài đặt `duration_seconds` đếm ngược).
  - **Video**: MP4 (chuẩn H.264/AAC, tự động chuyển bài khi kết thúc video).
  - **HTML5 Link**: Nhúng iframe sandbox tương tác.
  - **VAST 2.0 – 4.0**: Nhúng XML Tag của các đối tác Ad Network/Agency.
- **Quy tắc phân phối (Pacing & Caps)**:
  - Chọn danh sách Venue phát sóng (`line_item_venues`).
  - Cài đặt thời gian chạy (`start_date` đến `end_date`).
  - Mục tiêu số lượt phát toàn chiến dịch (`target_impressions`).
  - Giới hạn trần phát sóng mỗi ngày (`daily_impression_cap`).
  - Chế độ phân bổ: `evenly` (chia đều theo khung giờ) hoặc `asap` (phát tối đa đến khi chạm trần).

---

## 3. Phân Hệ Đo Lường & Báo Cáo (Tracking & Proof of Play)
- **Hai sự kiện bắt buộc**:
  - `Impression`: Kích hoạt ngay tại giây đầu tiên khi quảng cáo bắt đầu render trên màn hình.
  - `Complete`: Kích hoạt khi video quảng cáo phát trọn vẹn 100% thời lượng.
- **Cơ chế Opaque Token (:hash)**: Toàn bộ thông tin định danh được mã hóa AES-256-GCM thành 1 chuỗi token duy nhất trên URL (`GET /api/v1/tracking/imp/:hash`).
- **Nghiệm thu & Tính tiền (Proof of Play)**:
  - Bộ lọc báo cáo đa chiều trên CMS: Lọc theo Line Item, Venue, Khoảng ngày.
  - Thống kê tổng số lượt phát, tổng số lượt xem hết, tỷ lệ hoàn thành (Completion Rate).
  - Xuất dữ liệu đối soát minh bạch phục vụ thanh toán hợp đồng.
