---
name: dooh-simulator-and-player
description: Use when building or changing the DOOH web player or the CMS Simulator module — playlist loop playback (image, video, HTML5, VAST), tracking beacons, offline queue, LED frame mockup.
---

# DOOH Player & Simulator

## 1. Playback per Creative Type

| Type | Element | Duration | Next item on |
|---|---|---|---|
| Image | `<img>` / CSS cover | `duration` | timer = 0 |
| Video | `<video autoplay muted playsinline>` | native or `duration` | `ended` |
| HTML5 | `<iframe sandbox="allow-scripts allow-same-origin">` | `duration` | timer = 0 |
| VAST 2.0–4.0 | parsed linear `<MediaFile>` (MP4/WebM) | VAST `<Duration>` | `ended` |

Errors (load failure, VAST parse) → skip to next item, never stall the loop.

## 2. Beacons (opaque token)

- Fetch `GET /api/v1/delivery/playlist?venue_id={venue_id}`; each item has `tracking.impression_url` (`/api/v1/log/imp/{hash}`) and `tracking.complete_url` (`/api/v1/log/complete/{hash}`).
- Player does no crypto/HMAC.
- Impression: on render start (`img.onload`, `video.onplay`) via `navigator.sendBeacon(url)` or `fetch(url, { keepalive: true })`.
- Complete: on `video.onended` (or timer end for image/HTML5).
- Offline: queue URLs in `localStorage`/IndexedDB; replay on `window.ononline`.
- Refresh playlist every `refresh_seconds`.

## 3. CMS Simulator (`cms/modules/Simulator/`)

- `LedFrameMockup.tsx`: bezel for 16:9, 9:16, or venue px resolution.
- `PlayerEngine.tsx`: sequence, timers, media events (logic in `hooks/usePlayerEngine.ts` to keep ≤ 150 lines).
- `EventDebugPanel.tsx`: active item, remaining seconds, beacon status (`204`).
