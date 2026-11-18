---
name: core-reusability-promoter
description: Use before creating any new component, hook, service, repository, or endpoint. Search-first REUSE / EXTEND / CREATE decision and promotion to Core.
---

# Reusability (REUSE → EXTEND → CREATE)

## 1. Search First (Mandatory Inventory Check)

Before writing ANY new component, hook, utility, repository method, or service helper, check `Core` first:

| Area | Existing `Core` Inventory (Reuse or Extend first) |
|---|---|
| Frontend Components (`@core/components/`) | `ListLayout`, `Table`, `CustomModal`, `StatusTag`, `AuthGuard`, `GuestGuard`, `NotFoundPage` |
| Frontend Hooks (`@core/hooks/`) | `useAction`, `useFilter`, `usePagination`, `useAuthInit` |
| Frontend Utils, Metadata & Configs (`@core/`) | `store/metadataSlice`, `store/metadataThunk` (`fetchMetadata`), `Action/metadataApi`, `types/metadata`, `utils/formatters`, `utils/error` (`extractErrorMessage`), `utils/tokenStorage`, `configs/pagination`, `configs/status`, `configs/theme` (`UREKA_COLORS`), `Action/api` (`http`), `routes/registry` (`registerRoutes`) |
| Backend (`Modules\Core\`) | `BaseController`, `ApiResponseTrait` (`respondSuccess`, `respondCreated`, `respondPaginated`, `respondError`, `respondUnauthorized`, `respondForbidden`, `respondNotFound`), `BaseRepository` (`all`, `paginate`, `find`, `findOrFail`, `create`, `update`, `delete`), `MetadataService` (`configs/metadata.php`), `CheckModulePermission`, `DynamicRouteResovle`, `ModuleRegistry` |

```powershell
git grep -n "<keyword>" -- cms/modules
```

## 2. Decide (REUSE → EXTEND → PROMOTE TO CORE → CREATE LOCAL)

| Strategy | When | Obligation |
|---|---|---|
| **REUSE** | Existing piece in `Core` or current module fits as-is | Use it directly; NEVER create a duplicate or pass-through wrapper |
| **EXTEND** | Existing `Core` piece fits with an optional prop/parameter | Add backward-compatible optional prop/param; verify all consumers via `git grep` |
| **PROMOTE TO CORE** | New helper/hook/component/metadata is domain-agnostic or shared by `≥ 2` modules (formatting, error parsing, generic modal/table/filter UI, shared statuses/enums/pagination in `Core/configs/metadata.php`) | Create/extend it directly in `cms/modules/Core/` (typed, props-configurable, zero feature-module imports) so all modules benefit |
| **CREATE LOCAL** | Strictly domain-specific to a single module (`1` module only — e.g., `OtpService`, `OtpVerificationForm`, `VenueFormModal`, or single-module enums/configs) | Keep inside the module (`modules/<Module>/configs/` or module components/services); NEVER put single-module-only options into `Core` metadata |

## 3. Zero-Bloat & Simplicity Check (before finishing)

- Did you create any pass-through wrapper, empty placeholder, barrel `index.ts`, `DTO`, or `ServiceInterface`? → **Delete it.**
- Can a large component (> 120 lines) or multi-purpose service be split into focused single-responsibility units? → **Split it.**
- Are there any unused imports, dead functions, or obsolete files left behind? → **Remove them.**
- Did you touch any file outside the approved Plan's `Files:` list? → **Revert out-of-scope edits immediately.**

## 4. Report Lines (append to final report)

`Reused:` paths · `Extended:` paths + consumers verified · `Created:` paths + reason.
