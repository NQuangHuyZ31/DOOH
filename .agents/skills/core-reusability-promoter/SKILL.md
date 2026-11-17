---
name: core-reusability-promoter
description: Use before creating any new component, hook, service, repository, or endpoint. Search-first REUSE / EXTEND / CREATE decision and promotion to Core.
---

# Reusability (REUSE → EXTEND → CREATE)

## 1. Search First

```powershell
git grep -n "<keyword>" -- cms/modules
```
Check in order: `modules/Core/resources/js/{components,hooks,utils,configs}`, `modules/Core/src/{Repositories,Support,Http}`, sibling modules with similar features.

## 2. Decide

| Strategy | When | Obligation |
|---|---|---|
| REUSE | existing piece fits as-is | — |
| EXTEND | fits with an optional prop/param | keep backward compatible; check every consumer (`git grep` usages) |
| CREATE | genuinely new need | state in plan why reuse/extend failed |

Promote to Core only when generic AND used by ≥ 2 modules. Core code: props-configurable, typed, zero domain logic, no feature-module imports.

## 3. Simplicity Check (before finishing)

- Can any new file/class/abstraction be removed or merged?
- Any duplicated logic, redundant condition, conversion, or fallback?
- Does every change serve the approved scope?

## 4. Report Lines (append to final report)

`Reused:` paths · `Extended:` paths + consumers verified · `Created:` paths + reason.
