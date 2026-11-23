# Git Rules (DOOH Monorepo)

Procedure: skill `git-workflow`.

1. **Mandatory Commit & Push Approval Gate (HARD RULE)**:
   - **NEVER auto-commit or auto-push**: Passing tests does NOT grant permission to commit.
   - Present changed files + proposed commit message (`type(scope): subject`), then **STOP and ask for approval**.
   - Run `git add`/`git commit` only after explicit approval; run `git push` only when explicitly asked.
2. **Branches & Dirty Tree Gate**:
   - **NEVER code or commit on `main`**.
   - Allowed flat branches only: `feature | fix | refactor | test | chore | hotfix` (NEVER `feature/<name>`).
   - Run `git status --short` before starting or switching branches; if prior uncommitted changes exist → **STOP and ask** (never mix unrelated dirty files).
3. **Explicit Staging (`NEVER git add .`)**:
   - Stage explicit paths only: `git add <path1> <path2>`. NEVER `git add .`, `-A`, `-u`, or `git commit -a`.
   - Stage only files in the approved Plan `Files:` allowlist.
   - NEVER stage `.env*` (except `.env.example`), `.phpunit.result.cache`, `cms/storage/logs/*`, `node_modules/`, `vendor/`, or compiled bundles (`cms/public/modules/*`, `cms/mix-manifest.json`) unless requested.
4. **Conventional Commits**: `<type>(<scope>): <imperative english subject>` (lowercase, no period, ≤ 72 chars).
   - `type`: `feat | fix | refactor | test | chore | docs | perf | ci`.
   - `scope`: `core | auth | user | venue | creative | delivery | report | log | simulator | api | build | agents`.
5. **Destructive Ban**: NEVER `git reset --hard`, `git clean -fd`, `git checkout -B`, `git checkout -- .`, `git restore .`, `git push --force`, `git stash drop`, or push to `main`.
