---
name: dooh-delivery-pacing
description: Use when implementing playlist generation (/api/v1/delivery/playlist), line item eligibility, flight dates, daily/lifetime caps, pacing modes, or playlist cache invalidation.
---

# DOOH Delivery & Pacing

Redis keys: `.agents/rules/database.md` §4. Contract: `.agents/rules/api-contract.md` §2.

## 1. Eligibility (Line Item → Venue playlist)

All must hold:
1. `line_items.status = 'active'`.
2. Row exists in `line_item_venues` for the `venue_id`.
3. `start_date <= today <= end_date`.
4. Daily cap: `HGET stat:{date}:{line_item_id}:{venue_id} imp` < `daily_impression_cap`.
5. Lifetime: `total_delivered_impressions` < `target_impressions` (else mark completed).

## 2. Loop Construction

- Sort by priority desc, then round-robin interleave so the same campaign/advertiser never plays back-to-back.
- Loop length target 120–300s (`refresh_seconds`).
- Pacing:
  - `evenly`: hourly target = `daily_cap / active_operating_hours`; over target this hour → deprioritize/hold.
  - `asap`: no hourly limit until `daily_cap`.
- Each item gets encrypted tracking URLs (`/api/v1/log/imp/:hash`, `/api/v1/log/complete/:hash`).

## 3. Cache

- Cache result in `playlist:venue:{venue_id}` (TTL 120–300s).
- Evict on CMS publish of Campaign, Line Item, Creative, or Venue changes.
