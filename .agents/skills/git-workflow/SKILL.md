---
name: git-workflow
description: Use when switching branches, staging, committing, or pushing in the DOOH repo. Branch selection, safe staging, Conventional Commits, pre-commit checks.
---

# Git Workflow (DOOH)

Invariants live in `AGENTS.md` §2–3. This is the procedure.

## 1. Pick Branch

| Intent | Branch | Commit type |
|---|---|---|
| New feature / module / UI / API | `feature` | `feat` |
| Bug fix | `fix` | `fix` |
| Urgent production fix | `hotfix` | `fix` |
| Restructure, no behavior change | `refactor` | `refactor` |
| Tests only | `test` | `test` |
| Config, deps, docs, CI, agent rules | `chore` | `chore` / `docs` / `ci` |

## 2. Steps

```powershell
git status --short; git branch --show-current   # unrelated changes → STOP and ask
git checkout <branch>                            # or: git checkout -b <branch>
git branch --show-current                        # verify before editing any file
# ... implement + quality gates (AGENTS.md §5) ...
git diff --stat                                  # review
# WAIT for user approval to commit
git add <explicit paths>                         # never `git add .`
git commit -m "type(scope): english subject"
git push -u origin <branch>                      # only when user asks; PR → main
```

Scope = module or area: `venue`, `core`, `auth`, `delivery`, `api`, `agents`…

## 3. Pre-Commit Check

- Staged list contains no `.env*`, secrets, `cms/public/build/`, `node_modules/`, `vendor/`, logs.
- Quality gates passed for every touched area.
- Never: `reset --hard`, `clean -fd`, `checkout -B`, force-push, `stash drop`, push to `main`, publish releases.
