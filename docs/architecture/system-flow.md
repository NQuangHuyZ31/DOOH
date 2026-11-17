# Sơ Đồ Hoạt Động & Luồng Dữ Liệu Hệ Thống DOOH (System Flow)

Tài liệu chi tiết toàn bộ các luồng hoạt động chính từ giao diện người dùng, phân phối lịch phát, thu nhận tracking tốc độ cao cho đến lưu trữ và nghiệm thu.

---

## 1. Sơ Đồ Hoạt Động Tổng Thể (End-to-End Architecture Flow)

```mermaid
flowchart TD
    subgraph CMS_Layer ["1. PHÂN HỆ CMS (Laravel + React AntD)"]
        Admin["Admin / Advertiser"]
        CMS_UI["React AntD SPA"]
        CMS_Backend["Laravel Modular Backend"]
        MySQL[(MySQL 8.0<br/>Business Entities)]
    end

    subgraph API_Layer ["2. PHÂN HỆ API (Node.js Thuần + Redis)"]
        NodeAPI["Node.js API Thuần<br/>(Pure node:http, node:crypto)"]
        RedisCache[("Redis 7.0<br/>• Playlist Cache<br/>• Dedup SETNX<br/>• Realtime Counter<br/>• Queue Buffer")]
        Worker["Background Batch Worker<br/>(Mỗi 3 - 5 giây)"]
    end

    subgraph Edge_Screens ["3. THIẾT BỊ ĐẦU CUỐI (Player / Màn Hình LED)"]
        Screen["Màn Hình LED / Android Box<br/>(DOOH Web Player)"]
    end

    subgraph Storage_Layer ["4. LƯU TRỮ LOG & BÁO CÁO (MongoDB)"]
        MongoLogs[("MongoDB: tracking_logs<br/>(Raw Audit Trail - TTL 90 ngày)")]
        MongoAgg[("MongoDB: daily_aggregated_reports<br/>(Aggregated Stats for CMS)")]
    end

    %% Luồng thiết lập
    Admin -->|1. Quản lý Màn hình, Lên Chiến dịch| CMS_UI
    CMS_UI -->|2. RESTful API| CMS_Backend
    CMS_Backend -->|3. Lưu cấu hình| MySQL
    CMS_Backend -.->|4. Xóa cache khi cập nhật| RedisCache

    %% Luồng phát sóng
    Screen -->|5. Lấy Playlist: GET /api/v1/delivery/playlist| NodeAPI
    NodeAPI <-->|Đọc/Ghi Cache| RedisCache
    NodeAPI -.->|Query dữ liệu khi cache miss| MySQL
    NodeAPI -->|6. Trả Playlist kèm URL Token :hash| Screen

    %% Luồng tracking
    Screen -->|7. Bắn Beacon: GET /api/v1/log/imp/:hash| NodeAPI
    NodeAPI -->|8. Giải mã token, Check dedup, Tăng counter, Đẩy queue| RedisCache
    NodeAPI -->|9. Trả ngay HTTP 204 No Content trong < 3ms| Screen

    %% Luồng đồng bộ & báo cáo
    Worker <-->|10. Rút mẻ 500-1000 logs| RedisCache
    Worker -->|11. Bulk insert| MongoLogs
    Worker -->|12. Bulk upsert $inc| MongoAgg
    CMS_Backend -->|13. Query báo cáo siêu tốc < 50ms| MongoAgg
    CMS_Backend -->|14. Trả dữ liệu vẽ biểu đồ| CMS_UI
```

---

## 2. Luồng 1: Thiết Lập Chiến Dịch & Quản Lý Màn Hình (CMS Flow)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin / Nhà Quảng Cáo
    participant UI as CMS React Frontend
    participant API as Laravel CMS Backend
    participant MySQL as MySQL Database
    participant Redis as Redis Cache

    Admin->>UI: 1. Tạo Màn hình (Venue) mới hoặc Chiến dịch (Campaign)
    Admin->>UI: 2. Tạo Line Item (Chọn Venue 1,2,3; ngày chạy; target imp; daily cap)
    Admin->>UI: 3. Tải lên file Video MP4 hoặc Ảnh Banner
    UI->>API: POST /api/delivery/line-items (Gửi thông số & file)
    API->>MySQL: Lưu vào `campaigns`, `line_items`, `creatives`, `line_item_venues`
    API->>Redis: Xóa Cache cũ: DEL playlist:venue:{venue_id}
    API-->>UI: HTTP 201 Created (Kèm link Preview Simulator)
    UI-->>Admin: Hiển thị trạng thái Active & Nút xem mô phỏng
