---
name: rtk-feature-slice
description: Use when building a frontend CRUD/list feature for an entity in cms/modules/*/resources/js — API client, RTK thunk + slice, configs, page, routes, within the 150-line TSX limit.
---

# Frontend Entity Feature (RTK)

Rules: `.agents/rules/frontend.md`, `api-contract.md`. References: `modules/Auth/resources/js/store/` (thunk/slice), `modules/Venue/resources/js/` (list page).

## Steps

1. **Types** `types/<entity>.ts`: entity + request payloads + response envelope (`status`, `message`, `data`, `pagination`).
2. **API client** `Action/<entity>Api.ts`: stateless functions using `http` from `@core/Action/api`; NEVER call these directly from components with `useState`.
3. **Thunk** `store/<domain>Thunk.ts`: `createAsyncThunk('<domain>/<op>', …)` for all API operations (list, create, update, delete, status changes) calling the API client; errors via `rejectWithValue(message)`.
4. **Slice** `store/<domain>Slice.ts`: state interface (`items`, `pagination`, `loading`, `submitting`, `error`), `initialState` (always initialize server/reference lists as `[]`, NEVER hardcoded fallback arrays), sync reducers, `extraReducers` for pending/fulfilled/rejected; `export default <domain>Slice.reducer`. No thunk re-exports. Register reducer in `modules/Core/resources/js/store/store.ts`.
5. **Configs & Metadata** `configs/<entity>Columns.tsx`: table columns and filter schemas.
   - **Metadata-First**: Always consume statuses (`statuses.<domain>`, `statuses.tags`), enums (`enums.<name>`), and pagination presets from `@core/store/metadataSlice` (`fetchMetadata` in `@core/store/metadataThunk`). NEVER create local status/enum option arrays in a module — if a status or enum is missing from `metadata`, add it to `cms/modules/Core/configs/metadata.php` and `@core/types/metadata.ts`.
   - **Database Reference Lists**: Fetch dynamic DB entities (roles, permissions, venues, categories) via module API + Thunk + Slice.
6. **Hooks** `hooks/use<Entity>List.ts` (optional): `useAppDispatch` / `useAppSelector` orchestration, filters (`useFilter`), pagination (`usePagination`). Avoid redundant `useState` hooks — read `items`, `loading`, `submitting`, `pagination`, and `error` directly from the Redux slice, use AntD `Form.useForm()` for forms, and handle mutation dispatches via `try { await dispatch(thunk(...)).unwrap(); } catch (err: unknown) { message.error(extractErrorMessage(err, '...')); }` (NEVER `if (thunk.fulfilled.match(action))`).
7. **UI**: `pages/<Entity>ListPage.tsx` orchestrates; `components/<Entity>Table.tsx`, `<Entity>FormModal.tsx` (reuse `ListLayout`, `Table`, `CustomModal`, `StatusTag`). Each TSX ≤ 150 lines; English text only.
8. **Routes & Sidebar Menu** `routes/route.tsx` (`AppRoute[]`):
   - Declare `path`, `guard: 'auth'`, and `menu: { key, label, icon, order }` (use `subMenu: AppRoute[]` or child `menu.parentPath` for submenu items).
   - Module root `resources/js/index.tsx`: strictly call `registerRoutes(routes)` using `@core/routes/registry` (NEVER re-export routes, reducers, or components; NEVER create barrel `index.ts` files; NEVER add routes to `Core`).
9. **Verify** (from `cms/`):
   - `npm.cmd run check-types`
   - `npm.cmd run mix:<module>` (or `npm.cmd run mix`)
   - Check line counts (must be ≤ 150 lines per `.tsx`):
     `Get-ChildItem cms/modules/<M>/resources/js -Recurse -Filter *.tsx | % { "{0} {1}" -f (Get-Content $_).Count, $_.Name }`
