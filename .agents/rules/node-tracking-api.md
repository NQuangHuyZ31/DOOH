# Node.js Delivery & Tracking API Rules (Mirrored Modular Architecture)

Scope: `api/src/`. Pure Node.js (`node:http`, `node:crypto`) — Modules directly mirror CMS domain modules.

---

## 1. Domain-Driven Mirrored Architecture (`api/src/`)
Modules in `api/` mirror the domain modules in `cms/` for unified domain ownership:

```text
api/src/
├── core/                        # MODULE CORE: Shared HTTP Router, crypto AES-256-GCM, DB pool, auth
├── modules/
│   ├── Venue/                   # MODULE VENUE (Mirrors CMS Venue):
│   │   ├── controllers/         # GET /api/v1/venue/:code, POST /api/v1/venue/heartbeat
│   │   ├── services/            # Hardware status, screen configuration lookups
│   │   └── routes.ts
│   ├── Delivery/                # MODULE DELIVERY (Mirrors CMS Delivery):
│   │   ├── controllers/         # GET /api/v1/delivery/playlist?venue_id=...
│   │   ├── services/            # Ad Loop pacing (120s), daily cap check, token encryption
│   │   └── routes.ts
│   └── Log/                     # MODULE LOG (Mirrors CMS Log):
│       ├── controllers/         # GET /api/v1/log/imp/:hash, GET /api/v1/log/complete/:hash
│       ├── services/            # Opaque token decryption, Redis dedup, atomic counter, queue buffer
│       ├── workers/             # Background batch sync loop (Redis queue -> MongoDB bulkWrite)
│       └── routes.ts
├── app.ts                       # Aggregates module routes
└── server.ts                    # Native node:http listen
```

---

## 2. Invariants & Performance Target
- **Latency**: Endpoints in `Log` module MUST respond in **< 3ms** with `HTTP 204 No Content`.
- **Zero Heavy I/O in HTTP Path**: Never perform raw MongoDB queries in beacon ingestion.
- **Opaque Token Encryption/Decryption**:
  - `Delivery` module encrypts payload `{ venue_id, line_item_id, exp }` into `:hash` when generating playlist.
  - `Log` module decrypts `:hash` when receiving beacon. Client screen does zero crypto.
- **Worker**: Batch worker in `modules/Log/workers/` flushes Redis buffer to MongoDB every 3–5 seconds.
