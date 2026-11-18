---
trigger: glob
description: Security baseline for CMS backend, tracking API, uploads, secrets and logging.
globs: cms/modules/**/src/**, cms/modules/**/routes/**, cms/config/**, api/src/**, **/.env*
---

# Security Rules

## Secrets
- NEVER hardcode or commit secrets/keys/tokens; read from `.env` via `config()` (CMS) or `process.env` (API).
- NEVER stage `.env*` (except `.env.example` with placeholders), credentials, dumps, or build output.

## AuthN / AuthZ
- CMS API: Sanctum bearer token; every non-public route behind `auth` + `CheckModulePermission`. New public routes need explicit justification in the plan.
- Tracking API: `X-DOOH-API-KEY` for delivery endpoints; beacons trusted only through valid, unexpired AES-256-GCM `:hash` (`exp` checked). Compare secrets with constant-time functions.

## Input & Output
- All CMS input MUST be strictly validated (types, lengths, `exists:`/`in:` rules): use a dedicated `FormRequest` (`src/Http/Requests/*Request.php`) for `≥ 3` fields, entity `store`/`update` payloads, nested rules, or `prepareForValidation()`; inline `$request->validate()` in the Controller is permitted only for trivial `1–2` simple scalar fields. No raw SQL concatenation; use bindings/Eloquent.
- NEVER return hidden fields (`password`, `secret_key`, tokens) — use `$hidden` / API Resources.
- Errors to clients: generic message; details only in server logs.

## Logging
- NEVER log passwords, tokens, API keys, full `:hash` payloads, or request bodies with PII. Mask IPs where not required.

## Uploads & Creatives
- Whitelist MIME + extension + max size (see skill `dooh-creative-validation`); store with random names outside public web root or via `Storage` disk; never trust client filename.
- HTML5 creatives render only in `<iframe sandbox="allow-scripts allow-same-origin">`; VAST/remote fetches with timeout and URL scheme check (`https` only).
