# AGENTS.md — DOOH Monorepo Engineering Rules

**Scope:** Monorepo `cms/` (Laravel + React AntD) & `api/` (Node.js Tracking).
**Workflow:** `UNDERSTAND → PLAN → APPROVAL → SWITCH BRANCH → IMPLEMENT → REVIEW → REPORT`.
`MUST`/`NEVER` = mandatory invariant. UI text = 100% English.

---

## 1. Stack & Monorepo Context

| Component | Path | Tech Stack | Storage / DB | Commands Working Dir |
|---|---|---|---|---|
| **CMS** | `cms/` | Laravel 11/12 (PHP 8.3), React 19/18, TypeScript, AntD | **MySQL 8.0** (Entities) + **MongoDB 7.0** (Logs/Stats) | `cms/` (`npm.cmd`, `php artisan`) |
| **API** | `api/` | Node.js 24, TypeScript (Pure HTTP) | **Redis 7.0** (Buffer/Dedup/Cache) + **MongoDB** | `api/` (`npm.cmd`) |

- **Modules**: `Core, Auth, Venue, Creative, Delivery, Report, Log, Simulator, System, User`.
- **Zero Outside Modules (Hard Invariant)**: All shared assets (`app.blade.php`, `app.tsx`, `routes/web.php`, `routes/api.php`) live inside `modules/Core/`. Root `cms/resources/` and `cms/routes/` have no custom app code.
- **Auto-Discovered Providers**: `bootstrap/providers.php` only registers `CoreServiceProvider`. `CoreServiceProvider` scans `modules/` and auto-registers every module's ServiceProvider (`Modules\<Name>\Providers\<Name>ServiceProvider`). NEVER manually register module providers in `providers.php`.
- **Dynamic Routing**: `Core/src/Support/DynamicRouteResovle.php` (`/{module}/{controller}/{action}`). Internal helpers MUST be `protected`/`private`.
- **RBAC**: Enforced via `CheckModulePermission` middleware.

### Scoped Rules & Skills
- **Rules**: Frontend: `.agents/rules/frontend.md` | Backend: `.agents/rules/backend.md` | Database/Mongo: `.agents/rules/database.md` | Tracking API: `.agents/rules/node-tracking-api.md` | Git: `.agents/rules/git-workflow.md` | Simplicity: `.agents/rules/complexity.md`.
- **Skills**: Scaffolder: `.agents/skills/ureka-module-scaffolder/SKILL.md` | Player/Simulator: `.agents/skills/dooh-simulator-and-player/SKILL.md` | Pacing: `.agents/skills/dooh-delivery-pacing/SKILL.md` | Creative Validation: `.agents/skills/dooh-creative-validation/SKILL.md` | Reusability: `.agents/skills/core-reusability-promoter/SKILL.md` | Git: `.agents/skills/git-workflow/SKILL.md`.

---

## 2. Mandatory Workflow & Invariants

```
[1. UNDERSTAND] ➔ [2. PLAN] ➔ [3. APPROVAL] ➔ [4. SWITCH BRANCH] ➔ [5. IMPLEMENT] ➔ [6. REVIEW] ➔ [7. REPORT]
```

1. **Understand**: Read-only inspection. Check `git status` & branch. STOP if uncommitted changes exist.
2. **Plan**: Formulate objective, solution, exact files, complexity justification, risks & test plan.
3. **Approval Gate**: **NO EXPLICIT APPROVAL = NO IMPLEMENTATION**. Wait for user confirmation.
4. **Mandatory Branch Switch (STEP 0 - HARD INVARIANT)**:
   - **NEVER code directly on `main`**.
   - Check current branch: `git branch --show-current`.
   - Switch/create target branch: Use base category branches directly: `feature` (new feature/UI), `fix` (bug fix), `refactor`, or `chore`. **NEVER use sub-branches like `feature/<name>` or `feature/des`**.
5. **Implement**:
   - Scope-only implementation. Reuse before create. No unrequested features.
   - Stage explicit files only: `git add <file>...` (NEVER `git add .`).
   - Conventional Commits in English on the task branch (`feat(scope): ...`, `fix(scope): ...`).
6. **Review**: Inspect git diff, verify architecture & run quality gates.
7. **Report**: Concise summary of changes, created/modified files, test results.

---

## 3. Architecture Constraints & Invariants

| Layer | Hard Invariant | Forbidden |
|---|---|---|
| **Backend (CMS)** | Strict 3-Layer: `Controller → Service → Repository`. Repositories extend `BaseRepository` or Mongo repos. Named domain controllers only (`VenueController`, etc.). Dynamic router auto-dispatches to `<ModuleName>Controller`. All shared code in `Core`. `CoreServiceProvider` auto-registers all module providers. | Dummy/redundant `IndexController`. Model queries or `DB::table()` inside Service. Direct persistence in Controller. Manual registration of module providers in `bootstrap/providers.php`. Custom code outside `modules/`. |
| **Frontend (CMS)** | **Hard Limit $\le$ 150 lines per TSX**. 100% English UI text. Ant Design components. No `any`. Direct file imports. Only `@core` root package exports use `index.ts`. Store: Any API state requiring global store MUST use Redux Toolkit (`@reduxjs/toolkit`). | Redundant `index.ts`/`index.tsx`. Exceeding 150 lines (must extract hooks/configs/subcomponents). Vietnamese in UI. Raw `fetch()`. Legacy raw Redux boilerplate or unmanaged global state. |
| **Tracking API** | Latency **< 3ms** (HTTP 204). Pure Node.js. Opaque token (`:hash`), Redis `SET dedup:{hash} 1 EX 30 NX` + queue. Batch worker to Mongo. | Blocking synchronous Mongo/disk writes in HTTP request pipeline. |
| **Databases** | **Dual-DB**: MySQL for relational entities (explicit `$fillable`, additive migrations); MongoDB for logs (`tracking_logs`, `daily_aggregated_reports` with compound/TTL indexes). | Mutating production data; editing merged migrations; unguarded models (`$guarded = []`). |
| **Git / Deploy** | Never push to `main`. Use base category branches directly (`feature`, `fix`, `refactor`, `chore`). Human Deploy Gate: Merging to `main` creates draft release; human publishes. | Sub-branch slashes (`feature/<desc>`, `feature/des`); destructive git (`reset --hard`, force push); `git add .`. |

---

## 4. Quality Gates

Run from respective directory before committing:
```bash
# Frontend (in cms/):
npm.cmd run check-types

# Backend (in cms/):
php artisan test --filter <TestName>

# Tracking API (in api/):
npm.cmd run build && npm.cmd test
```

---

## 5. Final Checklist
1. Plan approved? ➔ 2. Switched to task branch (not `main`)? ➔ 3. Reused existing components? ➔ 4. TSX $\le$ 150 lines? ➔ 5. Backend 3-layer respected? ➔ 6. Quality gates pass? ➔ 7. Staged explicit files & committed in English?
