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
├── modules/
|   ├──	core/            # router, AES-256-GCM crypto, DB/Redis pools, auth
│   ├── Venue/       # controllers/ services/ routes.ts
│   ├── Delivery/    # playlist build, pacing, token encryption
│   └── Log/         # beacon ingest, dedup, counters; workers/ (Redis → Mongo)
├── app.ts           # aggregates module routes
└── server.ts        # node:http listen
```

## Invariants

- **Formatting (`Tab Size = 4`)**: MUST use **tab size 4** (`indent_size = 4` / `tabWidth: 4`), `singleQuote: true`, `semi: true`, strict TypeScript (NEVER `any`).
- Pure Node (`node:http`, `node:crypto`); no web framework.
- `Log` beacons respond **< 3ms** with `204`; NEVER touch MongoDB/disk in the request path (Redis only).
- Delivery encrypts `{ venue_id, line_item_id, exp }` into opaque `:hash`; Log decrypts. Players do zero crypto.
- Worker in `modules/Log/workers/` flushes `queue:raw_tracking_logs` to Mongo via `bulkWrite` every 3–5s; must be idempotent.
