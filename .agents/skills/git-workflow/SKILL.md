---
name: git-workflow
description: Use when switching branches, staging, committing, or pushing in the DOOH repo. Branch selection, safe staging, Conventional Commits, pre-commit checks.
---

# Git Workflow (DOOH)

Invariants live in `AGENTS.md` §2–3 and `.agents/rules/git.md`. This is the step-by-step procedure.

## 1. Pick Branch (Flat Names Only — NEVER `feature/<name>`)

| Intent | Branch | Commit type |
|---|---|---|
| New feature / module / UI / API | `feature` | `feat` |
| Bug fix | `fix` | `fix` |
| Urgent production fix | `hotfix` | `fix` |
| Restructure, no behavior change | `refactor` | `refactor` |
| Tests only | `test` | `test` |
| Config, deps, docs, CI, agent rules | `chore` | `chore` / `docs` / `ci` |

## 2. Steps (With Mandatory User Approval Gate)

```powershell
git status --short; git branch --show-current   # unrelated changes → STOP and ask user first
git checkout <branch>                            # or: git checkout -b <branch>
git branch --show-current                        # verify before editing any file
# ... implement approved Files: allowlist + run quality gates (AGENTS.md §5) ...
git status --short                               # verify only approved files were touched
git diff --stat                                  # review changes
# STOP HERE: Present report + proposed commit message and ASK USER FOR COMMIT APPROVAL.
# Only after explicit user confirmation:
git add <explicit file paths>                    # NEVER `git add .`, `git add -A`, or `git commit -a`
git commit -m "type(scope): imperative english subject"
git push -u origin <branch>                      # ONLY when user explicitly asks to push
```

Allowed `scope`: `core`, `auth`, `user`, `venue`, `creative`, `delivery`, `report`, `log`, `simulator`, `api`, `build`, `agents`.

## 3. Pre-Commit Check

- Explicit user approval to commit has been received in chat.
- Staged list matches the task scope and contains no `.env*`, secrets, `.phpunit.result.cache`, `cms/public/modules/*` (unless requested), `node_modules/`, `vendor/`, or logs.
- Quality gates passed for every touched area.
- Never: `reset --hard`, `clean -fd`, `checkout -B`, `restore .`, force-push, `stash drop`, push to `main`, publish releases.
