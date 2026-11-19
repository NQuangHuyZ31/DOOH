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
2. **Plan** → use skill `task-planning`. **No explicit approval = no implementation.** The `Files:` list in the approved plan is a **strict allowlist**.
3. **Branch**: NEVER code on `main`. Use base branches only: `feature | fix | refactor | test | chore | hotfix` (NEVER `feature/<name>`).
4. **Implement**:
   - **Strict File Scope Lock**: ONLY edit/create/delete files explicitly listed in the approved Plan. NEVER format, refactor, or touch out-of-scope files. If an unlisted file must be touched, STOP and justify it to the user.
   - **Reuse & Core Promotion First**: Search `cms/modules/Core/` before writing new code (skill `core-reusability-promoter`). Prefer reusing or extending existing `Core` utilities/components/services over creating new ones; place newly written generic helpers/components directly in `Core`.
   - **Tests**: Ship Feature/Unit tests with every feature or bugfix.
5. **Review** → skill `code-review` (verify `git status --short` matches approved `Files:` allowlist + run quality gates).
6. **Commit (Approval Gate)**: **NEVER** run `git add`, `git commit`, or `git push` without asking and receiving explicit user approval first. Stage explicit paths only (`git add <explicit files>`, NEVER `git add .`), Conventional Commits `type(scope): subject` (see `.agents/rules/git.md`).

## 3. Global Invariants

- **Formatting & Indentation (`Tab Size = 4`)**: MUST use **tab size 4** (`indent_size = 4` / `tabWidth: 4`) across all `.php`, `.ts`, `.tsx`, `.js`, `.cjs`, `.json`, and `.css` files (per root `.editorconfig` and `cms/.prettierrc`: `singleQuote: true`, `semi: true`, `trailingComma: 'all'`). NEVER write 2-space indented code.
- **Zero code outside `cms/modules/`**: shared views/routes/entry (`app.blade.php`, `app.tsx`, `routes/web.php`, `routes/api.php`) live in `modules/Core/`.
- **Cross-Module Isolation**: `Core` NEVER imports feature modules. Feature Module A NEVER queries/imports Feature Module B's internal models, components, hooks, or slices directly (backend cross-module calls go through DI Services/Interfaces or Events/Jobs; shared frontend code used by ≥ 2 modules belongs in `@core`).
- **Providers**: `bootstrap/providers.php` = `AppServiceProvider` + `CoreServiceProvider` only; Core auto-registers `Modules\<Name>\Providers\<Name>ServiceProvider`.
- **Zero Redundant Files & Dead Code (KISS/YAGNI)**:
  - NEVER create speculative abstractions, pass-through wrapper components/hooks, barrel `index.ts` re-exports, `DTO` classes, or `ServiceInterface` files (only Repositories use interfaces for DI/Mocking).
  - Delete obsolete files, unused imports, commented-out code blocks, and debug statements (`console.log`, `dd()`, `dump()`) immediately when refactoring.
- **Minimal Comments (`//` Only — No Docblock Noise)**:
  - NEVER write multi-line PHPDoc/JSDoc blocks (`/** ... */`, `@param`, `@return`, `@var`) that repeat native PHP 8.3 or TypeScript types.
  - Only use brief single-line `//` comments when explaining non-obvious business logic; omit comments entirely when the code is self-explanatory.
- **Git safety**: NEVER `reset --hard`, `clean -fd`, `checkout -B`, force-push, push to `main`, or publish releases/deploys (human gate).
- **Data safety**: NEVER mutate production data or edit merged migrations.

## 4. Scoped Rules (auto-loaded by glob — read manually if not loaded)

| Area | File |
|---|---|
| Git (commit approval gate, branches, explicit staging, safety) | `.agents/rules/git.md` |
| Backend (Controller→Service→Repository, dynamic routing, seeders, configs) | `.agents/rules/backend.md` |
| Frontend (≤150-line TSX, RTK, route/menu registry, Webpack Mix) | `.agents/rules/frontend.md` |
| MySQL / MongoDB / Redis | `.agents/rules/database.md` |
| Tests | `.agents/rules/testing.md` |
| Security | `.agents/rules/security.md` |
| API response & endpoint contracts | `.agents/rules/api-contract.md` |
| Node tracking API | `.agents/rules/node-tracking-api.md` |

Deep docs (read only when needed): `docs/architecture/` (consult `stakeholder-operations-and-flow.md` for real-world DOOH stakeholder operations & flow), `docs/backend/`, `docs/frontend/`, `docs/database/`, `docs/api/`.

## 5. Quality Gates

| Area | Command |
|---|---|
| Frontend (`cms/`) | `npm.cmd run check-types && npm.cmd run mix` (or `npm.cmd run mix:<module>`) |
| Backend (`cms/`) | `php artisan test --filter <Name>` (full `php artisan test` before report) |
| Tracking API (`api/`) | `npm.cmd run build && npm.cmd test` |
