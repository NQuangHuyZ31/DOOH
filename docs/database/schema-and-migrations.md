# Database Schemas & Storage Standard

Dual-Database (MySQL + MongoDB) and Redis key hierarchy for the DOOH platform.

---

## 1. MySQL Schema (Relational Entities)

| Table | Primary Key | Key Columns | Relationships / Notes |
|---|---|---|---|
| `users` | `id` (bigint) | `name`, `email`, `password`, `role` | `role`: admin / advertiser / operator |
| `venues` | `id` (bigint) | `code` (UK), `name`, `location`, `width`, `height`, `orientation`, `secret_key`, `status` | Outdoor LED screen specs. |
| `campaigns` | `id` (bigint) | `user_id` (FK), `name`, `start_date`, `end_date`, `status` | Belongs to `users`. |
| `line_items` | `id` (bigint) | `campaign_id` (FK), `name`, `creative_type`, `start_date`, `end_date`, `target_impressions`, `daily_impression_cap`, `duration_seconds`, `priority`, `status` | Belongs to `campaigns`. |
| `creatives` | `id` (bigint) | `line_item_id` (FK), `name`, `type`, `media_url`, `width`, `height`, `duration_seconds`, `metadata` | Belongs to `line_items`. |
| `line_item_venues` | `id` (bigint) | `line_item_id` (FK), `venue_id` (FK) | Unique `(line_item_id, venue_id)`. |
| `api_keys` | `id` (bigint) | `user_id` (FK), `key_hash` (UK), `prefix`, `role`, `expires_at` | Authenticates player / system. |

- **Invariants**: Migrations are strictly additive; explicit `$fillable` on all models; soft deletes where applicable.

---

## 2. MongoDB Collections (Logs & Analytics)

### Collection: `tracking_logs` (Raw Events)
- **Document Structure**:
  ```json
  {
    "_id": ObjectId("..."),
    "event_type": "imp",
    "venue_id": "HN-CG-01",
    "line_item_id": 105,
    "timestamp": ISODate("2026-11-17T02:18:23.123Z"),
    "client_hash": "eJyrVkpN...",
    "ip": "118.70.1.2",
    "user_agent": "DOOH_Player/1.0"
  }
  ```
- **Indexes**: `{ venue_id: 1, timestamp: -1 }`, `{ line_item_id: 1 }`, TTL index: `{ timestamp: 1 }` with `expireAfterSeconds: 7776000` (90 days).

### Collection: `daily_aggregated_reports` (Aggregated Time-Series)
- **Key Pattern**: `_id = "{YYYY-MM-DD}_{line_item_id}_{venue_id}"`
- **Fields**: `date`, `line_item_id`, `campaign_id`, `venue_id`, `impressions_count`, `completes_count`.
- **Atomic Update**: `$inc: { impressions_count: 1 }`.
- **Index**: `{ date: -1, line_item_id: 1, venue_id: 1 }`.

---

## 3. Redis Key Standards

| Key Pattern | Type | TTL | Purpose |
|---|---|---|---|
| `playlist:venue:{venue_id}` | String (JSON) | 120s – 300s | Playlist cache for screens. |
| `dedup:{hash}` | String ("1") | 30s | Atomic deduplication via `SETNX`. |
| `stat:{date}:{line_item_id}:{venue_id}` | Hash (`imp`, `complete`) | 48 hours | In-memory atomic counters (`HINCRBY`). |
| `queue:raw_tracking_logs` | List (RPUSH / LPOP) | Ephemeral | Buffer queue for background MongoDB worker. |
