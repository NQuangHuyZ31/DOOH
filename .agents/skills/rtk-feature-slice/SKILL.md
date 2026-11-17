---
name: rtk-feature-slice
description: Use when building a frontend CRUD/list feature for an entity in cms/modules/*/resources/js — API client, RTK thunk + slice, configs, page, routes, within the 150-line TSX limit.
---

# Frontend Entity Feature (RTK)

Rules: `.agents/rules/frontend.md`, `api-contract.md`. References: `modules/Auth/resources/js/store/` (thunk/slice), `modules/Venue/resources/js/` (list page).

## Steps

1. **Types** `types/<entity>.ts`: entity + request payloads + response envelope (`status`, `message`, `data`, `pagination`).
2. **API client** `Action/<entity>Api.ts`: functions using `http` from `@core/Action/api`; no state.
3. **Decide state**: shared/server-paginated/cross-page → RTK (steps 4–5); otherwise `useAction` + local state (skip to 6).
4. **Thunk** `store/<domain>Thunk.ts`: `createAsyncThunk('<domain>/<op>', …)` calling the API client; errors via `rejectWithValue(message)`.
5. **Slice** `store/<domain>Slice.ts`: state interface, `initialState`, sync reducers, `extraReducers` for pending/fulfilled/rejected; `export default <domain>Slice.reducer`. No thunk re-exports. Register reducer in `modules/Core/resources/js/store/store.ts`.
6. **Configs** `configs/<entity>Columns.tsx` / options: columns, filters, select options.
7. **Hooks** `hooks/use<Entity>List.ts` (optional): dispatch/select, filters (`useFilter`), pagination (`usePagination`).
8. **UI**: `pages/<Entity>ListPage.tsx` orchestrates; `components/<Entity>Table.tsx`, `<Entity>FormModal.tsx` (reuse `ListLayout`, `Table`, `CustomModal`, `StatusTag`). Each TSX ≤ 150 lines; English text only.
9. **Routes** `routes/route.tsx` (`AppRoute[]`); module root `index.ts`: strictly call `registerRoutes(...)` using `@core/routes/registry` (NEVER re-export routes, reducers, or components; NEVER create barrel `index.ts` files).
10. **Verify**: `npm.cmd run check-types` (from `cms/`); check line counts:
    `Get-ChildItem cms/modules/<M>/resources/js -Recurse -Filter *.tsx | % { "{0} {1}" -f (Get-Content $_).Count, $_.Name }`
