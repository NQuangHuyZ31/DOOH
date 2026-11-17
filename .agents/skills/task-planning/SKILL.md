---
name: task-planning
description: Use at the PLAN step before any implementation, to write the compact approval plan (objective, branch, files, risks, tests) and wait for user approval.
---

# Task Planning (Approval Gate)

1. Read-only first: `git status --short`, `git branch --show-current`, inspect only files needed (prefer `git grep -n` over reading whole folders; `rg` is not installed).
2. Write the plan with the template below — short bullets, no prose. Plans > ~40 lines → put in an artifact.
3. Stop and wait for explicit approval. Do not edit files before it.

## Template

```markdown
**Objective:** <one sentence, user-visible outcome>
**Branch:** `feature|fix|refactor|test|chore|hotfix`
**Approach:** <2–5 bullets; mention REUSE/EXTEND/CREATE of existing pieces>
**Files:**
- MODIFY `path` — what
- NEW `path` — why reuse wasn't possible
**Complexity:** <why no simpler option; new abstractions justified or "none">
**Risks:** <breaking contracts, migrations, perf, security — or "low">
**Tests:** <test files/cases to add + gates to run>
**Open questions:** <only if blocking>
```

## Tips
- One plan per task; list exact paths, not globs.
- Omit sections that are truly N/A instead of filling them with filler.
