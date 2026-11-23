---
trigger: glob
description: React + TypeScript + Ant Design + Redux Toolkit rules for cms/modules/*/resources/js.
globs: cms/modules/**/resources/js/**
---

# Frontend Rules (React 19, TS, AntD, RTK)

Deep dive: `docs/frontend/architecture.md`. New entity flow: skill `rtk-feature-slice`.

## 1. Structure, SRP Decomposition & Core-First Reuse

- **Formatting (`Tab Size = 4`, `printWidth = 230`)**: MUST use **tab size 4** (`useTabs: true`, `singleQuote: true`, `semi: true`, `trailingComma: 'all'`, `printWidth: 230` per `cms/.prettierrc`). NEVER use 2-space indent, and NEVER wrap short imports, destructuring, `dispatch(...)` calls, or JSX props across multiple lines when they fit on 1 line.
- Per module: `Action/<entity>Api.ts` · `configs/<name>Columns.tsx` · `hooks/use<Name>.ts` · `components/<PascalCase>.tsx` · `pages/<Entity>ListPage.tsx` · `routes/route.tsx` · `store/<domain>Thunk.ts` & `<domain>Slice.ts` · `types/<entity>.ts` · `utils/<camelCase>.ts`.
- **SRP & Line Limits (Hard Limit: every `.tsx` ≤ 150 lines)**:
  - **Pages (`pages/*Page.tsx`, target ≤ 80 lines)**: Strictly orchestrate layout, Redux selectors/dispatches, and child components (no inline column arrays or complex forms).
  - **Components (`components/*.tsx`)**: Single-responsibility UI blocks/modals/tabs. Split distinct visual sections/tabs early; NEVER create pass-through wrappers.
  - **Hooks (`hooks/use*.ts`) & Configs (`configs/*.ts(x)`)**: Extract stateful lifecycles to hooks and table columns/filter schemas to configs.
- **Core-First Reuse & DRY (`Rule of 2`)** (`modules/Core/resources/js/`):
  - Reuse `@core` inventory first: `components/` (`ListLayout`, `Table`, `CustomModal`, `StatusTag`, `DynamicFilterBar`, `AuthGuard`, `GuestGuard`, `NotFoundPage`) · `hooks/` (`useAction`, `useFilter`, `usePagination`, `useAuthInit`) · `store/` (`metadataSlice`, `metadataThunk` `fetchMetadata`) · `utils/` & `configs/` (`formatters`, `error` `extractErrorMessage`, `tokenStorage`, `pagination`, `status`, `theme` `UREKA_COLORS`, `Action/api` `http`, `routes/registry`).
  - **Promote to `@core` (`≥ 2` modules)**: Place domain-agnostic formatters (`@core/utils/formatters.ts`), components, or hooks in `@core`.
  - **Within `1` Module (`≥ 2` places)**: Extract shared JSX blocks, modal workflows, or option configs into a shared sub-component, hook, or config file — NEVER copy-paste across tabs/modals/pages. Module A NEVER imports internals from Module B.

## 2. TypeScript & Comments

- NEVER `any` (use interfaces, generics, `unknown` + narrowing). Declare request/response types once (`types/` or `Action/`).
- **Comments (`//` Only)**: NEVER write `/** ... */` JSDoc blocks; use brief single-line `//` only when logic is non-obvious.

## 3. UI, Ant Design v5 & Ureka Media Brand Theme

- 100% English UI text. AntD v5 APIs only (`open` on `Modal`/`Drawer`, `items` on `Menu`/`Tabs`/`Dropdown`/`Breadcrumb`, `<Input.OTP />`; NEVER `visible`, `<Menu.Item>`, `<Tabs.TabPane>`).
- **Ureka Media Brand Theme (`@core/configs/theme.ts`)**:
  - Palette: Primary Magenta `#EA088B` (hover `#F238A3`, active `#C40674`) · Purple `#652E8D` · Info Cyan `#0999D6` · Success Green `#74BE44` · Warning Orange `#F79420` · Error Red `#ED3325` · Dark `#221F1F` · Sider `#1A161F`.
  - Font: `'Plus Jakarta Sans', 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
  - Always use `UREKA_COLORS` or `theme.useToken()`; NEVER hardcode default AntD blue (`#1677ff` / `#4096ff`).

## 4. State, HTTP & Scoped Metadata (Mandatory RTK Slice + Thunk)

- HTTP only via `http` from `@core/Action/api` with relative paths (`'/auth/login'`, `'/venue'`). NEVER prepend `/admin/api` or use raw `fetch()`.
- **All API Operations via RTK Thunk + Slice**:
  - Flow: `Action/<entity>Api.ts` → `store/<domain>Thunk.ts` (`createAsyncThunk` + `rejectWithValue`) → `store/<domain>Slice.ts` (`createSlice` + `extraReducers`), registered in `@core/store/store.ts`. Thunk & Slice MUST be separate files; slices NEVER re-export thunks.
  - **Dispatch with `try / catch` + `.unwrap()` ONLY**: Handle mutation dispatches via `try { await dispatch(thunk(...)).unwrap(); } catch (err: unknown) { message.error(extractErrorMessage(err, '...')); }`. NEVER use `if (thunk.fulfilled.match(action))`.
  - **Strict `useState` Minimization**: Keep `items`, `selectedItem`, `pagination`, `filters`, `modalOpen`, `loading`, `submitting`, `error` in the Redux slice, and form state in AntD `Form.useForm()`. Never use `useState` for API data/loading/errors; limit `useState` to ≤ 1–2 isolated ephemeral UI toggles.
- **Zero Hardcoded Options, Empty Fallbacks & Scoped Metadata**:
  - **Empty Array Fallback Only (`|| []` / `?? []`)**: When reading options/enums/statuses/lists from `metadata` or a slice (`metadata?.enums?.venue_types || []`), ALWAYS fall back to `[]` — NEVER provide a non-empty fallback array (`|| [{ value: '...' }]`).
  - **Zero Option Duplication Between Filter, Table & Modal**: Both `<entity>FilterConfigs.ts` and `<Entity>FormModal.tsx` MUST consume the same options from `state.metadata.data` (or a single shared config); table/modal statuses MUST reuse `<StatusTag status={...} />` (never local `statusColorMap`).
  - **Metadata Scope**: Shared (`≥ 2` modules) statuses/tags/enums/pagination live in `@core/store/metadataSlice` (`Core/configs/metadata.php`); single-module (`1` module) options stay in that module; DB entities (roles, permissions, venues) initialize as `[]` in the slice and fetch from the module API.

## 5. Imports, Routing & Build (Laravel Mix + Webpack 5)

- Explicit import paths (`@core/...`, `@modules/<Module>/...`, `./`, `../`; NEVER `../../` or barrel `index.ts` files).
- **Decentralized Routes**: Each module defines `AppRoute[]` in `resources/js/routes/route.tsx` and calls `registerRoutes(routes)` in `resources/js/index.tsx` (NEVER re-export from `index.tsx` or centralize routes in `Core`).
- **Webpack 5**: NEVER use `import.meta.*`. Update `cms/build/vendor-preload.js` when adding shared packages. Run `npm.cmd run check-types` and `npm.cmd run mix:<module>` (or `npm.cmd run mix`) after changes.
