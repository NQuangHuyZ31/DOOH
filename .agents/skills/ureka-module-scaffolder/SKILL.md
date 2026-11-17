---
name: ureka-module-scaffolder
description: Scaffolds Ureka modular architecture boilerplate for Backend (Laravel 11/12) and Frontend (React 19/18 + TypeScript + Ant Design).
---

# Ureka Module Scaffolder Skill (DOOH Platform)

Use this skill when scaffolding a new domain module in `cms/modules/<ModuleName>/`.

Rules: [`.agents/rules/backend.md`](file:///E:/Urekamedia/DOOH/.agents/rules/backend.md) | [`.agents/rules/frontend.md`](file:///E:/Urekamedia/DOOH/.agents/rules/frontend.md) | Architecture: [`docs/backend/architecture.md`](file:///E:/Urekamedia/DOOH/docs/backend/architecture.md)

---

## 1. Directory Structure (`cms/modules/<ModuleName>/`)
```text
cms/modules/<ModuleName>/
├── composer.json
├── database/migrations/
├── routes/api.php
├── resources/js/ (Action/, components/, configs/, pages/, routes/, store/, index.ts)
└── src/ (Http/Controllers/, Http/Requests/, Models/, Providers/, Repositories/Interfaces/, Services/, Resources/)
```

Standard DOOH Domain Modules:
- `Core`: Base controller, Base repository, Dynamic router, Common components.
- `Auth`: User authentication, roles, API key management.
- `Venue`: Screen inventory, geolocation, resolution, secret keys.
- `Creative`: Asset uploads (Image, Video), HTML5 links, VAST tag parsing.
- `Delivery`: Campaigns, Line Items, Venue targeting, pacing & flight dates.
- `Report`: Ant Design analytics charts, query aggregation from MongoDB.
- `Log`: Raw tracking event lookup, audit trail.
- `Simulator`: LED screen simulation and live playback debugger.

---

## 2. Step-by-Step Scaffolding Checklist

### Step 1: Backend Layer
1. **Model & Migration**: Plural table name, explicit `$fillable` array. (For MongoDB models, extend `MongoDB\Laravel\Eloquent\Model`).
2. **Repository & Interface**:
   - Interface: `src/Repositories/Interfaces/<Model>RepositoryInterface.php`.
   - Implementation: `src/Repositories/<Model>Repository.php` extending `BaseRepository`.
3. **Service Layer**: `src/Services/<Model>Service.php`. Injects repository interface. **NO Model queries in Service**. Handles `DB::transaction()`.
4. **FormRequest & Controller**:
   - `src/Http/Requests/Store<Model>Request.php`.
   - `src/Http/Controllers/<Model>Controller.php` extending `BaseController`.
5. **ServiceProvider**: `src/Providers/<ModuleName>ServiceProvider.php`. Binds repository interface to implementation.

### Step 2: System Registration
1. In `cms/modules/Core/configs/modules.php`: Add slug to `'routes'` and module name to `'modules'`.
2. In `cms/package.json`: Add module alias or build scripts if applicable.

### Step 3: Frontend Layer
1. **API Client**: `resources/js/Action/<name>.ts` using `http` from `@core/Action/api`.
2. **Configs**: Declare column configs and filter presets in `resources/js/configs/`.
3. **Pages**: Create page orchestrator in `resources/js/pages/`. Hard limit $\le$ 150 lines per TSX file.
4. **Routes**: Declare `RouteDef[]` in `resources/js/routes/route.ts` and register via `registerRoutes()` in `resources/js/index.ts`.

---

## 3. Verification
```powershell
# From cms/
npm.cmd run check-types
php artisan test --filter <ModuleName>Test
```
