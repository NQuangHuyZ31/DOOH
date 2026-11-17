# Frontend Engineering Rules (React 19/18 + TypeScript + Ant Design 5/6)

Scope: `cms/modules/*/resources/js/`. Read when editing frontend code.
Detailed Architecture: [`docs/frontend/architecture.md`](file:///E:/Urekamedia/DOOH/docs/frontend/architecture.md)

---

## 1. Component Placement & Module Core Architecture
- **Module Core (`modules/Core/`)**: A dedicated module housing ALL shared infrastructure: HTTP client (`@core/Action/api`), shared components (`@core/components/`), custom hooks (`@core/hooks/`), common configs (`@core/configs/`), and layouts (`@core/layouts/`).
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
- **State Partition**:
  - **Redux Slice + Thunk** (`store/<domain>/`): Shared entity lists (venues, line items), server pagination, search filters, and multi-tab state.
  - **Direct API + `useAction`**: Single row mutations (delete, toggle status, submit modal, export).
  - NEVER store the exact same entity dataset in both Redux and local React state.
- **HTTP Client**: Use `http` from `@core/Action/api` (Sanctum bearer token, 401 handling). Never use raw `fetch()` or custom axios instances.
- **URL Query Parameters**: Use `useSearchParams` only when filter/pagination state must be shareable via link.

---

## 5. Imports & Configs
- **Path Aliases**: Use `@core/...` and `@modules/<Module>/...`. Sibling relative imports (`./`, `../`) are allowed. NEW imports MUST NOT use `../../` or deeper.
- **Static Configs**: Move column definitions, presets, and select options to `configs/` (e.g. `configs/tableConfig.ts`). Do not inline in TSX.

---

## 6. SOLID & God Component Prevention
- **SRP & God Components**: Enforce the <= 150 lines hard limit. Decompose any oversized components into sub-components (`<Toolbar />`, `<ScreenSimulatorModal />`). Separate view rendering from stateful logic (custom hooks).
- **ISP (Prop Segregation)**: Components must accept only the exact props they require. Never pass monolithic entity objects when only 2-3 fields are rendered.
- **DIP**: Rely on abstracted HTTP clients (`@core/Action/api`) and custom hooks. Never make direct fetch calls from presentation components.
