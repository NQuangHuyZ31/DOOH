# Git Workflow & Release Safety Rules

Scope: All branches, commits, PRs, worktrees, and releases.
Detailed Workflow: [`docs/development/git-workflow.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/development/git-workflow.md) | Verification Suite: `scripts/verify-workflow.ps1`

## 1. Supported Git Workflows
- **Workflow A: Single-Workspace Base Branch (Default)**: Use base category branches directly (`fix`, `feature`, `refactor`, `hotfix`, `test`, `chore`). No descriptive sub-branch suffixes. If current branch contains unrelated active work: **STOP and ask a human**.
- **Workflow B: Parallel Worktree Slots (Multi-Agent)**: When concurrent tasks run, allocate slots via `scripts/agent-worktree.ps1`:
  - Slot 1 (FEATURE): `feature/*` | Slot 2 (FIX): `fix/*` | Slot 3 (HOTFIX): `hotfix/*`
  - Slot 4 (REFACTOR): `refactor/*`, `test/*` | Slot 5 (RELEASE): `release/*`, `chore/*`, `docs/*`, `ci/*`

## 2. Invariants & Prohibitions
- **NO Direct Push to Main**: Always push to category branch (`git push -u origin <branch>`) and open PR targeting `main`.
- **NO Destructive Git**: NEVER run `git reset --hard`, `git checkout -B` over active branches, `git clean -fd`, force-push, or `git stash drop`.
- **Selective Staging**: Stage explicit file paths (`git add <file>...`). NEVER blind `git add .`.
- **No Build Manifests**: NEVER commit `cms-tiktok-crawler/public/entrypoints.json`, `mix-manifest.json`, or `build/`.

## 3. Conventional Commits (Strict English)
- Format: `type(scope): subject` (`feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `ci`).
- Language: 100% English.

## 4. Human Deploy Gate
- Merging to `main` ONLY creates a **Draft Release** (`auto-draft-release.yml`, `draft: true`).
- Production deploy to Render (`deploy.yml`) triggers ONLY when a human reviews and clicks **"Publish release"** on GitHub.
- Agents MUST NEVER publish releases or trigger production deployments.


## 5. Auto-Evaluate, Branch Switch & Commit Protocol (MANDATORY INVARIANT)

**NEVER WRITE CODE DIRECTLY ON `main`.**

| Task Intent | Target Branch Convention | Commit Prefix |
|---|---|---|
| New feature / module / API / UI | `feature` or `feature/<name>` | `feat(scope): ...` |
| Bug / build / Docker / UI / API fix | `fix` or `fix/<name>` | `fix(scope): ...` |
| Urgent production fix | `hotfix` or `hotfix/<name>` | `fix(scope): ...` |
| Code restructure (no behavior change) | `refactor` or `refactor/<name>` | `refactor(scope): ...` |
| Tests only | `test` or `test/<name>` | `test(scope): ...` |
| Config / deps / docs / CI / tooling | `chore` or `chore/<name>` | `chore\|docs\|ci(scope): ...` |

1. **Inspect & Guard**: Run `git status --short` and `git branch --show-current`. If unrelated uncommitted changes exist, **STOP and ask**.
2. **Declare in Plan**: State the exact target branch in the Plan before asking for approval.
3. **MANDATORY SWITCH BEFORE TOUCHING CODE**:
   - Immediately after approval, before creating/modifying ANY file, switch to the task branch:
     `git checkout -b <branch>` or `git checkout <branch>`.
   - Verify `git branch --show-current` matches target branch.
4. **Code & Verify**: Implement approved scope only; run applicable quality gates (`npm run check-types`, `php artisan test`, etc.).
5. **Stage & Commit**: Stage explicit files only (no `git add .`, no `.env` or credential files), commit in English with Conventional Commits, and push to the task branch (`git push -u origin <branch>`). NEVER push to `main`.
