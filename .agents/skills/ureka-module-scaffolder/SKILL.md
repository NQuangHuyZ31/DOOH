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

1. Migration (additive; `$table->softDeletes()` on important entities) + Model (`$fillable`, `$casts`, `$hidden`; MUST `use SoftDeletes, Filterable, HasOwner;` + `protected array $filterable = [...]` on filterable/owned entities; relationships & pure in-memory helpers only — NEVER put `save()`/`sync()`/`detach()` or cross-model queries in a Model; no `newFactory()` boilerplate).
2. `Repositories/Interfaces/<Model>RepositoryInterface.php` (**MUST** `extend BaseRepositoryInterface`) + `Repositories/<Model>Repository.php` (**MUST** `extend BaseRepository implements <Model>RepositoryInterface`; declare `protected array $with = [...]` / `$withCount = [...]` and reuse `BaseRepository::paginate($perPage, $filters)`, `all($columns, $filters)`, `find($id)`, `create($data)`, `update($id, $data)`, `delete($id)`. NEVER write a standalone Repository without `extends BaseRepository`, NEVER write duplicate `findById`, `update<Model>`, `findWithRelations`, `getAllWithRelations`, or `paginateWithFilters` wrappers, and NEVER add methods with zero callers).
3. `Resources/<Model>Resource.php` (extends `Illuminate\Http\Resources\Json\JsonResource`) for all API output formatting (single entity, collections, and paginated items — NEVER use ad-hoc `transform*()` helpers in Service).
4. `Services/<Model>Service.php` (inject repository interface; only define methods actually called by Controller/Job/Service; NEVER add `get<Model>Repository()` getters or unused methods; NEVER call `$repository->getModel()`, `Model::where()`, `DB::table()`, or `env()`).
5. `Http/Requests/Store<Model>Request.php` / `Update<Model>Request.php`: mandatory for entity `store`/`update` and any endpoint with `≥ 3` fields, nested array rules, or `prepareForValidation()` (inline `$request->validate()` in a Controller is allowed only for trivial `1–2` simple fields).
6. `Http/Controllers/<Model>Controller.php` (**MUST** `extend BaseController`; type-hints `Store<Model>Request` / `Update<Model>Request` and passes `$request->validated()`; explicit `: JsonResponse` return types; helpers `protected`/`private`).
7. `Providers/<Module>ServiceProvider.php` → bind repository interface (only create/merge `configs/<module>.php` if actively read via `config('<module>....')` — NEVER create an unused config file).
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
