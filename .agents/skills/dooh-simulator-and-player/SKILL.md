---
name: dooh-simulator-and-player
description: Guidelines and implementation patterns for DOOH Web Player and CMS Screen Simulator (Image, Video, HTML, VAST, and tracking beacons).
---

# DOOH Screen Simulator & Player Skill

Use this skill when developing, testing, or extending the DOOH Web Player client or the CMS Screen Simulator module.

---

## 1. Supported Creative Formats & Playback Rules

Every DOOH Player instance (physical screen or CMS simulator) implements a sequential playlist loop:

| Creative Type | Rendering Element | Duration Handling | Transition Trigger |
|---|---|---|---|
| **Image (Banner)** | `<img>` or CSS cover | Fixed `duration_seconds` (e.g. 10s) | Countdown timer reaches 0 |
| **Video** | HTML5 `<video autoplay muted playsinline>` | Video native duration or `duration_seconds` | `ended` event listener |
| **HTML5 Link** | `<iframe sandbox="allow-scripts allow-same-origin">` | Fixed `duration_seconds` | Countdown timer reaches 0 |
| **VAST 2.0-4.0** | Parsed XML `<MediaFile>` (MP4/WebM) | Media duration specified in VAST XML | `ended` event listener |

---

## 2. Tracking Beacon Specification (Opaque Token)

- **Playlist Ingestion**: Player calls `GET /api/v1/player/playlist?venue_id={venue_id}`.
- **Tracking URLs**: Server provides encrypted URLs per item:
  - `item.tracking.impression_url`: `https://api.yourdomain.com/api/v1/tracking/imp/{hash}`
  - `item.tracking.complete_url`: `https://api.yourdomain.com/api/v1/tracking/complete/{hash}`
- **Zero Client Encryption**: Player does NOT need to encrypt or compute HMAC.
- **Triggers**:
  - **Impression**: Send immediately on render start (`img.onload` or `video.onplay`) via `navigator.sendBeacon(impression_url)` or `fetch(impression_url, { keepalive: true })`.
  - **Complete**: Send when video reaches 100% (`video.onended`) via `navigator.sendBeacon(complete_url)`.
- **Offline Resiliency**: If network is disconnected, queue beacon URLs in `localStorage`/`IndexedDB` and replay when `window.ononline` fires.

---

## 3. Screen Simulator Architecture (CMS)

In the CMS Simulator module (`cms/modules/Simulator/`):
- `LedFrameMockup.tsx`: Renders outdoor LED screen bezel (16:9 landscape, 9:16 portrait, or custom resolution).
- `PlayerEngine.tsx`: Manages playlist sequence, countdown timers, and video event listeners.
- `EventDebugPanel.tsx`: Real-time sidebar displaying active item, remaining seconds, and HTTP beacon status (`204 OK`).
