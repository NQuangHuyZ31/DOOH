---
name: code-review
description: Use at the REVIEW step after implementing, before reporting or committing. Self-review of git diff against project invariants, run quality gates, produce the final report.
---

# Code Review & Report

## 1. Inspect

```powershell
git status --short
git diff --stat
git diff -- <path>
```

## 2. Checklist (fix before reporting)

| Area | Check |
|---|---|
| **File Scope Lock** | `git status --short` matches approved Plan `Files:` allowlist; zero unrelated edits, debug logs (`console.log`, `dd`, `dump`), unused imports, or dead code |
| **Formatting & Comments** | **Tab size = 4** everywhere; `singleQuote: true`, `semi: true`, `printWidth: 230`; **single-line calls/constructors/returns/imports/JSX** when `≤ 140–180` chars (no one-arg-per-line wrapping); **ZERO `/** ... */` docblocks** (`//` only) |
| **Core Reuse, DRY & Zero Bloat** | `Core` reused first; **Rule of 2**: logic used in `≥ 2` modules promoted to `Core`, logic/options/JSX/setup lines repeated in `≥ 2` places/methods extracted to a single helper/config/hook/sub-component; zero pass-through wrappers, barrel `index.ts`, `DTO`s, `ServiceInterface`s, or unused `configs/<module>.php` |
| **Backend** | Mandatory inheritance (`Controller extends BaseController`, `Repository extends BaseRepository`, `RepositoryInterface extends BaseRepositoryInterface`, `Model use SoftDeletes, Filterable, HasOwner`); thin Controller actions (`≤ 20` lines, no repeated `$user`/`$canReview` setup); `FormRequest` for `≥ 3` fields or `store`/`update`; zero queries or `$repo->getModel()` in Service; zero magic fallbacks (`$data['x'] ?? 1920`) on nullable DB columns; zero duplicate Repo wrappers (`findById`, `update<Entity>`, `findWithRelations`) or uncalled methods; `ApiResponseTrait` + `: JsonResponse` + `JsonResource` (preserving `null`); Redis `playlist:venue:{id}` evicted on mutation |
| **Frontend** | Pages `≤ 80` lines, all `.tsx` `≤ 150` lines; Ureka Media theme (`UREKA_COLORS`, zero `#1677ff`); all API calls via separate `Thunk + Slice` with `try/catch` `.unwrap()` and minimal `useState`; zero duplicated options between Filter Bar & Form Modal; reuse `<StatusTag />`; empty array fallbacks only (`|| []`, NEVER `|| [{ ... }]`); no `any`, `../../`, barrel `index.ts`, or `import.meta.*` |
| **DB, Security & Tests** | Additive migrations + `SoftDeletes` on primary entities; no secrets/PII in code/logs; Feature + Unit tests in `cms/modules/<M>/tests/` (pure Unit tests mock interfaces only) |

## 3. Quality Gates

`npm.cmd run check-types` · `npm.cmd run mix` (or `mix:<module>`) · `php artisan test` · `npm.cmd run build && npm.cmd test` (api)

## 4. Report Template

```markdown
**Summary:** <1–2 lines>
**Files:** NEW/MODIFY/DELETE `path` — purpose
**Gates:** check-types ✅ · mix ✅ · tests ✅ (N passed)
**Reuse:** reused/extended/created
**Commit (awaiting approval):** `type(scope): subject`
```
