---
trigger: always_on
description: Git branch, staging, commit approval gate, Conventional Commits, and safety invariants for the DOOH monorepo.
---

# Git Rules (DOOH Monorepo)

Procedure: skill `git-workflow`.

## 1. Mandatory Commit & Push Approval Gate (HARD RULE)

- **NEVER auto-commit or auto-push**: Completing implementation or passing tests does NOT grant permission to commit.
- After running quality gates, present the changed file list and proposed commit message (`type(scope): subject`), then **STOP and ask the user for approval to commit**.
- Only execute `git add` and `git commit` after the user explicitly approves (e.g., *"commit"*, *"tiến hành commit"*).
- Only execute `git push` when the user explicitly asks to push.

## 2. Branch Naming & Dirty Working Tree Gate

- **NEVER code or commit on `main`**.
- **Allowed branches (flat names only)**: `feature`, `fix`, `refactor`, `test`, `chore`, `hotfix`. NEVER create slash/sub-branches (`feature/<name>`, `fix/<name>`).
- **Dirty Tree Check**: Before starting a new task or switching branches (`git checkout <branch>`), run `git status --short`. If uncommitted changes from a prior task exist → **STOP and ask the user** whether to commit them first or keep them separate. NEVER mix unrelated dirty files into a new task's commit.

## 3. Explicit Staging & Atomic Scope (`NEVER git add .`)

- **Always stage explicit file paths**: `git add <path1> <path2>`.
- **NEVER** use `git add .`, `git add -A`, `git add -u`, or `git commit -a`.
- **Atomic Commits**: Stage only files belonging to the approved task/scope (`Files:` allowlist in the approved Plan). If multiple independent changes exist in the working tree, split them into separate logical commits upon user approval.
- **Forbidden from Staging**: `.env*` (except `.env.example`), `.phpunit.result.cache`, `cms/storage/logs/*`, `node_modules/`, `vendor/`, temporary debug files, and compiled bundles (`cms/public/modules/*`, `cms/mix-manifest.json`) unless the user explicitly asks to commit build artifacts.

## 4. Conventional Commits Format

- Format: `<type>(<scope>): <imperative english subject>` (all lowercase header, no trailing period, ≤ 72 chars).
- `type`: `feat | fix | refactor | test | chore | docs | perf | ci`.
- `scope`: `core | auth | user | venue | creative | delivery | report | log | simulator | api | build | agents`.

## 5. Destructive Command Ban

- **NEVER** run `git reset --hard`, `git clean -fd`, `git checkout -B`, `git checkout -- .`, `git restore .`, `git push --force`, `git stash drop`, or push directly to `main`.
