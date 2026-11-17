---
name: dooh-creative-validation
description: Standards and validation rules for DOOH creative assets (Images, Videos, HTML5, VAST 2.0-4.0).
---

# DOOH Creative Validation Skill

Use this skill when implementing asset uploads, transcoding checks, aspect-ratio matching, or VAST XML tag parsers.

---

## 1. Asset Specifications & Thresholds

| Type | Formats | Constraints | Target Player Element |
|---|---|---|---|
| **Image** | JPG, PNG, WebP | Max 10MB; RGB color space; matched aspect ratio | `<img>` or CSS cover |
| **Video** | MP4 container | Codec: **H.264 (AVC)** Baseline/Main profile; Audio: AAC or Muted; Max bitrate 15 Mbps; 30/60 FPS | HTML5 `<video autoplay muted>` |
| **HTML5** | ZIP or URL | Sandboxed iframe; no popups/redirects; auto-animates; responsive to container | `<iframe sandbox="allow-scripts allow-same-origin">` |
| **VAST** | XML URL / Tag | VAST 2.0, 3.0, 4.0; must contain linear `<MediaFile type="video/mp4">` | Parsed `<MediaFile>` stream |

---

## 2. Server-Side Validation Rules (Laravel CMS)

1. **Resolution & Aspect Ratio**: Must match target venue screen dimensions (`16:9` landscape, `9:16` portrait, or venue-defined custom px with max 5% tolerance).
2. **Video Duration**: Strict validation against `duration_seconds` declared in Line Item ($\pm 1$ second tolerance).
3. **VAST XML Verification**:
   - Fetch URL with a 5s timeout.
   - Assert root is `<VAST>` and extract `<MediaFile>` URL, `<Duration>`, `<Impression>`, and tracking events (`start`, `complete`).
   - Substitute macros: `[TIMESTAMP]`, `[VENUE_ID]`, `[CACHEBUSTING]`.

---

## 3. Error Responses
Return standardized validation errors via `ApiResponseTrait`:
- `INVALID_CODEC`: "Video must be encoded in H.264 (AVC) MP4 format."
- `INVALID_ASPECT_RATIO`: "Creative dimensions (WxH) do not match selected venue specs."
- `VAST_UNREACHABLE`: "Unable to fetch or parse VAST XML endpoint."
