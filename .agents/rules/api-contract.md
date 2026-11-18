---
trigger: glob
description: CMS JSON response envelope, status codes, endpoint shapes, and Node API /api/v1 contracts.
globs: cms/modules/**/src/Http/**, cms/modules/**/src/Resources/**, cms/modules/**/resources/js/Action/**, cms/modules/**/resources/js/types/**, api/src/**
---

# API Contract Rules

Deep dive: `docs/api/routing-and-contracts.md`.

## 1. CMS (Laravel) — prefix `admin/api` (`config('modules.api_prefix')`)

Route shape: `/admin/api/{module}/{controller?}/{id?}/{action?}` (dynamic router, see `backend.md`).

Envelope from `Modules\Core\Support\ApiResponseTrait` (NEVER hand-roll `response()->json`):

```json
// respondSuccess($data, $message, $code)
{ "status": "success", "message": "Success", "data": {} }
// respondPaginated($paginator)
{ "status": "success", "message": "Success", "data": [], "pagination": { "current_page": 1, "last_page": 1, "per_page": 20, "total": 0 } }
// respondError($message, $code, $errors)
{ "status": "error", "message": "...", "errors": { "field": ["..."] } }
```

| Code | Use |
|---|---|
| 200 / 201 | read, update / create |
| 401 / 403 | unauthenticated / no permission |
| 404 | missing entity |
| 422 | validation (`errors` keyed by field) |
| 400 / 500 | business rule violation / unexpected (generic message) |

- Fields `snake_case`; dates ISO-8601; ids numeric. Lists default `per_page` from `@core/configs/pagination`.
- Frontend: type responses once in `Action/` or `types/` mirroring the envelope (`status`, `message`, `data`, `pagination`); call via `http` from `@core/Action/api`.

## 2. Tracking API (Node) — `/api/v1`

| Endpoint | Contract |
|---|---|
| `GET /api/v1/delivery/playlist?venue_id=` | header `X-DOOH-API-KEY`; returns `{ venue_id, refresh_seconds, playlist: [{ line_item_id, type, media_url, duration, tracking: { impression_url, complete_url } }] }` |
| `GET /api/v1/log/imp/:hash`, `GET /api/v1/log/complete/:hash` | always `204` (also for duplicates/invalid → drop silently) |
| `GET /api/v1/venue/:code`, `POST /api/v1/venue/heartbeat` | venue config / health |

- Breaking changes require a new version prefix (`/api/v2`) — never change `v1` shapes in place.
