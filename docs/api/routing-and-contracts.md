# API Routing & Contracts

Specifications for Node.js Delivery & Tracking API and CMS REST endpoints.

---

## 1. Node.js Delivery & Tracking API (Mirrored Modules)

Modules in `api/` mirror domain modules in `cms/`:
```text
api/src/
├── core/                        # Shared HTTP Router, crypto AES-256-GCM, DB pool, auth middleware
├── modules/
│   ├── Venue/                   # GET /api/v1/venue/:code, POST /api/v1/venue/heartbeat
│   ├── Delivery/                # GET /api/v1/delivery/playlist?venue_id=... (Ad Loop 120s)
│   └── Log/                     # GET /api/v1/log/imp/:hash & :complete/:hash (< 3ms) + Batch Worker
├── app.ts                       # Aggregates module routes
└── server.ts                    # Native node:http listen
```

### 1.1. Playlist Endpoint (`Delivery` Module)
- **Request**: `GET /api/v1/delivery/playlist?venue_id={venue_id}`
- **Header**: `X-DOOH-API-KEY: {key}`
- **Cache**: Checked against Redis `playlist:venue:{venue_id}` (TTL 120s–300s).
- **Response**:
  ```json
  {
    "venue_id": "HN-CG-01",
    "refresh_seconds": 300,
    "playlist": [
      {
        "line_item_id": 105,
        "type": "video",
        "media_url": "https://cdn.example.com/videos/ad_coca_15s.mp4",
        "duration": 15,
        "tracking": {
          "impression_url": "https://api.domain.com/api/v1/log/imp/eJyrVkpN...",
          "complete_url": "https://api.domain.com/api/v1/log/complete/eJyrVkpN..."
        }
      }
    ]
  }
  ```

### 1.2. Opaque Token Tracking Endpoints (`Log` Module)
- **Endpoints**:
  - `GET /api/v1/log/imp/:hash` (Impression Beacon)
  - `GET /api/v1/log/complete/:hash` (Complete 100% Beacon)
- **Token Processing (< 3ms)**:
  1. Decrypt `:hash` with `SERVER_SECRET_KEY` $\rightarrow$ `{ venue_id, line_item_id, exp }`.
  2. Deduplication check: `SET dedup:{hash} 1 EX 30 NX`. If exists $\rightarrow$ drop silently, return `204`.
  3. Increment counter: `HINCRBY stat:{date}:{line_item_id}:{venue_id} imp 1`.
  4. Push raw event: `RPUSH queue:raw_tracking_logs <json>`.
  5. Return `HTTP 204 No Content`.

---

## 2. CMS Backend RESTful Routing (Laravel)

- **Dynamic Routing**: Handled by `Modules\Core\Support\DynamicRouteResovle`:
  `/{module}/{controller}/{id?}/{action?}` $\rightarrow$ `Modules\<Module>\Http\Controllers\<Studly>Controller`
- **RBAC**: Protected by `CheckModulePermission` middleware.
- **Key Modules**:
  - `Venue`: `GET /api/venue`, `POST /api/venue`, `PUT /api/venue/{id}`
  - `Creative`: `GET /api/creative`, `POST /api/creative/upload`
  - `Delivery`: `GET /api/delivery/campaigns`, `POST /api/delivery/line-items`
  - `Report`: `GET /api/report/aggregate` (queries MongoDB `daily_aggregated_reports`)
  - `Log`: `GET /api/log/tracking` (queries MongoDB `tracking_logs`)
