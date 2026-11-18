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
| Controller | `src/Http/Controllers/` | extend `Modules\Core\Http\Controllers\BaseController`; explicit `: JsonResponse` return type; extract validation with `≥ 3` fields, entity `store`/`update` payloads, nested arrays, or `prepareForValidation()` into a dedicated `FormRequest` (`src/Http/Requests/*Request.php`, calling `$request->validated()`); inline `$request->validate()` is allowed ONLY for trivial `1–2` simple fields; call Service only; format entity output via `src/Resources/<Entity>Resource.php`; respond via `ApiResponseTrait` (`respondSuccess`, `respondCreated`, `respondPaginated`, `respondError`, `respondUnauthorized`, `respondForbidden`, `respondNotFound`) | inject Repositories, run queries, hold business logic, validate `≥ 3` fields or complex entity payloads inline in the Controller, return raw unformatted Eloquent models when a Resource applies, call `response()->json()` directly |
| Service | `src/Services/` | single-domain business logic, `DB::transaction()`, dispatch `src/Jobs/` & `src/Mail/`; depend on Repository **interfaces** or peer Services (DI); pass `$filters` arrays and parameters to Repository interface methods; only define methods actually called by a Controller/Job/Service | `Model::where/create`, `DB::table()`, `$this->...Repository->getModel()`, building filter/search/sort/eager-load queries (`where`, `whereHas`, `with`, `withCount`, `orderBy`, `paginate`), calling `$model->update()` / `$model->delete()` directly, writing dead getters (`get<Entity>Repository()`), writing unused methods (e.g. `getAll*` when only `getPaginated*` is used), writing ad-hoc `transform*()` helpers (`setAttribute`/`unsetRelation`), calling `env()` directly, or creating redundant `ServiceInterface` / `DTO` classes |
| Repository | `src/Repositories/` | MySQL: extend `Modules\Core\Repositories\BaseRepository` + implement `Interfaces/<Model>RepositoryInterface`; configure default eager-loads via `protected array $with = [...]`; reuse `BaseRepository` methods (`all($filters)`, `paginate($perPage, $filters)`, `find($id)`, `create($data)`, `update($id, $data)`, `delete($id)`) which automatically apply `$this->with` and `Filterable::scopeFilter($filters)`; only add methods for entity-specific queries or pivot syncing that have a real caller | business logic, unbounded `all()`/`get()` on large tables, duplicating `BaseRepository` methods (`findById`, `update<Entity>`, `delete<Entity>`, `findWithRelations`, `getAllWithRelations`, `paginateWithRelations`), or writing unused/speculative query methods |
| Model | `src/Models/` | declare `$table`, `$fillable`, `$hidden`, `$casts` (including `'deleted_at' => 'datetime'`); use `Illuminate\Database\Eloquent\SoftDeletes` for important business entities (`users`, `venues`, `campaigns`, `line_items`, `creatives`); use `Modules\Core\Traits\Filterable` and define `protected array $filterable = [...]` whenever the entity supports filtering/search; define Eloquent relationships (`BelongsTo`, `HasMany`, `BelongsToMany`) and pure in-memory attribute/state checks | writing persistence mutations (`$this->save()`, `sync()`, `detach()`), querying other Models (`Role::find()`, `Permission::where()`), hard-deleting business entities without soft deletes, or duplicating methods that belong in the `Repository` |
| Resource | `src/Resources/` | extend `Illuminate\Http\Resources\Json\JsonResource` (`<Entity>Resource.php`); format all single-entity, collection, and paginated API outputs consistently | database queries (`N+1`), business state mutations |

Bind in `<Module>ServiceProvider`: `$this->app->bind(<Model>RepositoryInterface::class, <Model>Repository::class)`.
Merge module config in `<Module>ServiceProvider::register()`: `$this->mergeConfigFrom(__DIR__ . '/../../configs/<module>.php', '<module>')`. NEVER call `env()` outside `configs/*.php`.
- **Request Validation Rule (`FormRequest` vs Inline Validate)**:
  - **Dedicated `FormRequest` (`src/Http/Requests/<Action><Entity>Request.php`)**: MUST be used whenever validating `≥ 3` fields, entity CRUD `store`/`update` payloads, nested array rules (`*.field`), or custom input normalization (`prepareForValidation()`). Controllers type-hint the `FormRequest` and pass `$request->validated()` to the Service.
  - **Inline `$request->validate([...])` Exception**: Allowed ONLY for trivial endpoints with `1–2` simple scalar fields (e.g., quick status toggle, single OTP code, or 1–2 basic query params) to avoid unnecessary file bloat.
