---
name: code-review
description: Use at the REVIEW step after implementing, before reporting or committing. Self-review of git diff against project invariants, run quality gates, produce the final report.
---

# Code Review & Report

## 1. Inspect

```powershell
git status --short
git diff --stat
git diff -- <path>        # read each changed file's diff, not whole files
```

## 2. Checklist (fix before reporting)

| Area | Check |
|---|---|
| **File Scope Lock** | Compare `git status --short` against the approved Plan's `Files:` list — **ZERO** unapproved files touched; no unrelated refactors; no debug logs (`console.log`, `dd`, `dump`), unused imports, or commented-out code |
| **Formatting & Comments** | **Tab size = 4** everywhere (NEVER 2-space indent); `singleQuote: true`, `semi: true` in TS/TSX/JS; naming conventions followed; **ZERO `/** ... */` docblocks** (`@param`, `@return`, `@var`) — only concise single-line `//` comments where genuinely needed |
| **Core Reuse & Zero Bloat** | Existing `Core` components/hooks/utils/base classes reused; generic helpers promoted to `Core`; ZERO redundant files (no barrel `index.ts`, pass-through wrappers, `DTO`s, or `ServiceInterface`s); obsolete files deleted |
| **Backend** | Mandatory Core inheritance (`Controller extends BaseController`, `Repository extends BaseRepository`, `RepositoryInterface extends BaseRepositoryInterface`, `Model use SoftDeletes, Filterable, HasOwner`); ZERO unused `configs/<module>.php` files; Services split by distinct domain responsibility (SRP); input normalized in `FormRequest` (≥ 3 fields / entity `store`/`update`); no queries or `$repo->getModel()` in Service; ZERO arbitrary magic fallback defaults (`$data['x'] ?? 1920`) on nullable/schema-defaulted DB columns; Repositories set `$with`/`$withCount` and reuse `BaseRepository` (`paginate($perPage, $filters)`, `find`, `update`, `delete`) with ZERO duplicate wrapper methods (`findById`, `update<Entity>`, `findWithRelations`, `getAllWithRelations`); ZERO dead/uncalled methods in Service/Repository (no `get*Repository()` getters); `ApiResponseTrait` + `: JsonResponse` + `Resources/*Resource.php` (preserving `null` on nullable columns); no `env()` outside `configs/*.php`; Redis `playlist:venue:{id}` evicted on DOOH entity mutation |
| **Frontend** | Pages orchestrate (≤ 80 lines); Components split by UI responsibility (SRP, every `.tsx` ≤ 150 lines); state/effects extracted to `hooks/use*.ts`; columns/options in `configs/`; ZERO duplicated option arrays between Filter Bar and Form Modal (both read from `metadata` or a single source) and reuse `@core/components/StatusTag` (no local `statusColorMap`); ZERO non-empty fallback option arrays (`metadata?.enums?.x || []` only — NEVER `|| [{ value: ... }]`); no `any` or magic values; English UI; AntD v5 APIs (`open`, `items`); relative `http` paths; thunk/slice split + `try/catch` `.unwrap()`; no `../../`; no cross-module internal imports; no `import.meta.*`; routes/menus in module `routes/route.tsx` + `index.tsx` |
| **Database** | additive migrations; explicit `$fillable` & `$casts`; `$table->softDeletes()` + `SoftDeletes` trait on important entity tables/models (`users`, `venues`, `campaigns`, `line_items`, `creatives`); composite indexes for hot query paths; seeders use `firstOrCreate`/`create` |
| **Security** | no secrets/PII/tokens/OTPs in code or logs; hidden fields not returned; uploads validated |
| **Tests** | Feature + Unit in `cms/modules/<M>/tests/`; pure Unit tests don't call unmocked Laravel facades; regression test for bugs |
| **Docs** | `docs/*` updated if architecture, schema, or endpoint changed |

## 3. Quality Gates (only for touched areas, from `AGENTS.md` §5)

`npm.cmd run check-types` · `npm.cmd run mix` (or `mix:<module>`) · `php artisan test` · `npm.cmd run build && npm.cmd test` (api)

## 4. Report Template

```markdown
**Summary:** <1–2 lines>
**Files:** NEW/MODIFY/DELETE `path` — purpose
**Gates:** check-types ✅ · tests ✅ (N passed)
**Reuse:** reused/extended/created (from core-reusability-promoter)
**Notes / follow-ups:** <risks, manual steps>
**Commit (awaiting approval):** `type(scope): subject`
```
