# CMS Frontend Architecture (React + TS + Ant Design)

Architecture standards for the CMS single-page application. Built on the **Modular Pattern** where **`Core` is itself a Module** containing all shared logic.

---

## 1. Core Module Invariants

1. **`Core` is a First-Class Module (`modules/Core/`)**:
   - Contains all reusable infrastructure, base components, HTTP interceptors, layouts, common hooks, and utilities.
   - Other domain modules (`Venue`, `Delivery`, `Creative`, `Report`, `Log`, `Simulator`) import directly from `@core/*`.
   - Domain modules MUST NOT cross-import private internals from sibling modules; shared logic MUST be promoted to `@core`.
2. **Strict 150-Line Limit (Hard Invariant)**:
   - Any TSX file approaching ~120 lines MUST be proactively decomposed:
     - Static column/filter configs $\rightarrow$ `configs/*.ts`.
     - Stateful logic & side-effects $\rightarrow$ custom hooks `hooks/use*.ts`.
     - Layout compound sections $\rightarrow$ sub-components `components/*.tsx`.
3. **100% English UI Text**: All user-facing text (labels, headers, buttons, alerts, toasts) MUST be in English.
4. **No `any`**: TypeScript strict typing across all components and actions.
5. **Ant Design System**: Standard Ant Design 5/6 components (`Table`, `Card`, `Modal`, `Select`, `DatePicker`) and design tokens.

---

## 2. Directory Layout: Module Core & Feature Modules

```text
cms/modules/ (or resources/js/modules/)
├── Core/                        # MODULE CORE: All shared logic
│   ├── Action/api.ts            # Centralized Axios client (Sanctum bearer token, 401 handling)
│   ├── components/              # Generic UI (ListLayout, Table, CustomModal, StatusTag, CardKPI)
│   ├── configs/                 # Common presets (pagination, theme tokens, date formats)
│   ├── hooks/                   # Shared hooks (useAction, useFilter, usePagination, useModal)
│   ├── layouts/                 # MainLayout (Sidebar, Header, Breadcrumb), SimulatorLayout
│   ├── routes/                  # Dynamic route registry and route definition contracts
│   ├── utils/                   # Helpers (formatters, date utilities, URL builders)
│   └── index.ts                 # Export entry for @core alias
├── Venue/                       # Feature Module: Screens inventory & hardware specs
├── Creative/                    # Feature Module: Media upload (Image, Video) & VAST parser
├── Delivery/                    # Feature Module: Campaigns, Line Items, Pacing & Caps
├── Report/                      # Feature Module: Analytics dashboards & Ant Design Plots
├── Log/                         # Feature Module: MongoDB tracking log lookup & audit
└── Simulator/                   # Feature Module: Outdoor LED mockup & live player engine
```

---

## 3. Path Aliases & Imports
Configured in `tsconfig.json` and `vite.config.ts`:
- `@core/*` $\rightarrow$ `modules/Core/*` (or `resources/js/modules/Core/*`)
- `@modules/*` $\rightarrow$ `modules/*`
- Example usage in a feature module:
  ```typescript
  import { ListLayout, Table, StatusTag } from '@core/components';
  import { http } from '@core/Action/api';
  import { useFilter } from '@core/hooks';
  ```

---

## 4. State Management: Mandatory Redux Toolkit (RTK)

Whenever API data or domain entities require global state or cross-component sharing, they **MUST** be placed in the store using **Redux Toolkit (`@reduxjs/toolkit`)**:

1. **Strict Separation of Slice & Thunk (Hard Invariant)**:
   - Slices and Thunks **MUST NOT** be combined into one file.
   - **Thunk File**: `modules/<ModuleName>/resources/js/store/<domain>Thunk.ts` (contains all `createAsyncThunk` functions calling API clients).
   - **Slice File**: `modules/<ModuleName>/resources/js/store/<domain>Slice.ts` (contains `createSlice`, initial state, reducers, and `extraReducers(builder => ...)`).
2. **Async Operations**: Built in `<domain>Thunk.ts` using `createAsyncThunk` invoking API clients or `http` from `@core/Action/api`.
3. **Partitioning**:
   - **Store (RTK)**: Shared entity lists, server pagination, cross-module caching, persistent filters.
   - **Local State (`useState` / custom hook)**: Ephemeral UI state (modals, active dropdowns, simple form inputs).
   - **Direct API (`useAction`)**: Single-row actions (toggle status, quick delete, export).
4. **Forbidden**: Writing `createAsyncThunk` and `createSlice` in the same file, legacy raw Redux (manual action creators, switch-case reducers), or ad-hoc custom state containers.
