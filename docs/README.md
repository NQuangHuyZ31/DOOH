# DOOH Platform Documentation Index

Welcome to the **DOOH (Digital Out-Of-Home)** platform engineering documentation.

---

## 1. Quick Navigation

| Topic | Document | Scope & Key Contents |
|---|---|---|
| **System Overview** | [`overview.md`](file:///E:/Urekamedia/DOOH/docs/architecture/overview.md) | High-level topology, Monorepo layout (`cms/`, `api/`), Dual-DB strategy. |
| **System & Data Flow** | [`system-flow.md`](file:///E:/Urekamedia/DOOH/docs/architecture/system-flow.md) | End-to-end activity diagrams, Playlist loop, Tracking beacon, Offline flow. |
| **Business Specs** | [`business-requirements.md`](file:///E:/Urekamedia/DOOH/docs/architecture/business-requirements.md) | Venue, Delivery, Creative formats (VAST/MP4), Pacing & Proof of Play. |
| **API & Tracking** | [`routing-and-contracts.md`](file:///E:/Urekamedia/DOOH/docs/api/routing-and-contracts.md) | Pure Node.js API, Playlist generation, Opaque token tracking (`:hash`). |
| **CMS Backend** | [`architecture.md`](file:///E:/Urekamedia/DOOH/docs/backend/architecture.md) | Laravel 11/12, Strict 3-Layer (`Controller → Service → Repository`), Modules. |
| **CMS Frontend** | [`architecture.md`](file:///E:/Urekamedia/DOOH/docs/frontend/architecture.md) | React 19/18 + TS + Ant Design 5/6, 150-line TSX hard limit, English UI. |
| **Database & Cache** | [`schema-and-migrations.md`](file:///E:/Urekamedia/DOOH/docs/database/schema-and-migrations.md) | MySQL relational entities, MongoDB tracking/reporting, Redis caching. |

---

## 2. Progressive Navigation For Agents

When executing tasks, reference scoped rules first, then deep architecture docs:
- **Backend / Laravel**: `.agents/rules/backend.md` $\rightarrow$ `docs/backend/architecture.md`.
- **Frontend / React**: `.agents/rules/frontend.md` $\rightarrow$ `docs/frontend/architecture.md`.
- **Node.js Tracking**: `.agents/rules/node-tracking-api.md` $\rightarrow$ `docs/api/routing-and-contracts.md`.
- **Database / Mongo**: `.agents/rules/database.md` $\rightarrow$ `docs/database/schema-and-migrations.md`.
- **Git / Workflow**: `.agents/rules/git-workflow.md` $\rightarrow$ `AGENTS.md`.
