---
name: dooh-creative-validation
description: Use when implementing creative uploads or validation — image/video specs, codec and aspect-ratio checks, duration matching, HTML5 sandboxing, VAST XML fetch and parsing, validation error codes.
---

# DOOH Creative Validation

## 1. Specs

| Type | Formats | Constraints | Player element |
|---|---|---|---|
| Image | JPG, PNG, WebP | ≤ 10MB, RGB, aspect matches venue | `<img>` |
| Video | MP4 | H.264 (AVC) Baseline/Main, AAC or muted, ≤ 15 Mbps, 30/60 FPS | `<video autoplay muted>` |
| HTML5 | ZIP or https URL | sandboxed, no popups/redirects, responsive | `<iframe sandbox="allow-scripts allow-same-origin">` |
| VAST | XML URL/tag | 2.0–4.0 with linear `<MediaFile type="video/mp4">` | parsed `<MediaFile>` |

## 2. Server Validation (in `FormRequest` + Creative Service)

1. Aspect/resolution matches target venue (16:9, 9:16, or venue px, ±5%).
2. Video duration = Line Item `duration_seconds` ±1s.
3. VAST: fetch with 5s timeout (https only) → root `<VAST>` → extract `<MediaFile>`, `<Duration>`, `<Impression>`, tracking `start`/`complete`; substitute `[TIMESTAMP]`, `[VENUE_ID]`, `[CACHEBUSTING]`.

## 3. Error Codes (`respondError(..., 422, errors)`)

| Code | Message |
|---|---|
| `INVALID_CODEC` | Video must be encoded in H.264 (AVC) MP4 format. |
| `INVALID_ASPECT_RATIO` | Creative dimensions (WxH) do not match selected venue specs. |
| `VAST_UNREACHABLE` | Unable to fetch or parse VAST XML endpoint. |