```

---

## 3. Luồng 2: Màn Hình Tải Danh Sách Phát (Playlist Flow)

```mermaid
sequenceDiagram
    autonumber
    actor Player as Màn Hình LED (Player Box)
    participant NodeAPI as Node.js API (Delivery Module)
    participant Redis as Redis Cache
    participant MySQL as MySQL Database

    Player->>NodeAPI: GET /api/v1/delivery/playlist?venue_id=HN-CG-01 (Header: X-DOOH-API-KEY)
    NodeAPI->>Redis: Kiểm tra Cache: GET playlist:venue:HN-CG-01
    alt Cache HIT (Đã có sẵn trong Redis)
        Redis-->>NodeAPI: Trả về JSON Playlist có sẵn
    else Cache MISS (Chưa có hoặc vừa bị xóa)
        NodeAPI->>MySQL: Query Line Items đang active gán cho HN-CG-01
        MySQL-->>NodeAPI: Danh sách Line Items & Creatives
        NodeAPI->>Redis: HGETALL stat:{date}:{item_id}:{venue_id} (Kiểm tra daily cap)
        Note over NodeAPI: Chạy thuật toán Ad Loop 120s (Xen kẽ nhãn hàng, không đụng hàng)
        Note over NodeAPI: Mã hóa Opaque Token :hash cho từng link tracking (AES-256-GCM)
        NodeAPI->>Redis: SET playlist:venue:HN-CG-01 {json} EX 120 (Cache lại)
    end
    NodeAPI-->>Player: HTTP 200 OK (Trả về Playlist chứa URL .../log/imp/:hash)
```

---

## 4. Luồng 3: Thu Nhận Tracking Beacon Siêu Tốc (Tracking Flow)

```mermaid
sequenceDiagram
    autonumber
    actor Player as Màn Hình LED (Player)
    participant NodeAPI as Node.js API (Log Module)
    participant Redis as Redis Buffer & Dedup
    participant Worker as Batch Sync Worker
    participant Mongo as MongoDB

    Note over Player: Video bắt đầu render giây đầu tiên
    Player->>NodeAPI: GET /api/v1/log/imp/:hash (gửi ngầm qua sendBeacon)
    Note over NodeAPI: Giải mã :hash bằng SERVER_SECRET_KEY (< 0.1ms)<br/>➔ Lấy ra { venue_id, line_item_id, exp }
    
    NodeAPI->>Redis: SET dedup:{hash} 1 EX 30 NX (Kiểm tra chống trùng lặp)
    alt Hash đã xuất hiện trong 30s
        Redis-->>NodeAPI: Key exists (Duplicate do lag mạng)
        NodeAPI-->>Player: HTTP 204 No Content (Bỏ qua, không đếm trùng)
    else Hash hợp lệ
        NodeAPI->>Redis: HINCRBY stat:{date}:{item_id}:{venue_id} imp 1 (Tăng counter RAM)
        NodeAPI->>Redis: RPUSH queue:raw_tracking_logs {raw_event} (Đẩy vào queue)
        NodeAPI-->>Player: HTTP 204 No Content (Phản hồi < 3ms)
    end

    %% Worker đồng bộ
    loop Mỗi 3 - 5 giây
        Worker->>Redis: LPOP queue:raw_tracking_logs 1000
        Worker->>Mongo: Bulk Write vào collection `tracking_logs`
        Worker->>Mongo: Bulk Upsert $inc vào collection `daily_aggregated_reports`
    end
```

---

## 5. Luồng 4: Báo Cáo & Nghiệm Thu Tính Tiền (Reporting Flow)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Khách Hàng / Quản Trị Viên
    participant UI as CMS React Frontend
    participant API as Laravel CMS Backend
    participant Mongo as MongoDB (daily_aggregated_reports)
    participant MySQL as MySQL (Tên màn hình, nhãn hàng)

    Admin->>UI: Mở trang Report, chọn Chiến dịch Coca-Cola, lọc ngày 01/11 - 17/11
    UI->>API: GET /api/report/aggregate?line_item_id=105&from_date=...
    API->>Mongo: Query aggregation trên `daily_aggregated_reports` bằng Compound Index
    Mongo-->>API: Trả về: { total_imp: 10500, total_complete: 10290 } (< 50ms)
    API->>MySQL: Join lấy thông tin chi tiết tên Màn hình, địa chỉ, đơn giá
    API-->>UI: Trả về JSON tổng hợp + diễn biến theo ngày
    UI-->>Admin: Hiển thị Biểu đồ đường @ant-design/plots, Tỷ lệ xem hết 98%, Nút xuất Excel Proof of Play
```

---

## 6. Luồng 5: Cơ Chế Chịu Lỗi Khi Mất Mạng Ngoài Trời (Offline Resilience Flow)

```mermaid
flowchart TD
    Start["Player đang phát quảng cáo ngoài trời"]
    NetCheck{"Kiểm tra kết nối mạng?"}
    
    Online["Mạng bình thường"]
    SendDirect["Bắn beacon trực tiếp lên Node.js API<br/>GET /api/v1/log/imp/:hash"]
    
    Offline["Mất sóng 4G / Đứt cáp"]
    LocalPlay["Tiếp tục phát video từ bộ nhớ đệm máy (Cache offline)"]
    QueueLocal["Lưu tạm gói tin log vào IndexedDB / SQLite cục bộ"]
    
    Reconnected{"Mạng 4G có lại?<br/>(window.ononline)"}
    SyncBatch["Tự động rút mẻ log từ IndexedDB<br/>gửi bù lên Node.js API theo thứ tự"]
    
    Start --> NetCheck
    NetCheck -- Có mạng --> Online --> SendDirect
    NetCheck -- Mất mạng --> Offline --> LocalPlay --> QueueLocal --> Reconnected
    Reconnected -- Có mạng lại --> SyncBatch --> SendDirect
```