- **Zero Query / Filter Logic in Services & Mandatory `Filterable` + `BaseRepository` Reuse (Hard Rule)**:
  - Models that support list filtering/search MUST use `Modules\Core\Traits\Filterable` and declare `protected array $filterable = [...]` (plus `filterBy<StudlyKey>` on the Model only if a custom filter clause is needed).
  - `BaseRepository` natively supports `protected array $with = []`, `protected array $withCount = []`, and `Filterable` inside `paginate(int $perPage = 15, array $filters = [], array $columns = ['*'])`, `all(array $ columns = ['*'], array $filters = [])`, and `find(int|string $id, array $columns = ['*'])`.
  - Child Repositories MUST configure `protected array $with = [...]` / `$withCount = [...]` and reuse `BaseRepository::paginate($perPage, $filters)`, `all($columns, $filters)`, `find($id)`, `create($data)`, `update($id, $data)`, and `delete($id)`.
  - **NEVER** create duplicate wrapper methods in child Repositories such as `findById()`, `update<Entity>()`, `delete<Entity>()`, `findWithRelations()`, `getAllWithRelations()`, `paginateWithRelations()`, or `paginateWithFilters()` when `BaseRepository` + `Filterable` already handles it.
  - Services MUST NEVER call `$this->...Repository->getModel()` or chain query builders (`->where()`, `->whereHas()`, `->with()`, `->orderBy()`, `->paginate()`).
- **Zero Dead / Uncalled Methods & Zero Model-vs-Repository Duplication (Hard Rule)**:
  - **Strict Call-Site Rule**: Every public method in a `Service`, `Repository`, or `RepositoryInterface` MUST have at least one real caller in a `Controller`, `Service`, or `Job`. NEVER write unused getters (`get<Entity>Repository()`), unused list variants (writing both `getAll*()` and `getPaginated*()` when only one is called), or speculative `getBy*()` methods.
  - **Thin Model (No Model-vs-Repository Duplication)**: Models MUST NOT contain persistence mutations (`$this->save()`, `sync()`, `detach()`) or cross-model DB queries (`Role::find()`, `Permission::where()`). All database writes and pivot table syncing belong exclusively in the `Repository` — NEVER duplicate the same method in both `Model` and `Repository`.
- **Mandatory `JsonResource` Data Formatting (`src/Resources/<Entity>Resource.php`)**:
  - Every entity, collection, or paginated list returned by an API endpoint MUST be formatted using a dedicated `JsonResource` class in `src/Resources/<Entity>Resource.php` (e.g., `new <Entity>Resource($item)`, `<Entity>Resource::collection($items)`, or mapping paginator items through `<Entity>Resource`).
  - NEVER write ad-hoc `transform<Entity>()` methods or mutate Eloquent model attributes/relations (`setAttribute()`, `unsetRelation()`) inside Services or Controllers to shape API output.

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
- **Minimal Single-Line Comments (`//` Only — No PHPDoc Blocks)**: NEVER write `/** ... */` docblocks (`@param`, `@return`, `@var`, class/method descriptions). Rely on native PHP 8.3 parameter and return type hints, and use concise single-line `//` comments ONLY for non-obvious business logic.
- **Cross-Module Isolation**: Module A MUST NEVER query or mutate Module B's Eloquent Models directly; inject Module B's Service or RepositoryInterface via DI, or dispatch an Event/Job. `Core` MUST NEVER depend on feature modules.
- **Playlist Cache Invalidation**: Any create/update/delete/status change on `Venue`, `Campaign`, `LineItem`, or `Creative` MUST evict `DEL playlist:venue:{venue_id}` in Redis for affected venues.
- **Size & Robustness**: Keep Controllers/Services ≤ ~300 lines and ≤ 7 dependencies. Jobs (`src/Jobs/`) idempotent and retry-safe (`ShouldQueue`). External HTTP: explicit timeout + retry backoff.
