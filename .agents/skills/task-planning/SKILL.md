---
name: task-planning
description: Use at the PLAN step before any implementation, to write the compact approval plan (objective, branch, files, risks, tests) and wait for user approval.
---

# Task Planning (Approval Gate & File Scope Lock)

1. Read-only first: `git status --short`, `git branch --show-current`, inspect only files needed (prefer `git grep -n` over reading whole folders; `rg` is not installed).
2. Run skill `core-reusability-promoter` mentally: check what in `cms/modules/Core/` can be **REUSED** or **EXTENDED**, and whether any new generic helper/component should be placed in `Core`.
3. Write the plan with the template below — short bullets, no prose. Plans > ~40 lines → put in an artifact.
4. **Stop and wait for explicit approval.** Do not edit files before it.
5. **Strict File Allowlist**: Once approved, ONLY the exact paths listed under `Files:` may be created, modified, or deleted. Never touch any file outside that list without asking the user first.

## Template

```markdown
**Objective:** <one sentence, user-visible outcome>
**Branch:** `feature|fix|refactor|test|chore|hotfix`
**Approach & Reuse:** <2–5 bullets; explicitly state REUSE / EXTEND / PROMOTE TO CORE / CREATE LOCAL decisions and component/service SRP splits>
**Files (Strict Allowlist):**
- MODIFY `path` — what & why
- NEW `path` — single responsibility & why reuse wasn't possible
- DELETE `path` — obsolete file cleanup (if any)
**Complexity:** <why no simpler option; confirm zero redundant wrappers/DTOs/interfaces>
**Risks:** <breaking contracts, migrations, perf, security — or "low">
**Tests:** <test files/cases to add + gates to run>
**Open questions:** <only if blocking>
```

## Tips
- One plan per task; list exact paths, not globs.
- Omit sections that are truly N/A instead of filling them with filler.
