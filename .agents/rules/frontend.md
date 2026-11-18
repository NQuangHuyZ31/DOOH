---
trigger: glob
description: React + TypeScript + Ant Design + Redux Toolkit rules for cms/modules/*/resources/js.
globs: cms/modules/**/resources/js/**
---

# Frontend Rules (React 19, TS, AntD, RTK)

Deep dive: `docs/frontend/architecture.md`. New entity flow: skill `rtk-feature-slice`.

## 1. Structure, Decomposition (SRP) & Naming

- **Formatting (`Tab Size = 4`)**: MUST use **tab size 4** (`tabWidth: 4`, `useTabs: true`, `singleQuote: true`, `semi: true`, `trailingComma: 'all'`, `arrowParens: 'always'` per `cms/.prettierrc`). NEVER use 2-space indentation.
- Per module: `Action/` (`<entity>Api.ts`) · `configs/` (`<name>Columns.tsx`, `<name>Config.ts`) · `hooks/` (`use<Name>.ts`) · `components/` (`<PascalCase>.tsx`) · `pages/` (`<Entity>ListPage.tsx`) · `routes/route.tsx` · `store/` (`<domain>Thunk.ts`, `<domain>Slice.ts`) · `types/` (`<entity>.ts`) · `utils/` (`<camelCase>.ts`).
- **Component Decomposition by Responsibility (SRP — do not wait until 150 lines to split)**:
  - **Pages (`pages/*Page.tsx`)**: Strictly orchestrate layout, hooks, and child components (target ≤ 80 lines; NEVER define inline table column arrays, complex forms, or business state calculations inside a Page).
  - **Components (`components/*.tsx`)**: Single-responsibility UI blocks (e.g., `LoginForm`, `OtpVerificationForm`, `LoginHeaderBadge`, `<Entity>Table`, `<Entity>FormModal`). Split distinct visual sections or modals into separate components, but NEVER create pass-through wrapper components that add no layout or logic.
  - **Hooks (`hooks/use*.ts`)**: Extract stateful workflows, `useEffect` lifecycles, API orchestration, and form/table handlers out of `.tsx` files so components remain declarative.
  - **Configs (`configs/*.ts(x)`)**: Extract table column factories (`get<Entity>Columns`), filter schemas, select options, and static constants (no magic numbers/strings in JSX).
  - **Hard Limit**: Every `.tsx` file MUST be **≤ 150 lines**.
- **Core-First Reuse & Promotion** (`modules/Core/resources/js/`):
  - **Always search and reuse `@core` first** before writing any new component, hook, or utility:
    - `components/`: `ListLayout`, `Table`, `CustomModal`, `StatusTag`, `AuthGuard`, `GuestGuard`, `NotFoundPage`
    - `hooks/`: `useAction`, `useFilter`, `usePagination`, `useAuthInit`
    - `utils/` & `configs/`: `utils/formatters`, `utils/error`, `utils/tokenStorage`, `configs/pagination`, `configs/status`, `configs/theme`, `layouts/MainLayout`, `routes/registry`
  - **Evaluate for `@core` promotion**: If a new component, hook, or helper function is domain-agnostic (e.g., date/currency formatter, error extractor, generic modal/filter control, status badge), place it in `@core` (or extend an existing `@core` file via optional props) instead of writing a module-local copy.
  - Feature Module A NEVER imports internal components/hooks/slices from Feature Module B.

## 2. TypeScript

- NEVER `any` (use interfaces, generics, `unknown` + narrowing). Typed props interface for every component.
- Request/response types declared once (`Action/` or `types/`); ISP: pass only the fields a component needs.

## 3. UI & Ant Design v5

- 100% English user-facing text. AntD v5 components/tokens; charts via `@ant-design/plots`.
- **AntD v5 APIs only**: MUST use `open` on `Modal`/`Drawer`, `items` array prop on `Menu`/`Tabs`/`Dropdown`/`Breadcrumb`, and `<Input.OTP />` for OTP inputs. NEVER use deprecated v4 APIs (`visible`, `<Menu.Item>`, `<Tabs.TabPane>`).

## 4. State & HTTP

- HTTP only via `http` from `@core/Action/api` (bearer token + 401 redirect) using relative resource paths (`'/auth/login'`, `'/venue'`). NEVER prepend `/admin/api` manually, and NEVER use raw `fetch()` or new axios instances.
- Shared/server-paginated/cross-page data → RTK. Single mutations & transient UI → `useAction` + local state. NEVER hold the same dataset in both.
- **Thunk & Slice in separate files (hard)**: `store/<domain>Thunk.ts` (`createAsyncThunk` + `rejectWithValue`) and `store/<domain>Slice.ts` (state, reducers, `extraReducers`). Slices NEVER re-export thunks. Reducers registered in `@core/store/store.ts`.
- `useSearchParams` only for shareable filter/pagination state.

## 5. Imports, Routing & Build Pipeline (Laravel Mix + Webpack 5)

- Always import via explicit paths (`@core/Action/api`, `@core/components/ListLayout`, `@core/routes/registry`, `@modules/<Module>/...`); `./` and `../` OK; NEVER `../../` or deeper.
- **NEVER create barrel `index.ts` files** (neither in `@core` root nor in any subfolder) that re-export components, hooks, types, or utilities.
- **Decentralized Route & Menu Registry**:
  - NEVER create centralized route/menu config files (`ROUTING_CONFIG`, `navigation.tsx`, `moduleRoutes.tsx`, `autoRegister.ts`) in `Core`.
  - Every module defines its own `AppRoute[]` in `resources/js/routes/route.tsx` (supporting sidebar `menu: { key, label, icon, order, parentPath }`, nested `subMenu: AppRoute[]`, and `guard: 'auth' | 'guest' | 'none'`).
  - Feature module root `resources/js/index.tsx` (or `index.ts`) is strictly a Webpack entry script that calls `registerRoutes(...)` — NEVER export/re-export routes, reducers, actions, thunks, components, or configs from `index.{ts,tsx}`.
- **Webpack 5 / Laravel Mix Invariants**:
  - NEVER use Vite-only runtime APIs (`import.meta.env`, `import.meta.glob`) in module code.
  - `ModuleRegistry::renderJs()` outputs `<script>` tags in strict order: `1. /modules/Core/vendor.js` → `2. /modules/<Module>/index.js` → `3. /modules/Core/index.js` (so `registerRoutes` executes before `Core` mounts `AppRouter`).
  - When introducing a new shared package or Ant Design component in a feature module, verify `cms/build/vendor-preload.js` includes it so single-module builds (`npm.cmd run mix:<module>`) keep `public/modules/Core/vendor.js` complete.
  - Always run `npm.cmd run check-types` and `npm.cmd run mix:<module>` (or `npm.cmd run mix`) after frontend changes.
