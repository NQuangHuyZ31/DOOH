---
trigger: glob
description: Security baseline for CMS backend, tracking API, uploads, secrets and logging.
globs: cms/modules/**/src/**, cms/modules/**/routes/**, cms/config/**, api/src/**, **/.env*
---

# Security Rules

## Secrets
- NEVER hardcode or commit secrets/keys/tokens; read from `.env` via `config()` (CMS) or `process.env` (API).
- NEVER stage `.env*` (except `.env.example` with placeholders), credentials, dumps, or build output.

## AuthN / AuthZ & Cryptographic Keys (`HmacKeyUtil`)
- CMS API: Sanctum bearer token; every non-public route behind `auth` + `CheckModulePermission`. New public routes need explicit justification in the plan.
- **Centralized Key Generation, Hashing & Signing (`Modules\Core\Support\HmacKeyUtil`)**: Every CMS screen `secret_key`, vendor `api_key`, key hash, HMAC signature, or key verification MUST be generated and verified through `HmacKeyUtil`'s generic helpers (`generateScopedKey`, `verifyScopedKey`, `generatePrefixedKey`, `hash`, `signPayload`, `verifyPayload`, `verifyKeyMatch`). NEVER add domain-specific methods to `HmacKeyUtil`, and NEVER hand-roll `bin2hex(random_bytes(...))`, `hash('sha256', ...)`, `hash_hmac(...)`, or `Str::random(...)` for cryptographic keys in feature Services or Seeders.
- Tracking API (Strict Dual-Key Separation):
  - `X-DOOH-API-KEY` = **Vendor** key (`dooh_live_...`, hashed `sha256` against `vendors.api_key_hash`, scoped to that vendor's resources & rate limit).
  - `X-DOOH-SCREEN-KEY` = **Screen / Player** key (64-hex `screens.secret_key`, scoped to that single screen). NEVER put keys in URL query strings; always compare secrets with constant-time functions (`timingSafeEqual` / `hash_equals`).
  - Beacons (`/api/v1/log/imp/:hash`, `/complete/:hash`): no auth header; trusted only through valid, unexpired AES-256-GCM `:hash` (`exp` checked).

## Input & Output
- All CMS input MUST be strictly validated (types, lengths, `exists:`/`in:` rules): use a dedicated `FormRequest` (`src/Http/Requests/*Request.php`) for `≥ 3` fields, entity `store`/`update` payloads, nested rules, or `prepareForValidation()`; inline `$request->validate()` in the Controller is permitted only for trivial `1–2` simple scalar fields. No raw SQL concatenation; use bindings/Eloquent.
- NEVER return hidden fields (`password`, `secret_key`, tokens) — use `$hidden` / API Resources.
- Errors to clients: generic message; details only in server logs.

## Logging
- NEVER log passwords, tokens, API keys, full `:hash` payloads, or request bodies with PII. Mask IPs where not required.

## Uploads & Creatives
- Whitelist MIME + extension + max size (see skill `dooh-creative-validation`); store with random names outside public web root or via `Storage` disk; never trust client filename.
- HTML5 creatives render only in `<iframe sandbox="allow-scripts allow-same-origin">`; VAST/remote fetches with timeout and URL scheme check (`https` only).
