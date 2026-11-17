---
trigger: glob
description: React + TypeScript + Ant Design + Redux Toolkit rules for cms/modules/*/resources/js.
globs: cms/modules/**/resources/js/**
---

# Frontend Rules (React 19, TS, AntD, RTK)

Deep dive: `docs/frontend/architecture.md`. New entity flow: skill `rtk-feature-slice`.

## 1. Structure & Size

- Per module: `Action/` (API clients) · `configs/` (columns, options) · `hooks/` · `components/` · `pages/` · `routes/route.tsx` · `store/` · `types/` · `utils/`.
- Pages orchestrate; components render; generic UI lives in `@core` (never imports feature modules, no domain logic).
- **TSX ≤ 150 lines (hard)**. At ~120 lines extract: columns/options → `configs/`, state/handlers → `hooks/use*.ts`, sections → `components/`, mapping → `utils/`.

**Reuse Core first** (`modules/Core/resources/js/`):
- components: `ListLayout`, `Table`, `CustomModal`, `StatusTag`, `AuthGuard`, `GuestGuard`
- hooks: `useAction`, `useFilter`, `usePagination`
- other: `utils/formatters`, `configs/pagination|routing|theme`, `layouts/MainLayout`

## 2. TypeScript

- NEVER `any` (use interfaces, generics, `unknown` + narrowing). Typed props interface for every component.
- Request/response types declared once (`Action/` or `types/`); ISP: pass only the fields a component needs.

## 3. UI

- 100% English user-facing text. AntD components/tokens; charts via `@ant-design/plots`.

## 4. State & HTTP

- HTTP only via `http` from `@core/Action/api` (bearer token + 401 redirect). NEVER raw `fetch()` / new axios instances.
- Shared/server-paginated/cross-page data → RTK. Single mutations & transient UI → `useAction` + local state. NEVER hold the same dataset in both.
- **Thunk & Slice in separate files (hard)**: `store/<domain>Thunk.ts` (`createAsyncThunk` + `rejectWithValue`) and `store/<domain>Slice.ts` (state, reducers, `extraReducers`). Slices NEVER re-export thunks. Reducers registered in `@core/store/store.ts`.
- `useSearchParams` only for shareable filter/pagination state.

## 5. Imports & Entry Points

- Always import via explicit paths (`@core/Action/api`, `@core/components/ListLayout`, `@core/routes/registry`, `@modules/<Module>/...`); `./` and `../` OK; NEVER `../../` or deeper.
- **NEVER create barrel `index.ts` files** (neither in `@core` root nor in any subfolder) that re-export components, hooks, types, or utilities.
- Feature module root `resources/js/index.ts` is strictly a Webpack entry script that calls `registerRoutes(...)` — NEVER export/re-export routes, reducers, actions, thunks, components, or configs from `index.ts`.
- `Core` NEVER defines placeholder routes (`moduleRoutes`) for other modules; each module registers its own routes via its own `resources/js/index.ts`.
