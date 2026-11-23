---
name: core-reusability-promoter
description: Use before creating any new component, hook, service, repository, or endpoint. Search-first REUSE / EXTEND / CREATE decision and promotion to Core.
---

# Reusability & DRY (REUSE → EXTEND → PROMOTE → CREATE)

## 1. Search `Core` First (`git grep -n "<keyword>" -- cms/modules`)

| Area | Existing `Core` Inventory |
|---|---|
| Frontend Components (`@core/components/`) | `ListLayout`, `Table`, `CustomModal`, `StatusTag`, `DynamicFilterBar`, `AuthGuard`, `GuestGuard`, `NotFoundPage` |
| Frontend Hooks & Store (`@core/`) | `hooks/` (`useAction`, `useFilter`, `usePagination`, `useAuthInit`), `store/metadataSlice`, `store/metadataThunk` (`fetchMetadata`), `Action/metadataApi`, `types/metadata` |
| Frontend Utils & Configs (`@core/`) | `utils/formatters`, `utils/error` (`extractErrorMessage`), `utils/tokenStorage`, `configs/pagination`, `configs/status`, `configs/theme` (`UREKA_COLORS`), `Action/api` (`http`), `routes/registry` |
| Backend (`Modules\Core\`) | `BaseController`, `ApiResponseTrait`, `BaseRepository`, `BaseRepositoryInterface`, `Filterable`, `HasOwner`, `MetadataService` (`configs/metadata.php`), `DisplaySpecHelper`, `HmacKeyUtil`, `UserPermissionHelper`, `CheckModulePermission`, `DynamicRouteResovle` |

## 2. Decision & Rule of 2 (DRY)

| Strategy | When | Action |
|---|---|---|
| **REUSE / EXTEND** | Exists in `Core` or module (or fits with an optional prop/param) | Use/extend directly; NEVER create duplicate or pass-through wrappers |
| **PROMOTE TO CORE (`≥ 2` Modules)** | Logic, math, formatter, UI block, or metadata status/enum used by `≥ 2` modules | Place in `cms/modules/Core/` (`Modules\Core\Support\`, `Traits\`, `configs/metadata.php`, `@core/utils/`, `@core/components/`) |
| **EXTRACT IN MODULE (`≥ 2` Places in `1` Module)** | Setup lines, normalization, `<Select options>`, or JSX repeated in `≥ 2` methods/files of 1 module | Extract to a single `protected` method, `configs/*.ts`, `hooks/use*.ts`, or sub-component; NEVER put single-module options in `Core` metadata |

## 3. Pre-Finish Audit

- Delete any pass-through wrapper, barrel `index.ts`, `DTO`, `ServiceInterface`, dead/uncalled method, or unused `configs/<module>.php`.
- Append to report: `Reused:` paths · `Extended:` paths · `Created:` paths + reason.
