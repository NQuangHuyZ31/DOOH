---
trigger: glob
description: Laravel backend architecture for cms/modules (3-layer, dynamic routing, providers, factories).
globs: cms/modules/**/src/**, cms/modules/**/database/**, cms/modules/**/routes/**
---

# Backend Rules (Laravel 11/12, PHP 8.3)

Deep dive: `docs/backend/architecture.md`. DB: `database.md`. Tests: `testing.md`. Responses: `api-contract.md`.

## 1. Strict 3-Layer & Mandatory Core Inheritance

| Layer | Path | MUST (Inheritance & Responsibility) | NEVER |
|---|---|---|---|
| Controller | `src/Http/Controllers/` | `extend Modules\Core\Http\Controllers\BaseController`; explicit `: JsonResponse`; keep actions thin (`≤ 15–20` lines); validate via `FormRequest` (`$request->validated()`) for `≥ 3` fields, entity `store`/`update`, nested arrays, or `prepareForValidation()` (inline `$request->validate()` allowed ONLY for trivial `1–2` scalar fields); format output via `src/Resources/<Entity>Resource.php` + `ApiResponseTrait` | inject Repositories, run queries, hold business logic (`if ($existing->status === ...)`), repeat auth/context setup lines across methods, validate `≥ 3` fields inline, return raw Models, or call `response()->json()` |
| Service | `src/Services/` | single-domain business logic, `DB::transaction()`, dispatch `Jobs`/`Mail`; inject Repository **interfaces** or peer Services (DI); pass `$filters` to Repository methods; resolve auth/review context once in a `protected` helper; only define methods with a real caller | `Model::where/create`, `DB::table()`, `$this->...Repository->getModel()`, query/filter chains (`where`, `whereHas`, `with`, `orderBy`, `paginate`), `$model->update()`/`delete()`, dead getters (`get*Repository()`), unused methods (`getAll*` when only `paginate` is used), ad-hoc `transform*()` helpers, magic fallbacks (`$data['x'] ?? 1920`) on nullable DB columns, `env()`, `ServiceInterface`, or `DTO`s |
| Repository | `src/Repositories/` | MySQL: `extend Modules\Core\Repositories\BaseRepository implements <Model>RepositoryInterface` (`parent::__construct($model)`); interface MUST `extend BaseRepositoryInterface`; set `protected array $with = [...]` / `$withCount = [...]`; reuse `BaseRepository` (`all($columns, $filters)`, `paginate($perPage, $filters)`, `find($id)`, `create($data)`, `update($id, $data)`, `delete($id)`); encapsulate 100% of custom queries, filtering, sorting, and pivot `sync()` | business logic, standalone Repo without `extends BaseRepository`, unbounded `all()`/`get()` on large tables, duplicating `BaseRepository` methods (`findById`, `update<Entity>`, `delete<Entity>`, `findWithRelations`, `getAllWithRelations`, `paginateWithFilters`), or uncalled methods |
| Model | `src/Models/` | declare `$table`, `$fillable`, `$hidden`, `$casts` (`'deleted_at' => 'datetime'`); business entities MUST `use SoftDeletes, Filterable, HasOwner;` + `protected array $filterable = [...]`; relationships (`BelongsTo`, `HasMany`, `BelongsToMany`) and pure in-memory checks only | persistence mutations (`$this->save()`, `sync()`, `detach()`), cross-model queries (`Role::find()`, `Permission::where()`), hard-deleting business entities, or duplicating Repository methods |
| Resource | `src/Resources/` | `extend Illuminate\Http\Resources\Json\JsonResource`; format single, collection, and paginated outputs; preserve `null` on nullable columns (`$this->col !== null ? (int) $this->col : null`) | DB queries (`N+1`), casting nullable fields directly (`(int) $this->nullable_col` turning `null` into `0`) |

- **Providers & Configs**: Bind `$this->app->bind(<Model>RepositoryInterface::class, <Model>Repository::class)` in `<Module>ServiceProvider`. Only create/merge `configs/<module>.php` if actively read via `config('<module>....')` — delete unused config files. NEVER call `env()` outside `configs/*.php`.
- **Respect DB Nullability**: Keep omitted nullable fields as `null`; on partial `update`, read `$data['field'] ?? $existing->field` for derived calculations and only compute when non-null.

## 2. Service Decomposition, DRY & Core Reuse

- **Split Services by SRP**: Extract cohesive sub-domains into dedicated services (`OtpService`, `RoleService`, `VastParserService`, `PacingService`) before a Service exceeds ~300 lines.
- **Zero Duplication (DRY — Rule of 2)**:
  - **`≥ 2` Services/Modules → `Modules\Core\Support\`**: Promote shared math/helpers (`DisplaySpecHelper::deriveAspectRatio`, `HmacKeyUtil`, `UserPermissionHelper`, Redis playlist cache eviction) to `Modules\Core\Support\`.
  - **Key Generation, Hashing & Signing via `HmacKeyUtil` ONLY (`Modules\Core\Support\HmacKeyUtil`)**: All secret keys, API keys, key hashes, HMAC payload signatures, and key verifications (`generateScreenKey`, `verifyScreenKey`, `signPayload`, `verifyPayload`, `verifyKeyMatch`, or new key helpers) in Services and Seeders MUST use `HmacKeyUtil`. If a new key/hash/signature format is needed, extend `HmacKeyUtil` — NEVER write inline `bin2hex(random_bytes(...))`, `hash('sha256', ...)`, `hash_hmac(...)`, or `Str::random(...)` for secret/API keys in feature modules.
  - **Intra-Class DRY**: NEVER repeat setup lines (e.g., `$user = $request->user(); $canReview = UserPermissionHelper::canReview($user);`) across `≥ 2` methods in a Controller/Service or thread `$userId, $canReview` through every Service signature; centralize in a `protected` Service helper or `BaseController`. Share common `create`/`update` normalization via a `protected` Service method.
- **Scoped Metadata (`cms/modules/Core/configs/metadata.php` & `MetadataService`)**:
  - **Shared (`≥ 2` Modules / Global)**: Put global pagination defaults, common/shared statuses, status `tags`, and cross-module enums in `Core/configs/metadata.php` (`GET /admin/api/core/metadata`).
  - **Single-Module (`1` Module)**: Keep single-module-only options/configs inside that module (`cms/modules/<Module>/configs/` or module API), NEVER in `Core` metadata.

## 3. Dynamic Routing & RBAC

- `Modules\Core\Support\DynamicRouteResovle`: `/{module}/{controller}/{id?}/{action?}` → `Modules\<Module>\Http\Controllers\<Studly>Controller` (default `<Module>Controller`).
- Every `public` controller method is an endpoint → helpers MUST be `protected`/`private`. NEVER create dummy `IndexController`.
- RBAC via `CheckModulePermission` (`GET→<module>.view`, `POST→<module>.create`, `PUT/PATCH→<module>.edit`, `DELETE→<module>.delete`; returns 401/403).

## 4. Seeders & Code Style

- Seeders in `modules/<Module>/database/seeders/<Entity>Seeder.php` (`Model::firstOrCreate()`/`create()`), registered in `composer.json` PSR-4 and called from `DatabaseSeeder.php`. No `newFactory()` boilerplate.
- **Style (`Tab Size = 4`, Single-Line Calls, `//` Comments Only)**: 4-space indent; keep constructors, `respondSuccess`/`respondCreated`, and 2–4 arg Service/Repo calls on **1 line** (`≤ 140–160` chars); ZERO `/** ... */` PHPDoc blocks (`@param`, `@return`, `@var`) — rely on native PHP 8.3 types and brief `//` comments only.
- **Playlist Cache Invalidation**: Mutations on `Venue`, `Screen`, `Campaign`, `LineItem`, or `Creative` MUST evict `DEL playlist:venue:{venue_id}` in Redis.
