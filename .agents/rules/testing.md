---
trigger: glob
description: PHPUnit test conventions for CMS modules (Feature/Unit, SQLite memory, RBAC, mocks).
globs: cms/modules/**/tests/**, cms/tests/**
---

# Testing Rules (CMS)

Reference implementation: `cms/modules/Venue/tests/` (copy its structure).

## 1. Layout & Naming

| Type | Path | Base class | Purpose |
|---|---|---|---|
| Feature API | `modules/<M>/tests/Feature/<Entity>ApiTest.php` | `Tests\TestCase` + `RefreshDatabase` | HTTP status, JSON envelope, validation, RBAC |
| Repository | `modules/<M>/tests/Feature/<Entity>RepositoryTest.php` | `Tests\TestCase` + `RefreshDatabase` | queries, scopes, pagination |
| Service unit | `modules/<M>/tests/Unit/<Entity>ServiceTest.php` | `PHPUnit\Framework\TestCase` | pure business logic with `Mockery::mock(<Repo>Interface::class)`; `Mockery::close()` in `tearDown` |

- Namespace `Modules\<M>\Tests\{Feature|Unit}`. Methods `test_<behavior>_<expected>()`.
- Suites auto-discovered by `phpunit.xml` (`modules/*/tests/{Unit,Feature}`); DB = SQLite `:memory:`. Never place module tests under root `cms/tests/{Feature,Unit}/`.
- **Unit vs Feature boundary**: Pure `PHPUnit\Framework\TestCase` unit tests do NOT boot the Laravel container — NEVER call unmocked Laravel facades (`Hash`, `Cache`, `Queue`, `Log`) or `ValidationException::withMessages()` inside pure Unit tests; test `ValidationException`/HTTP/DB behavior in `Feature` tests (`Tests\TestCase`).

## 2. Mandatory Coverage per Endpoint

- `401` unauthenticated (`status: error`), `403` missing permission, `422` validation (`errors.<field>`), `404` missing id, `200/201` success asserting `status`, `data`, `pagination` shape.
- Auth via `$this->authenticateAsSuperAdmin()`; users created via Eloquent or module seeders.
- Data created via Eloquent models (`Model::create()`, `firstOrCreate()`) or seeders (`$this->seed(...)`), following `cms-tiktok-crawler`.

## 3. Isolation

- NEVER hit real MongoDB, Redis, or external HTTP: mock repository interfaces, `Redis::shouldReceive`, `Http::fake()`, `Queue::fake()`, `Storage::fake()`.
- Tests independent and order-free; no `sleep`, no reliance on current date (use `Carbon::setTestNow`).
- Bug fixes start with a failing regression test.

## 4. Gate

`php artisan test --filter <Entity>` while iterating; full `php artisan test` green before report.
