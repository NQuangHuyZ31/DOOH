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
5. **Ant Design System & Ureka Media Brand Theme**:
   - Standard Ant Design v5 components (`Table`, `Card`, `Modal`, `Select`, `DatePicker`) and design tokens configured in `@core/configs/theme.ts` (`UREKA_COLORS` & `doohTheme`).
   - Brand palette from the Ureka Media logo: Primary Magenta `#EA088B`, Purple `#652E8D`, Info Cyan `#0999D6`, Success Green `#74BE44`, Warning Orange `#F79420`, Error Red `#ED3325`, Dark Charcoal `#221F1F`.
   - Typography: `'Plus Jakarta Sans', 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.

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

All API operations and domain entity states **MUST** be managed in the Redux store using **Redux Toolkit (`@reduxjs/toolkit`)** to prevent redundant `useState` proliferation across pages, components, and hooks:

1. **Strict Separation of Slice & Thunk (Hard Invariant)**:
   - Slices and Thunks **MUST NOT** be combined into one file.
   - **Thunk File**: `modules/<ModuleName>/resources/js/store/<domain>Thunk.ts` (contains all `createAsyncThunk` functions calling `Action/<entity>Api.ts`).
   - **Slice File**: `modules/<ModuleName>/resources/js/store/<domain>Slice.ts` (contains `createSlice`, initial state, reducers, and `extraReducers(builder => ...)`).
2. **Async Operations & Dispatch Handling**:
   - Built in `<domain>Thunk.ts` using `createAsyncThunk` invoking stateless API clients in `Action/<entity>Api.ts` (which use `http` from `@core/Action/api`).
   - In UI/hook handlers, always await thunks with `.unwrap()` inside `try / catch` (`await dispatch(thunk(payload)).unwrap()`) and format errors via `extractErrorMessage(err, fallback)`. **NEVER** branch with `if (thunk.fulfilled.match(action))`.
3. **State Partitioning & `useState` Minimization**:
   - **Store (RTK Slice + Thunk)**: All API data and async lifecycle states (`items`, `selectedItem`, `pagination`, `loading`, `submitting`, `error`), plus CRUD/status mutations.
   - **Forms (`Form.useForm()`)**: All form field values, validation, and reset lifecycles MUST use Ant Design's `Form.useForm()` instead of `useState`.
   - **Local State (`useState`)**: Restricted strictly to minimal, isolated ephemeral UI toggles (at most 1–2 hooks when not already represented in Redux or AntD Form).
4. **Forbidden**:
   - Hardcoding arrays or fallback select options (e.g., `DEFAULT_PERMISSION_OPTIONS`, `INITIAL_ROLES`) for data that belongs in the database or backend API — always initialize slice state with `[]` and fetch from the API.
   - Calling API clients directly inside components/pages/hooks and storing `data`, `loading`, `submitting`, or `error` in `useState`.
   - Writing `createAsyncThunk` and `createSlice` in the same file, or re-exporting thunks from a slice file.
   - Legacy raw Redux (manual action creators, switch-case reducers) or ad-hoc custom state containers.
