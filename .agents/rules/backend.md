---
trigger: glob
description: Laravel backend architecture for cms/modules (3-layer, dynamic routing, providers, factories).
globs: cms/modules/**/src/**, cms/modules/**/database/**, cms/modules/**/routes/**
---

# Backend Rules (Laravel 11/12, PHP 8.3)

Deep dive: `docs/backend/architecture.md`. DB rules: `database.md`. Tests: `testing.md`. Responses: `api-contract.md`.

## 1. Strict 3-Layer: Controller → Service → Repository

| Layer | Path | MUST | NEVER |
|---|---|---|---|
| Controller | `src/Http/Controllers/` | extend `Modules\Core\Http\Controllers\BaseController`; explicit `: JsonResponse` return type; extract validation with `≥ 3` fields, entity `store`/`update` payloads, nested arrays, or `prepareForValidation()` into a dedicated `FormRequest` (`src/Http/Requests/*Request.php`, calling `$request->validated()`); inline `$request->validate()` is allowed ONLY for trivial `1–2` simple fields; call Service only; respond via `ApiResponseTrait` (`respondSuccess`, `respondCreated`, `respondPaginated`, `respondError`, `respondUnauthorized`, `respondForbidden`, `respondNotFound`) | inject Repositories, run queries, hold business logic, validate `≥ 3` fields or complex entity payloads inline in the Controller, call `response()->json()` directly |
| Service | `src/Services/` | single-domain business logic, `DB::transaction()`, dispatch `src/Jobs/` & `src/Mail/`; depend on Repository **interfaces** or peer Services (DI); transform output via `src/Resources/<Entity>Resource.php` | `Model::where/create`, `DB::table()`, any persistence (Model imports for type hints are OK), call `env()` directly, create redundant `ServiceInterface` or `DTO` classes |
| Repository | `src/Repositories/` | MySQL: extend `Modules\Core\Repositories\BaseRepository` + implement `Interfaces/<Model>RepositoryInterface`; eager-load relations (`with([...])`) to prevent N+1; use `paginate()` for lists; Mongo: dedicated interface | business logic, unbounded `all()`/`get()` on large tables |

Bind in `<Module>ServiceProvider`: `$this->app->bind(<Model>RepositoryInterface::class, <Model>Repository::class)`.
Merge module config in `<Module>ServiceProvider::register()`: `$this->mergeConfigFrom(__DIR__ . '/../../configs/<module>.php', '<module>')`. NEVER call `env()` outside `configs/*.php`.
- **Request Validation Rule (`FormRequest` vs Inline Validate)**:
  - **Dedicated `FormRequest` (`src/Http/Requests/<Action><Entity>Request.php`)**: MUST be used whenever validating `≥ 3` fields, entity CRUD `store`/`update` payloads, nested array rules (`*.field`), or custom input normalization (`prepareForValidation()`). Controllers type-hint the `FormRequest` and pass `$request->validated()` to the Service.
  - **Inline `$request->validate([...])` Exception**: Allowed ONLY for trivial endpoints with `1–2` simple scalar fields (e.g., quick status toggle, single OTP code, or 1–2 basic query params) to avoid unnecessary file bloat.

## 2. Service Decomposition & Core Reuse

- **Split Services by Domain Capability (SRP)**: Whenever a module contains a distinct sub-domain or cohesive workflow (e.g., `OtpService` separate from `AuthService`, `RoleService` separate from `UserService`, `PacingService` separate from `PlaylistService`), extract it into a dedicated `<SubDomain>Service` immediately — do NOT wait for a single Service to grow past 300 lines.
- **Reuse & Promote to `Core`**: Always reuse `BaseController`, `BaseRepository` (`find`, `findOrFail`, `all`, `paginate`, `create`, `update`, `delete`), `ApiResponseTrait`, and `MetadataService` (`cms/modules/Core/configs/metadata.php`) from `Modules\Core`.
- **Scoped Metadata (`cms/modules/Core/configs/metadata.php` & `MetadataService`)**:
  - **Shared Only (`≥ 2` Modules / Global)**: `cms/modules/Core/configs/metadata.php` (served via `MetadataService` at `GET /admin/api/core/metadata`) is strictly for platform-wide / cross-module metadata shared across `≥ 2` modules (e.g., global pagination defaults, common statuses, shared status tag mappings, and cross-module enums). If a new shared enum/status is needed across multiple modules, add it to `cms/modules/Core/configs/metadata.php`.
  - **Single-Module Only (`1` Module)**: NEVER place options, enums, or settings used by only a single module into `Core/configs/metadata.php` — keep them in `cms/modules/<Module>/configs/<module>.php` and serve them through that module's own service/endpoint.

## 3. Dynamic Routing & RBAC

- `Modules\Core\Support\DynamicRouteResovle`: `/{module}/{controller}/{id?}/{action?}` → `Modules\<Module>\Http\Controllers\<Studly>Controller`. Omitted/same-as-module controller → `<Module>Controller`.
- Every `public` controller method is an endpoint → helpers MUST be `protected`/`private`.
- NEVER create dummy `IndexController`. Check the dynamic router before adding explicit routes.
- RBAC via `CheckModulePermission` (supports web session and Sanctum bearer token `$request->user() ?? auth('sanctum')->user()`; maps HTTP verbs `GET→<module>.view`, `POST→<module>.create`, `PUT/PATCH→<module>.edit`, `DELETE→<module>.delete`; returns 401/403).

## 4. Seeders & Entity Creation (tiktok-crawler pattern)

- Seeders live in `modules/<Module>/database/seeders/<Entity>Seeder.php` (namespace `Modules\<Module>\Database\Seeders`), autoloaded via PSR-4 in `composer.json`.
- `database/seeders/DatabaseSeeder.php` calls module seeders via `$this->call([RolePermissionSeeder::class, UserSeeder::class, ...])`.
- In tests & fixtures, create records directly using Eloquent (`User::create()`, `User::firstOrCreate()`) or call seeders (`$this->seed(...)`).
- NEVER add speculative `guessFactoryNamesUsing` closures in `CoreServiceProvider` or write boilerplate `newFactory()` in models. Keep it simple and aligned with `cms-tiktok-crawler`.

## 5. Code Style, Isolation & Cache Eviction

- **Formatting & Naming (`Tab Size = 4`)**: PSR-12 with **4-space indentation** (NEVER 2 spaces). Module folder `PascalCase`; classes suffixed (`<Entity>Controller`, `<Entity>Service`, `<Entity>Repository`, `<Entity>RepositoryInterface`, `<Entity>Resource`, `Store<Entity>Request`, `<Action>Job`, `<Action>Mail`); PHP methods/variables `camelCase`; DB columns & JSON keys `snake_case`.
- **Cross-Module Isolation**: Module A MUST NEVER query or mutate Module B's Eloquent Models directly; inject Module B's Service or RepositoryInterface via DI, or dispatch an Event/Job. `Core` MUST NEVER depend on feature modules.
- **Playlist Cache Invalidation**: Any create/update/delete/status change on `Venue`, `Campaign`, `LineItem`, or `Creative` MUST evict `DEL playlist:venue:{venue_id}` in Redis for affected venues.
- **Size & Robustness**: Keep Controllers/Services ≤ ~300 lines and ≤ 7 dependencies. Jobs (`src/Jobs/`) idempotent and retry-safe (`ShouldQueue`). External HTTP: explicit timeout + retry backoff.
