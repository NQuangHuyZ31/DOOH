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
    - `store/` & `Action/`: `store/metadataSlice`, `store/metadataThunk` (`fetchMetadata`), `Action/metadataApi`, `types/metadata`
    - `utils/` & `configs/`: `utils/formatters`, `utils/error`, `utils/tokenStorage`, `configs/pagination`, `configs/status`, `configs/theme`, `layouts/MainLayout`, `routes/registry`
  - **Evaluate for `@core` promotion**: If a new component, hook, or helper function is domain-agnostic (e.g., date/currency formatter, error extractor, generic modal/filter control, status badge), place it in `@core` (or extend an existing `@core` file via optional props) instead of writing a module-local copy.
  - Feature Module A NEVER imports internal components/hooks/slices from Feature Module B.

## 2. TypeScript

- NEVER `any` (use interfaces, generics, `unknown` + narrowing). Typed props interface for every component.
- Request/response types declared once (`Action/` or `types/`); ISP: pass only the fields a component needs.
- **Minimal Single-Line Comments (`//` Only — No JSDoc Blocks)**: NEVER write `/** ... */` JSDoc blocks. Use concise single-line `//` comments ONLY when explaining non-obvious logic.

## 3. UI, Ant Design v5 & Ureka Media Brand Theme

- 100% English user-facing text. AntD v5 components/tokens; charts via `@ant-design/plots`.
- **Ureka Media Brand Palette & Typography (`@core/configs/theme.ts`)**:
  - **Primary Brand Color**: `#EA088B` (Magenta — hover `#F238A3`, active `#C40674`).
  - **Brand Accent Palette**: Purple `#652E8D` · Info Cyan `#0999D6` · Success Green `#74BE44` · Warning Orange `#F79420` · Error Red `#ED3325` · Dark Charcoal `#221F1F` · Sidebar Dark `#1A161F`.
  - **Font Family**: `'Plus Jakarta Sans', 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` (loaded in `modules/Core/resources/views/app.blade.php` and configured in `doohTheme`).
  - **No Hardcoded Default AntD Blue (`#1677ff`)**: Always use `UREKA_COLORS` from `@core/configs/theme` or AntD `theme.useToken()`. NEVER hardcode `#1677ff` or `#4096ff`.
- **AntD v5 APIs only**: MUST use `open` on `Modal`/`Drawer`, `items` array prop on `Menu`/`Tabs`/`Dropdown`/`Breadcrumb`, and `<Input.OTP />` for OTP inputs. NEVER use deprecated v4 APIs (`visible`, `<Menu.Item>`, `<Tabs.TabPane>`).

## 4. State & HTTP (Mandatory RTK Slice + Thunk)

- HTTP only via `http` from `@core/Action/api` (bearer token + 401 redirect) using relative resource paths (`'/auth/login'`, `'/venue'`). NEVER prepend `/admin/api` manually, and NEVER use raw `fetch()` or new axios instances.
- **All API Operations via RTK Thunk + Slice (Hard Rule)**:
  - Every API workflow (fetch list, detail, create, update, delete, status toggle) MUST flow through `Action/<entity>Api.ts` → `store/<domain>Thunk.ts` (`createAsyncThunk` + `rejectWithValue`) → `store/<domain>Slice.ts` (`createSlice` with `extraReducers`).
  - **Thunk & Slice in separate files (hard)**: `store/<domain>Thunk.ts` and `store/<domain>Slice.ts` MUST be separate files. Slices NEVER re-export thunks. Register reducers in `@core/store/store.ts`.
  - **Dispatch Handling (`try / catch` + `.unwrap()` ONLY)**: When handling thunk results in components, pages, or hooks (e.g., showing toast notifications or refreshing after create/update/delete), MUST use `try { await dispatch(someThunk(...)).unwrap(); ... } catch (err: unknown) { message.error(extractErrorMessage(err, '...')); }`. NEVER use `if (someThunk.fulfilled.match(action))` or inspect `action.meta.requestStatus`.
  - Store all server data and async lifecycles (`items`, `selectedItem`, `pagination`, `loading`, `submitting`, `error`) inside the Redux slice — NEVER call API clients directly inside components/pages/hooks with local `useState` pairs (`const [data, setData]`, `const [loading, setLoading]`, `const [submitting, setSubmitting]`, `const [error, setError]`).
- **Zero Hardcoded Backend/Database Reference Data & Scoped Metadata Rule (Hard Rule)**:
  - **Empty Array Fallback Only (`|| []` / `?? []` — NEVER Non-Empty Default Arrays)**: Whenever reading options, enums, statuses, or entity collections from `metadata` or a Redux slice (e.g., `metadata?.enums?.venue_types`, `metadata?.statuses?.venue`, `state.roles`), if the data is missing or not yet loaded, the default fallback MUST strictly be an empty array (`|| []` or `?? []`). NEVER write a non-empty fallback array such as `metadata?.enums?.venue_types || [{ value: 'shopping_mall', label: 'Shopping Mall' }]`.
  - **Shared Metadata (`≥ 2` Modules / Global) → `@core` Metadata (`state.metadata.data` / `fetchMetadata`)**: Shared statuses (`statuses.common`, global status `tags`), pagination presets (`pagination.default_per_page`, `per_page_options`), and cross-module enums used by `≥ 2` modules MUST be read from `@core/store/metadataSlice` (`fetchMetadata` in `@core/store/metadataThunk`, backed by `cms/modules/Core/configs/metadata.php`). If a new cross-module/shared status or enum is needed, add it to `cms/modules/Core/configs/metadata.php` and `@core/types/metadata.ts`.
  - **Single-Module Only (`1` Module) → Keep in Module**: NEVER bloat `Core` metadata with enums, options, or configs used exclusively by a single feature module (e.g., `User`-only `permission_types` or module-internal constants). Keep single-module configs inside that module (`cms/modules/<Module>/configs/<module>.php` exposed via the module's own API/slice, or `modules/<Module>/resources/js/configs/*.ts` for purely static UI options).
  - **Database Reference Entities**: NEVER hardcode arrays or fallback select options in components, configs, or slice `initialState` (e.g., `DEFAULT_PERMISSION_OPTIONS`, `INITIAL_ROLES`, venues, categories) when that data exists in the database or backend API — always initialize slice state as `[]` and fetch via `Action/<entity>Api.ts` → `store/<domain>Thunk.ts` → `store/<domain>Slice.ts`.
- **Strict `useState` Minimization**:
  - NEVER spawn multiple `useState` hooks for API responses, loading flags, pagination, or form fields.
  - Form state MUST use Ant Design `Form.useForm()`.
  - Shareable filter/pagination query params use `useSearchParams` / `@core/hooks/useFilter` or Redux slice state.
  - `useState` is restricted strictly to minimal, isolated ephemeral UI toggles (e.g., a single modal open state when not driven by slice `selectedItem`) and MUST NOT exceed 1–2 hooks per component/hook.

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
