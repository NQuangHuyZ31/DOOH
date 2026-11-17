---
name: ureka-module-scaffolder
description: Use when creating a new domain module or a new backend entity (model, repository, service, controller, tests) under cms/modules. Step checklist; rules are in backend/frontend/testing rules.
---

# Module / Entity Scaffolder

Follow `.agents/rules/backend.md`, `frontend.md`, `database.md`, `testing.md` — this file lists steps only. Reference module: `cms/modules/Venue/`.

## 1. Layout

```text
cms/modules/<Module>/
├── composer.json                # PSR-4: src/, database/factories/, database/seeders/
├── database/{migrations,factories,seeders}/
├── resources/js/                # see skill rtk-feature-slice
├── routes/
├── src/{Http/Controllers,Http/Requests,Models,Providers,Repositories/Interfaces,Services,Resources}/
└── tests/{Feature,Unit}/
```

## 2. Backend Steps (per entity)

1. Migration (additive) + Model (`$fillable`, `$casts`, `use HasFactory;`).
2. `Repositories/Interfaces/<Model>RepositoryInterface.php` + `Repositories/<Model>Repository.php` (extends `BaseRepository`).
3. `Services/<Model>Service.php` (inject interface).
4. `Http/Requests/Store<Model>Request.php` / `Update<Model>Request.php`.
5. `Http/Controllers/<Model>Controller.php` (extends `BaseController`; helpers non-public).
6. `Providers/<Module>ServiceProvider.php` → bind interface.
7. Factory + Seeder in module `database/`; register PSR-4 in module and `cms/composer.json` → `composer dump-autoload`.
8. Tests: `<Model>ApiTest`, `<Model>RepositoryTest`, `<Model>ServiceTest`.

## 3. New Module Only

- Add name to `'modules'` and slug to `'routes'` in `cms/modules/Core/configs/modules.php`.
- Do NOT touch `bootstrap/providers.php` (auto-discovered).

## 4. Frontend

Run skill `rtk-feature-slice`.

## 5. Verify (from `cms/`)

`php artisan test --filter <Model>` · `npm.cmd run check-types`
