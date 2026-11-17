# Backend Engineering Rules (Laravel 11/12 + PHP 8.3+)

Scope: `cms/modules/*/src/`, `cms/database/`, and backend controllers. Read when editing backend code.
Detailed Architecture: [`docs/backend/architecture.md`](file:///E:/Urekamedia/DOOH/docs/backend/architecture.md) | SOLID Principles: [`docs/development/solid-principles.md`](file:///E:/Urekamedia/DOOH/docs/development/solid-principles.md) | API Contracts: [`docs/api/routing-and-contracts.md`](file:///E:/Urekamedia/DOOH/docs/api/routing-and-contracts.md)

---

## 1. Strict 3-Layer Architecture (Controller -> Service -> Repository)
1. **Controller Layer** (`src/Http/Controllers/`):
   - Extends `Modules\Core\Http\Controllers\BaseController`.
   - Handles HTTP inputs, validation via `FormRequest`, response formatting (`respondSuccess`, `respondError`, `respondPaginated`, or an API Resource).
   - In custom actions, MUST ONLY invoke the **Service Layer**.
   - NEVER inject Repositories or execute Eloquent queries / business logic inside custom actions.
2. **Service Layer** (`src/Services/`):
   - Domain business logic, data mutations, transactions (`DB::transaction`), audit events (`Auditor`/`ActivityLogger`), and queue jobs.
   - Depends ONLY on **Repository Interfaces** via Dependency Injection.
   - **STRICTLY FORBIDDEN from direct Model queries or persistence** (never `Model::where()`, `Model::create()`, `$modelClass::...`, or `DB::table()`). Delegate 100% of data access to Repositories.
   - Importing Model classes strictly for type hints / parameter typing is allowed.
3. **Repository Layer** (`src/Repositories/`):
   - Encapsulates all database operations (Eloquent queries for MySQL or Aggregation pipelines for MongoDB).
   - MySQL Repositories: MUST extend `Modules\Core\Repositories\BaseRepository` and implement `<Model>RepositoryInterface` in `src/Repositories/Interfaces/`.
   - MongoDB Repositories: Implement dedicated interfaces (e.g. `TrackingLogRepositoryInterface`, `DailyReportRepositoryInterface`) for fast time-series aggregation.
   - Bound in `<Module>ServiceProvider`: `$this->app->bind(<Model>RepositoryInterface::class, <Model>Repository::class)`.

---

## 2. Dual Database Strategy (MySQL + MongoDB)
- **MySQL Connection (`mysql`)**:
  - Used for transactional, relational entities: `venues`, `campaigns`, `line_items`, `creatives`, `api_keys`, `users`, `roles`, `permissions`.
  - Models extend `Illuminate\Database\Eloquent\Model`.
- **MongoDB Connection (`mongodb`)**:
  - Used for high-volume logs and analytics: `tracking_logs`, `daily_aggregated_reports`.
  - Models extend `MongoDB\Laravel\Eloquent\Model` (using `mongodb/laravel-mongodb`).
  - Strict projection and indexing: Always use indexed fields (`venue_id`, `line_item_id`, `date`) in queries.

---

## 3. Dynamic Routing & Method Safety
- Routes are resolved dynamically by `Modules\Core\Support\DynamicRouteResovle` matching `/{module}/{controller}/{id?}/{action?}` to `Modules\<Module>\Http\Controllers\<Studly>Controller`.
- **No Dummy `IndexController`**: NEVER create redundant `IndexController` or dummy files. Use domain-named controllers (`VenueController`, `CampaignController`, etc.). When `{controller}` is omitted or matches the module slug (e.g. `/venue` or `/venue/1`), `DynamicRouteResovle` automatically routes to `<ModuleName>Controller`.
- **CRITICAL**: Every `public` controller method is an HTTP endpoint. Internal helpers MUST be `protected` or `private`.
- Permissions enforced automatically by `CheckModulePermission` middleware (403 on denial). `auth` and public player simulation routes are exempt as configured.
- Check `DynamicRouteResovle` before adding explicit routes to `routes/api.php`.

---

## 4. Validation & Resources
- Validate all incoming data via dedicated `FormRequest` classes in `src/Http/Requests/`. Never validate inline in controllers.
- Return standardized JSON responses using `ApiResponseTrait` or explicit API Resources from `src/Resources/`.
- Never return raw Eloquent models containing hidden tokens, passwords, or internal database flags.

---

## 5. Background Jobs & Transactions
- Queue jobs (`src/Jobs/`) must be idempotent and safe to retry.
- Wrap multi-table MySQL mutations in `DB::transaction()` inside the Service layer.
- External HTTP integrations must specify timeouts and retry backoffs.

---

## 6. SOLID & God Class Prevention
- **SRP & DIP**: Controllers handle HTTP only; Services orchestrate business logic and depend strictly on Repository Interfaces; Repositories handle database queries.
- **God Class Threshold**: Split Controllers or Services exceeding ~300 lines or >7 dependencies into focused domain sub-services (e.g. `PacingDeliveryService`, `CreativeAssetService`).
- **No Overengineering**: Rely on Laravel & Core base classes (`BaseController`, `BaseRepository`). Never introduce speculative abstract factories or wrappers for simple tasks.
