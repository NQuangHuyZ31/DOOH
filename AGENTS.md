# AGENTS.md — DOOH Monorepo

`MUST`/`NEVER` = hard invariant. All UI text, commits, and code comments in English.

## 1. Stack

| Part | Path | Tech | Storage | Run from |
|---|---|---|---|---|
| CMS | `cms/` | Laravel 11/12 (PHP 8.3), React 19 + TS + AntD, RTK | MySQL 8 (entities), MongoDB 7 (logs/stats) | `cms/` (`npm.cmd`, `php artisan`) |
| Tracking API | `api/` | Node.js 24, TS, pure `node:http` | Redis 7 (dedup/buffer/cache), MongoDB | `api/` (`npm.cmd`) |

Modules (`cms/modules/`): `Core, Auth, User, Venue, Creative, Delivery, Report, Log, Simulator`.

## 2. Workflow

`UNDERSTAND → PLAN → APPROVAL → SWITCH BRANCH → IMPLEMENT → REVIEW → REPORT`

1. **Understand** (read-only): `git status --short` + `git branch --show-current`. Unrelated uncommitted changes → STOP and ask.
2. **Plan** → use skill `task-planning`. **No explicit approval = no implementation.**
3. **Branch**: NEVER code on `main`. Use base branches only: `feature | fix | refactor | test | chore | hotfix` (NEVER `feature/<name>`).
4. **Implement** approved scope only; reuse before create (skill `core-reusability-promoter`); tests ship with every feature.
5. **Review** → skill `code-review` (diff + quality gates).
6. **Commit**: NEVER commit until the user approves. `git add <explicit files>` (NEVER `git add .`), Conventional Commits `type(scope): subject`.

## 3. Global Invariants

- **Zero code outside `cms/modules/`**: shared views/routes/entry (`app.blade.php`, `app.tsx`, `routes/web.php`, `routes/api.php`) live in `modules/Core/`.
- **Providers**: `bootstrap/providers.php` = `AppServiceProvider` + `CoreServiceProvider` only; Core auto-registers `Modules\<Name>\Providers\<Name>ServiceProvider`.
- **Simplicity (KISS/YAGNI)**: no speculative abstractions, wrappers, DTOs, or interfaces-per-class; no unrelated refactors; every new file/layer must be justified.
- **Git safety**: NEVER `reset --hard`, `clean -fd`, `checkout -B`, force-push, push to `main`, or publish releases/deploys (human gate).
- **Data safety**: NEVER mutate production data or edit merged migrations.

## 4. Scoped Rules (auto-loaded by glob — read manually if not loaded)

| Area | File |
|---|---|
| Backend (Controller→Service→Repository, routing, factories) | `.agents/rules/backend.md` |
| Frontend (≤150-line TSX, RTK, imports) | `.agents/rules/frontend.md` |
| MySQL / MongoDB / Redis | `.agents/rules/database.md` |
| Tests | `.agents/rules/testing.md` |
| Security | `.agents/rules/security.md` |
| API response & endpoint contracts | `.agents/rules/api-contract.md` |
| Node tracking API | `.agents/rules/node-tracking-api.md` |

Deep docs (read only when needed): `docs/architecture/`, `docs/backend/`, `docs/frontend/`, `docs/database/`, `docs/api/`.

## 5. Quality Gates

| Area | Command |
|---|---|
| Frontend (`cms/`) | `npm.cmd run check-types` |
| Backend (`cms/`) | `php artisan test --filter <Name>` (full `php artisan test` before report) |
| Tracking API (`api/`) | `npm.cmd run build && npm.cmd test` |
