---
name: ureka-module-scaffolder
description: Use when creating a new domain module or a new backend entity (model, repository, service, controller, tests) under cms/modules. Step checklist; rules are in backend/frontend/testing rules.
---

# Module / Entity Scaffolder

Follow `.agents/rules/backend.md`, `frontend.md`, `database.md`, `testing.md` — this file lists steps only. Reference module: `cms/modules/Venue/`.

## 1. Layout

```text
cms/modules/<Module>/
├── composer.json                # PSR-4: src/, database/seeders/
├── configs/<module>.php         # module-scoped config (read env() only here)
├── database/{migrations,seeders}/
├── resources/js/                # see skill rtk-feature-slice (index.tsx + routes/route.tsx)
├── routes/{web.php,api.php}
├── src/{Http/Controllers,Http/Requests,Models,Providers,Repositories/Interfaces,Services,Resources,Jobs,Mail}/
└── tests/{Feature,Unit}/
```

## 2. Backend Steps (per entity)

1. Migration (additive) + Model (`$fillable`, `$casts`, `$hidden`; no `newFactory()` boilerplate).
2. `Repositories/Interfaces/<Model>RepositoryInterface.php` + `Repositories/<Model>Repository.php` (extends `BaseRepository`).
3. `Resources/<Model>Resource.php` (`toArray(Model): array`) for consistent API serialization.
4. `Services/<Model>Service.php` (inject repository interface; no direct Eloquent/DB queries; no `env()` calls).
5. `Http/Requests/Store<Model>Request.php` / `Update<Model>Request.php`.
6. `Http/Controllers/<Model>Controller.php` (extends `BaseController`; explicit `: JsonResponse` return types; helpers `protected`/`private`).
7. `Providers/<Module>ServiceProvider.php` → bind repository interface + `mergeConfigFrom` for `configs/<module>.php`.
8. Seeder in `database/seeders/<Model>Seeder.php` (using `Model::firstOrCreate()` / `create()`, following `cms-tiktok-crawler`); register PSR-4 in module and `cms/composer.json` → `composer dump-autoload`.
9. Tests: `<Model>ApiTest`, `<Model>RepositoryTest`, `<Model>ServiceTest` inside `cms/modules/<Module>/tests/`.

## 3. New Module Only

- Add name to `'modules'` and slug to `'routes'` in `cms/modules/Core/configs/modules.php`.
- Add `mix:<module>` script in `cms/package.json` (`node scripts/mix-module.cjs <Module>`).
- Do NOT touch `bootstrap/providers.php` (auto-discovered by `CoreServiceProvider`).

## 4. Frontend

Run skill `rtk-feature-slice`.

## 5. Verify (from `cms/`)

`php artisan test --filter <Model>` · `npm.cmd run check-types` · `npm.cmd run mix:<module>`
