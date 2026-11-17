# DOOH Architecture Overview

System topology, technology stack, and component boundaries across the DOOH platform.

---

## 1. System Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DOOH SYSTEM TOPOLOGY                            │
├────────────────────────────────────────────────────────────────────────┤
│  [ CMS FRONTEND ]                                                      │
│  React 19/18 + TypeScript + Ant Design 5/6 (SPA)                       │
│  (Modules: Venues, Delivery, Creatives, Reports, Logs, Simulator)      │
│                         │                                              │
│                         ▼ REST API (Sanctum)                           │
│  [ CMS BACKEND ]                                                       │
│  Laravel 11/12 (PHP 8.3) - Strict 3-Layer Modular Architecture         │
│  (app/Modules: Core, Auth, Venue, Creative, Delivery, Report, Log)     │
│             │                                 │                        │
│             ▼                                 ▼                        │
│     [ MySQL 8.0 ]                     [ MongoDB 7.0 ]                  │
│     (Relational: Venues, Campaigns,   (Tracking Logs: raw events,      │
│      LineItems, Creatives, APIKeys)    Daily aggregated reports)       │
│             ▲                                 ▲                        │
│             │ Read active line items          │ Flush batch logs       │
│             │                                 │                        │
│  [ DELIVERY & TRACKING ENGINE ] ──────────────┘                        │
│  Pure Node.js 24 + TypeScript (node:http, node:crypto)                 │
│  - Encrypted Opaque Token Generator & Verifier                         │
│  - Ultra-low latency Ingestion (< 3ms)                                 │
│             │                                                          │
│             ▼                                                          │
│     [ Redis 7.0 ] (Playlist Cache, Dedup SETNX, In-memory Queue)       │
│             ▲                                                          │
│             │ 1. GET /player/playlist                                  │
│             │ 2. GET /tracking/imp/:hash (HTTP 204)                    │
│             │                                                          │
│  [ EDGE PLAYER / SCREEN SIMULATOR ]                                    │
│  Web Player / Android Box (Image, Video MP4, HTML5, VAST 2.0-4.0)      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stacks

| Component | Stack | Responsibilities |
|---|---|---|
| **CMS Frontend** | React 19/18, TypeScript, AntD 5/6, Vite, @ant-design/plots | Management portal, Screen Simulator, Reporting charts. |
| **CMS Backend** | Laravel 11/12, PHP 8.3, Sanctum, mongodb/laravel-mongodb | Business CRUD, Dynamic Routing, RBAC, Report aggregation queries. |
| **Delivery & Tracking API** | Pure Node.js 24 (node:http, node:crypto), TypeScript | Playlist distribution, Opaque token encryption/decryption, Redis buffer. |
| **Relational DB** | MySQL 8.0 | Business entities, configurations, additive migrations. |
| **Log & Stats DB** | MongoDB 7.0 | `tracking_logs` (TTL 90 days), `daily_aggregated_reports`. |
| **Cache & Queue** | Redis 7.0 (Alpine) | Playlist cache, `SET dedup:{hash} 1 EX 30 NX`, `queue:raw_tracking_logs`. |

---

## 3. Mirrored Domain Modules (CMS ↔ API)

To maximize maintainability and reduce context switching, `api/` modules mirror the corresponding domain modules in `cms/`:

| Domain | CMS Module (`cms/modules/`) | API Module (`api/src/modules/`) | Responsibilities |
|---|---|---|---|
| **Core** | `Core` | `core` | Base contracts, shared DB pool, crypto, auth middleware. |
| **Venue** | `Venue` | `Venue` | **CMS**: Manage screens, resolution, location.<br>**API**: Screen config lookup (`:code`), heartbeat ping. |
| **Delivery** | `Delivery` | `Delivery` | **CMS**: Campaigns, Line Items, flight dates, caps.<br>**API**: Ad Loop (120s), playlist generation, token encryption. |
| **Log** | `Log` | `Log` | **CMS**: Proof of play audit table, query raw events.<br>**API**: Beacon ingestion (`:hash`), Redis dedup, Mongo worker. |
| **Creative** | `Creative` | Included in Delivery | Media upload, VAST parser, transcoding checks. |
| **Report** | `Report` | Shared via MongoDB | Aggregated charts, billing calculations. |
| **Simulator** | `Simulator` | Test client for API | Screen mockup, live playback engine. |
