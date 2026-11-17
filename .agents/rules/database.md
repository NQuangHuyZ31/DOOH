# Database, MongoDB & Cache Rules (DOOH Platform)

Scope: `cms/modules/*/database/migrations/`, `cms/modules/*/src/Models/`, MongoDB schemas, and Redis key standards. Read when modifying schemas, models, or caching logic.

---

## 1. MySQL Migration Invariants
- **Additive & Backward Compatible**: Migrations MUST be additive (new nullable/defaulted columns, new indexes, new tables).
- **NEVER Edit Merged Migrations**: Never modify an existing, committed migration file. Always create a new timestamped migration.
- **Destructive Changes**: Dropping tables or renaming columns requires explicit human confirmation and rollback plans.
- **Zero Production Mutation**: Agents must NEVER delete or mutate production data in routine tasks.
- **Naming Conventions**:
  - Tables: Plural `snake_case` (e.g. `venues`, `campaigns`, `line_items`, `creatives`, `line_item_venues`, `api_keys`).
  - Foreign Keys: Plural parent model singularized with `_id`: `$table->foreignId('line_item_id')->constrained()->cascadeOnDelete()`.
  - Indexes: Explicit composite indexes for frequent lookup pairs (e.g. `['campaign_id', 'status']`, `['start_date', 'end_date']`).
- **Eloquent Models**:
  - Mass Assignment: Declare explicit `$fillable` arrays on all models. NEVER declare `$guarded = []`.
  - Type Casting: Declare explicit `$casts` for booleans, dates (`datetime`), and JSON columns.

---

## 2. MongoDB Collections & Indexing Standards
MongoDB is reserved for high-volume logs and real-time aggregation queries.

### Collection: `tracking_logs` (Raw Events)
- Records every impression and complete beacon.
- **Mandatory Fields**: `event_type` (`imp` | `complete`), `venue_id`, `line_item_id`, `timestamp` (ISODate), `epoch_ms`, `client_hash`, `ip`, `user_agent`, `created_at`.
- **Mandatory Indexes**:
  - `{ venue_id: 1, timestamp: -1 }` (Venue playback history).
  - `{ line_item_id: 1, timestamp: -1 }` (Line item delivery audit).
  - `{ client_hash: 1 }` (Deduplication validation).
  - `{ timestamp: 1 }` with `expireAfterSeconds: 7776000` (90-day automatic retention TTL).

### Collection: `daily_aggregated_reports` (Aggregated Time-series)
- Pre-aggregated metrics for instant CMS reporting.
- **Key Pattern**: `_id = "{YYYY-MM-DD}_{line_item_id}_{venue_id}"`.
- **Fields**: `date`, `line_item_id`, `campaign_id`, `venue_id`, `impressions_count`, `completes_count`, `hourly_breakdown`.
- **Index**: Compound Index `{ date: -1, line_item_id: 1, venue_id: 1 }`.
- **Atomic Updates**: Always use `$inc` (e.g. `{ $inc: { impressions_count: 1 } }`) to avoid race conditions.

---

## 3. Redis Key Naming & TTL Invariants
All Redis keys must follow a strict namespaced hierarchy:

| Purpose | Key Pattern | Data Type | TTL |
|---|---|---|---|
| Venue Playlist Cache | `playlist:venue:{venue_id}` | String (JSON) | 120s – 300s |
| Beacon Deduplication | `dedup:{hash}` | String ("1") | 30s |
| Real-time Daily Stat | `stat:{YYYY-MM-DD}:{line_item_id}:{venue_id}` | Hash (`imp`, `complete`) | 48 hours |
| Raw Ingestion Buffer | `queue:raw_tracking_logs` | List (RPUSH / LPOP) or Stream | Ephemeral (flushed by worker) |

- **Key Invalidation**: When a Line Item or Venue is updated in CMS, dispatch cache eviction: `DEL playlist:venue:{venue_id}`.
