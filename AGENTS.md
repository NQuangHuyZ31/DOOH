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

1. **Understand** (read-only): `git status --short` + `git branch --show-current`. Unrelated dirty files → STOP and ask.
2. **Plan** → skill `task-planning`. **No explicit approval = no implementation.** Approved `Files:` is a **strict allowlist**.
3. **Branch**: NEVER code on `main`. Base branches only: `feature | fix | refactor | test | chore | hotfix` (NEVER `feature/<name>`).
4. **Implement**:
   - **Strict File Scope Lock**: ONLY touch files in the approved Plan `Files:` allowlist. Need an unlisted file → STOP and ask.
   - **Reuse & Core Promotion First**: Search `cms/modules/Core/` first (skill `core-reusability-promoter`). Reuse/extend `Core` before creating new code; place generic helpers/components in `Core`.
   - **Tests**: Ship Feature/Unit tests with every feature or bugfix.
5. **Review** → skill `code-review` (`git status --short` matches `Files:` allowlist + run quality gates).
6. **Commit (Approval Gate)**: **NEVER** `git add`, `git commit`, or `git push` without explicit user approval. Stage explicit paths only (`git add <paths>`, NEVER `git add .`), Conventional Commits `type(scope): subject` (`.agents/rules/git.md`).

## 3. Global Invariants

- **Formatting (`Tab Size = 4`, `printWidth = 230`)**:
  - MUST use **tab size 4** across all `.php, .ts, .tsx, .js, .cjs, .json, .css` (`singleQuote: true`, `semi: true`, `trailingComma: 'all'`, `printWidth: 230`). NEVER use 2-space indent.
  - **Single-Line Calls**: Keep function/method calls (2–4 args), constructors, `return` statements, imports, destructuring, and JSX tags on **1 line** when `≤ 140–180` chars. NEVER wrap short arguments one-per-line.
- **Zero code outside `cms/modules/`**: shared views/routes/entry (`app.blade.php`, `app.tsx`, `routes/web.php`, `routes/api.php`) live in `modules/Core/`.
- **Cross-Module Isolation**: `Core` NEVER imports feature modules. Module A NEVER imports/queries Module B's internal models, components, hooks, or slices directly (backend: DI Services/Interfaces or Events/Jobs; frontend shared by `≥ 2` modules: `@core`).
- **Providers**: `bootstrap/providers.php` = `AppServiceProvider` + `CoreServiceProvider` only; Core auto-registers `Modules\<Name>\Providers\<Name>ServiceProvider`.
- **Zero Bloat & Dead Code (KISS/YAGNI)**: NEVER create pass-through wrappers, barrel `index.ts`, `DTO`s, `ServiceInterface`s (only Repositories use interfaces), or unused methods/configs. Delete dead code, unused imports, and debug logs (`console.log`, `dd`, `dump`) immediately.
- **Zero Code Duplication (DRY — Rule of 2)**:
  - **`≥ 2` Modules**: Extract shared math/logic (aspect-ratio, code gen, Redis cache eviction, formatters), traits, or UI blocks to `cms/modules/Core/` (`Modules\Core\Support\`, `Modules\Core\Traits\`, `@core/utils/`, `@core/components/`, `@core/hooks/`).
  - **`≥ 2` Places in `1` Module / Class**: Extract to a shared `protected` method, `utils/*.ts`, `configs/*.ts`, `hooks/use*.ts`, or sub-component — NEVER copy-paste logic, setup lines, option arrays, or JSX.
- **Minimal Comments (`//` Only)**: NEVER write `/** ... */` PHPDoc/JSDoc blocks (`@param`, `@return`, `@var`). Use brief single-line `//` ONLY for non-obvious business logic.
- **Safety**: NEVER `reset --hard`, `clean -fd`, `checkout -B`, force-push, push to `main`, mutate production data, or edit merged migrations.

## 4. Scoped Rules

| Area | File |
|---|---|
| Git | `.agents/rules/git.md` |
| Backend | `.agents/rules/backend.md` |
| Frontend | `.agents/rules/frontend.md` |
| Database / Redis | `.agents/rules/database.md` |
| Tests | `.agents/rules/testing.md` |
| Security | `.agents/rules/security.md` |
| API Contracts | `.agents/rules/api-contract.md` |
| Node Tracking API | `.agents/rules/node-tracking-api.md` |

Deep docs: `docs/architecture/stakeholder-operations-and-flow.md`, `docs/backend/`, `docs/frontend/`, `docs/database/`, `docs/api/`.

## 5. Quality Gates

| Area | Command |
|---|---|
| Frontend (`cms/`) | `npm.cmd run check-types && npm.cmd run mix` (or `npm.cmd run mix:<module>`) |
| Backend (`cms/`) | `php artisan test --filter <Name>` (full `php artisan test` before report) |
| Tracking API (`api/`) | `npm.cmd run build && npm.cmd test` |
