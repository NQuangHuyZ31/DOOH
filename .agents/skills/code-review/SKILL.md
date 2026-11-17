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
| Scope | Only approved changes; no unrelated refactors, debug code, commented-out code |
| Backend | Controller→Service→Repository; no queries in Service; helpers non-public; FormRequest; `ApiResponseTrait` |
| Frontend | TSX ≤ 150 lines; no `any`; English UI; `http` client; thunk/slice split; no `../../`; Core reused |
| Database | additive migrations; `$fillable`; indexes for new query paths; cache eviction |
| Security | no secrets/PII in code or logs; hidden fields not returned; uploads validated |
| Tests | Feature + Unit added/updated; regression test for bugs |
| Simplicity | no removable file/abstraction; no duplication |
| Docs | `docs/*` updated if architecture, schema, or endpoint changed |

## 3. Quality Gates (only for touched areas, from `AGENTS.md` §5)

`npm.cmd run check-types` · `php artisan test` · `npm.cmd run build && npm.cmd test` (api)

## 4. Report Template

```markdown
**Summary:** <1–2 lines>
**Files:** NEW/MODIFY/DELETE `path` — purpose
**Gates:** check-types ✅ · tests ✅ (N passed)
**Reuse:** reused/extended/created (from core-reusability-promoter)
**Notes / follow-ups:** <risks, manual steps>
**Commit (awaiting approval):** `type(scope): subject`
```
