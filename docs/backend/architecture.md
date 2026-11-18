# CMS Backend Architecture (Laravel 11/12)

Architecture standards, directory layout, and 3-layer pattern for the CMS Laravel application.

---

## 1. Strict 3-Layer Architecture

`Controller → Service → Repository`

```text
HTTP Request ──► Controller Layer (BaseController, FormRequest, ApiResponseTrait)
                      │
                      ▼ Calls Service method
                 Service Layer (Business Logic, Transactions, Cache Invalidation)
                      │
                      ▼ Injects Repository Interface
                 Repository Layer (BaseRepository, Eloquent / MongoDB queries)
                      │
                      ▼
                 Database (MySQL / MongoDB)
```

### Layer Invariants
1. **Controller Layer**: HTTP handling only. Never execute direct database queries or business mutations. Extract validation into dedicated `Http/Requests/*Request.php` (`FormRequest`) whenever validating `≥ 3` fields, entity `store`/`update` payloads, nested arrays, or custom normalization (`prepareForValidation()`); inline `$request->validate()` is permitted only for trivial `1–2` simple fields.
2. **Service Layer**: Orchestrates domain logic and transactions (`DB::transaction`). Depends strictly on **Repository Interfaces**. STRICTLY FORBIDDEN from direct Model queries (`Model::where()`, `DB::table()`).
3. **Repository Layer**: Encapsulates database queries. Extends `BaseRepository` (MySQL) or implements MongoDB aggregation interfaces.

---

## 2. Modular Directory Structure

```text
cms/app/Modules/ (or cms/modules/)
├── <ModuleName>/
│   ├── Http/Controllers/        # Extends BaseController
│   ├── Http/Requests/           # FormRequest classes
│   ├── Models/                  # Eloquent (MySQL) or MongoDB Models
│   ├── Providers/               # ServiceProvider binding interfaces
│   ├── Repositories/            # Implementation extending BaseRepository
│   │   └── Interfaces/          # Repository contracts
│   ├── Services/                # Business services
│   └── routes/api.php           # Optional explicit routes
```

---

## 3. Dual-Database Integration
- **MySQL Connection (`mysql`)**: Core relational models extend `Illuminate\Database\Eloquent\Model`. Explicit `$fillable` on all models.
- **MongoDB Connection (`mongodb`)**: Log models extend `MongoDB\Laravel\Eloquent\Model`.
- **Cache Eviction**: In `LineItemService` or `LineItemObserver`, on save/delete $\rightarrow$ dispatch `Redis::del("playlist:venue:{$venueId}")`.
