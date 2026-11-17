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
| Controller | `src/Http/Controllers/` | extend `Modules\Core\Http\Controllers\BaseController`; validate via `FormRequest` (`src/Http/Requests/`); call Service only; respond via `ApiResponseTrait` or `src/Resources/` | inject Repositories, run queries, hold business logic, validate inline |
| Service | `src/Services/` | business logic, `DB::transaction()`, events, jobs; depend on Repository **interfaces** (DI) | `Model::where/create`, `DB::table()`, any persistence (Model imports for type hints are OK) |
| Repository | `src/Repositories/` | MySQL: extend `Modules\Core\Repositories\BaseRepository` + implement `Interfaces/<Model>RepositoryInterface`; Mongo: dedicated interface | business logic |

Bind in `<Module>ServiceProvider`: `$this->app->bind(<Model>RepositoryInterface::class, <Model>Repository::class)`.

## 2. Dynamic Routing

- `Modules\Core\Support\DynamicRouteResovle`: `/{module}/{controller}/{id?}/{action?}` → `Modules\<Module>\Http\Controllers\<Studly>Controller`. Omitted/same-as-module controller → `<Module>Controller`.
- Every `public` controller method is an endpoint → helpers MUST be `protected`/`private`.
- NEVER create dummy `IndexController`. Check the dynamic router before adding explicit routes.
- RBAC via `CheckModulePermission` (403 on deny).

## 3. Seeders & Entity Creation (tiktok-crawler pattern)

- Seeders live in `modules/<Module>/database/seeders/<Entity>Seeder.php` (namespace `Modules\<Module>\Database\Seeders`), autoloaded via PSR-4 in `composer.json`.
- `database/seeders/DatabaseSeeder.php` calls module seeders via `$this->call([RolePermissionSeeder::class, UserSeeder::class, ...])`.
- In tests & fixtures, create records directly using Eloquent (`User::create()`, `User::firstOrCreate()`) or call seeders (`$this->seed(...)`).
- NEVER add speculative `guessFactoryNamesUsing` closures in `CoreServiceProvider` or write boilerplate `newFactory()` in models. Keep it simple and aligned with `cms-tiktok-crawler`.

## 4. Size & Robustness

- Split Controllers/Services > ~300 lines or > 7 dependencies into focused sub-services.
- Jobs (`src/Jobs/`) idempotent and retry-safe. External HTTP: explicit timeout + retry backoff.
