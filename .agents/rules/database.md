---
trigger: glob
description: MySQL migrations/models, MongoDB collections/indexes, Redis key standards.
globs: cms/modules/**/database/migrations/**, cms/modules/**/src/Models/**, cms/modules/**/src/Repositories/**, api/src/**
---

# Database Rules (MySQL + MongoDB + Redis)

Deep dive: `docs/database/schema-and-migrations.md`.

## 1. Dual-DB Split

| Store | Connection | Use | Model base |
|---|---|---|---|
| MySQL | `mysql` | relational entities: `users, roles, permissions, venues, campaigns, line_items, line_item_venues, creatives, api_keys` | `Illuminate\Database\Eloquent\Model` |
| MongoDB | `mongodb` | high-volume logs/stats: `tracking_logs`, `daily_aggregated_reports` | `MongoDB\Laravel\Eloquent\Model` |

## 2. MySQL

- Migrations additive only (new tables, nullable/defaulted columns, indexes). NEVER edit committed migrations. Drop/rename needs human approval + rollback plan.
- Tables plural `snake_case`; FKs `foreignId('<parent>_id')->constrained()`; composite indexes for hot pairs (`['campaign_id','status']`, `['start_date','end_date']`).
- Models: explicit `$fillable` (NEVER `$guarded = []`), explicit `$casts` (bool, datetime, json).

## 3. MongoDB

| Collection | Fields | Indexes |
|---|---|---|
| `tracking_logs` | `event_type (imp\|complete), venue_id, line_item_id, timestamp, epoch_ms, client_hash, ip, user_agent, created_at` | `{venue_id:1,timestamp:-1}`, `{line_item_id:1,timestamp:-1}`, `{client_hash:1}`, TTL `{timestamp:1}` 7776000s (90d) |
| `daily_aggregated_reports` | `_id = "{YYYY-MM-DD}_{line_item_id}_{venue_id}"`, `date, line_item_id, campaign_id, venue_id, impressions_count, completes_count, hourly_breakdown` | `{date:-1,line_item_id:1,venue_id:1}` |

- Query only on indexed fields with projections. Counters via atomic `$inc`.

## 4. Redis Keys (single source of truth)

| Purpose | Key | Type | TTL |
|---|---|---|---|
| Playlist cache | `playlist:venue:{venue_id}` | String JSON | 120–300s |
| Beacon dedup | `dedup:{hash}` | String `1` (`SET NX EX 30`) | 30s |
| Daily stat | `stat:{YYYY-MM-DD}:{line_item_id}:{venue_id}` | Hash `imp`, `complete` | 48h |
| Ingest buffer | `queue:raw_tracking_logs` | List (RPUSH/LPOP) | until flushed |

- On Venue/Line Item/Creative change in CMS → `DEL playlist:venue:{venue_id}` for affected venues.
