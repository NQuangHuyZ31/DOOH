---
trigger: glob
description: Node.js delivery & tracking API (api/) architecture and latency invariants.
globs: api/**
---

# Node Tracking API Rules (`api/`)

Contracts: `api-contract.md`. Redis keys: `database.md`. Deep dive: `docs/api/routing-and-contracts.md`.

## Structure (modules mirror CMS)

```text
api/src/
├── core/            # router, AES-256-GCM crypto, DB/Redis pools, auth
├── modules/
│   ├── Venue/       # controllers/ services/ routes.ts
│   ├── Delivery/    # playlist build, pacing, token encryption
│   └── Log/         # beacon ingest, dedup, counters; workers/ (Redis → Mongo)
├── app.ts           # aggregates module routes
└── server.ts        # node:http listen
```

## Invariants

- Pure Node (`node:http`, `node:crypto`); no web framework.
- `Log` beacons respond **< 3ms** with `204`; NEVER touch MongoDB/disk in the request path (Redis only).
- Delivery encrypts `{ venue_id, line_item_id, exp }` into opaque `:hash`; Log decrypts. Players do zero crypto.
- Worker in `modules/Log/workers/` flushes `queue:raw_tracking_logs` to Mongo via `bulkWrite` every 3–5s; must be idempotent.
