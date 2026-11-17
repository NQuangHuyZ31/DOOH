---
name: dooh-delivery-pacing
description: Algorithmic guidelines for DOOH ad delivery, pacing, flight scheduling, and playlist loop construction.
---

# DOOH Delivery & Pacing Skill

Use this skill when implementing or modifying playlist generation (`GET /api/v1/player/playlist`), flight date filters, frequency caps, or loop pacing algorithms.

---

## 1. Candidate Selection Filter (SQL / Redis)

A Line Item is eligible for a Venue's playlist if and only if:
1. **Status**: `line_items.status = 'active'`.
2. **Venue Assignment**: Associated with the requested `venue_id` in `line_item_venues`.
3. **Flight Window**: `start_date <= TODAY() <= end_date`.
4. **Daily Cap Check (Redis)**:
   - Query Redis: `HGET stat:{date}:{line_item_id}:{venue_id} imp`.
   - If `current_daily_imp >= daily_impression_cap`, exclude from playlist.
5. **Lifetime Cap Check**:
   - If `total_delivered_impressions >= target_impressions`, mark as completed and exclude.

---

## 2. Loop & Pacing Strategies

- **Round-Robin (Default)**: Sort eligible items by priority descending, then interleave evenly to prevent the same campaign/advertiser from playing back-to-back.
- **Loop Duration Target**: Default standard loop is 120s – 300s.
- **Pacing Mode**:
  - `evenly`: Calculate hourly target = `daily_cap / active_operating_hours`. If current hour counter exceeds hourly target, deprioritize or hold for next hour.
  - `asap`: Deliver as quickly as possible without hourly limits until `daily_cap` is reached.

---

## 3. Cache & Invalidation Invariants
- Cache generated playlist JSON in Redis: `playlist:venue:{venue_id}` with TTL: 120s – 300s.
- Evict immediately when CMS publishes changes to Campaigns, Line Items, or Creatives.
