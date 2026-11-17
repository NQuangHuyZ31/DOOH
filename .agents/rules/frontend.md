# Frontend Engineering Rules (React 19/18 + TypeScript + Ant Design 5/6)

Scope: `cms/modules/*/resources/js/`. Read when editing frontend code.
Detailed Architecture: [`docs/frontend/architecture.md`](file:///E:/Urekamedia/DOOH/docs/frontend/architecture.md)

---

## 1. Component Placement & Module Core Architecture
- **Module Core (`modules/Core/`)**: A dedicated module housing ALL shared infrastructure: SPA root entrypoint (`modules/Core/resources/js/app.tsx`), HTTP client (`@core/Action/api`), shared components (`@core/components/`), custom hooks (`@core/hooks/`), common configs (`@core/configs/`), and layouts (`@core/layouts/`). Zero code in root `cms/resources/`.
- **Layers**: `pages/` (orchestration, layout) -> feature `components/` (decomposed UI) -> `@core/components/` (generic shared UI).
- **Page Responsibility**: Pages MUST NOT contain large inline SVGs, raw data transformations, or inline table column arrays (>40 lines). Extract to sub-components or `configs/`.
- **Strict 150-Line Limit (Hard Invariant)**: TSX files (pages, components) MUST NEVER exceed 150 lines. Any component approaching ~120-130 lines MUST be decomposed proactively:
  1. Extract static column definitions, presets, and select options to `configs/*.ts`.
  2. Extract complex state, handlers, and side effects into custom hooks (`hooks/use*.ts`).
  3. Extract sub-sections or compound layout pieces into sub-components (`components/*.tsx`).
  4. Extract data mapping/formatters to `utils/*.ts`.
- **Core First**: Generic UI components belong in `@core`. Core components MUST NOT import from feature modules or contain domain business logic.

---

## 2. TypeScript Invariants
- **No `any`**: New or modified code MUST NOT introduce `any`. Use strict interfaces, generics, or `unknown` with type narrowing.
- **Typing Payloads**: Define request/response types in API clients (`Action/`) or module types. Do not re-declare in multiple components.
- **Component Props**: Every component MUST declare a typed interface for props with sensible defaults for optionals.

---

## 3. UI, Language & Ant Design Standards
- **Strict English**: 100% of all user-facing web text (titles, buttons, labels, placeholders, toasts, errors, table headers, empty states) MUST be in English. Vietnamese is strictly prohibited in web UI.
- **Design System**: Use Ant Design tokens and components (`Table`, `Card`, `Modal`, `Select`, `DatePicker`, `Tag`, `Typography`).
- **DOOH Visualization**: Use `@ant-design/plots` (or lightweight Chart.js/Recharts) for analytics dashboards.
- **Reuse Core Components**: Always check `modules/Core/resources/js/components/` for tables (`ListLayout`, `Table`), forms (`ResourceForm`, `CustomModal`, `ConfirmDialog`), and metrics (`CardKPI`, `StatusTag`).

---

## 4. State Management & API Integration
- **Mandatory Redux Toolkit (RTK)**: When API state or domain data must be stored in the store (cross-component sharing, multi-tab caching, server-paginated entity lists, global filters), it **MUST** be placed in the store using **Redux Toolkit (`@reduxjs/toolkit`)**.
- **Strict Separation of Slice & Thunk (Hard Invariant)**:
  - **NEVER write `createSlice` and `createAsyncThunk` in the same file.**
  - **Thunk File (`store/<domain>Thunk.ts`)**: Contains all asynchronous operations created via `createAsyncThunk`. Responsible strictly for async network requests (invoking API clients from `Action/`), error payload transformation with `rejectWithValue`, and response extraction.
  - **Slice File (`store/<domain>Slice.ts`)**: Contains state interfaces, initial state, synchronous reducers, and builder `extraReducers` that respond to the lifecycle actions (`pending`, `fulfilled`, `rejected`) of thunks imported from `<domain>Thunk.ts`.
  - **No Re-exporting Thunks in Slice**: Slices MUST NOT re-export thunks (`export { fetchMe, logout } from './authThunk'` is strictly forbidden). Consumers must import thunks directly from `<domain>Thunk.ts`.
  - **File Convention**:
    - `modules/<ModuleName>/resources/js/store/<domain>Thunk.ts` (Thunks only)
    - `modules/<ModuleName>/resources/js/store/<domain>Slice.ts` (Slice only)
  - **Forbidden**: Writing `createAsyncThunk` inside `*Slice.ts` files, re-exporting thunks from slices, mixing network logic into slice files, legacy raw Redux boilerplate, and unmanaged ad-hoc global state.
- **State Partition**:
  - **Redux Toolkit Slice + Thunk** (`store/<domain>/`): Shared entity lists (venues, line items), server pagination, search filters, and multi-tab state.
  - **Direct API + `useAction`**: Single row mutations (delete, toggle status, submit modal, export) and local transient UI state.
  - NEVER store the exact same entity dataset in both Redux and local React state.
- **HTTP Client**: Use `http` from `@core/Action/api` (Sanctum bearer token, 401 handling). Never use raw `fetch()` or custom axios instances.
- **URL Query Parameters**: Use `useSearchParams` only when filter/pagination state must be shareable via link.

---

## 5. Imports & Clean Export Boundaries
- **No Redundant `index.ts` / `index.tsx`**: NEVER generate unnecessary index files in feature module directories. Import components, pages, and configs directly from their respective files (e.g. `@modules/Venue/resources/js/pages/VenueListPage`). Only `@core` root package exports use `index.ts`.
- **No Re-export Dumping in `index.ts` (Strict Clean Boundary)**:
  - If a module has a root `index.ts`, it MUST ONLY export its minimal package shell contract (e.g. `export { authRoutes, authReducer }`).
  - **NEVER re-export internal slice actions (`setCredentials`, `clearAuth`), thunks (`fetchMe`, `logout`), configs, or sub-components in `index.ts`**.
  - Consumers that need actions, thunks, or sub-components MUST import directly from their dedicated files (e.g. `import { fetchMe } from '@modules/Auth/resources/js/store/authThunk';`).
- **Path Aliases**: Use `@core/...` and `@modules/<Module>/...`. Sibling relative imports (`./`, `../`) are allowed. NEW imports MUST NOT use `../../` or deeper.
- **Static Configs**: Move column definitions, presets, and select options to `configs/` (e.g. `configs/tableConfig.ts`). Do not inline in TSX.

---

## 6. SOLID & God Component Prevention
- **SRP & God Components**: Enforce the <= 150 lines hard limit. Decompose any oversized components into sub-components (`<Toolbar />`, `<ScreenSimulatorModal />`). Separate view rendering from stateful logic (custom hooks).
- **ISP (Prop Segregation)**: Components must accept only the exact props they require. Never pass monolithic entity objects when only 2-3 fields are rendered.
- **DIP**: Rely on abstracted HTTP clients (`@core/Action/api`) and custom hooks. Never make direct fetch calls from presentation components.
