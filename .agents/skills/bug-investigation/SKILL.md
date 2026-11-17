---
name: bug-investigation
description: Use when fixing a bug, failing test, error log, or unexpected behavior in CMS or tracking API. Reproduce, isolate root cause, minimal fix with regression test.
---

# Bug Investigation

Branch `fix` (or `hotfix` if urgent production). Plan approval still required before the fix.

## 1. Reproduce
- Capture exact symptom: error message, stack trace, endpoint + payload, page + steps, expected vs actual.
- Reproduce with the smallest path: failing PHPUnit test, `php artisan tinker`, or a single request.

## 2. Gather Evidence (targeted, don't read whole files)
| Source | How |
|---|---|
| Laravel log | `Get-Content cms/storage/logs/laravel.log -Tail 80` |
| Failing test | `php artisan test --filter <Name>` |
| Frontend types | `npm.cmd run check-types` |
| Code path | `git grep -n "<symbol>" -- cms/modules` → follow Controller → Service → Repository |
| Recent changes | `git log --oneline -10 -- <path>`, `git diff main -- <path>` |

## 3. Isolate
- Form 1–3 hypotheses; verify each with evidence, not guesses.
- Identify the layer that is wrong (validation, service logic, query, contract, UI state).

## 4. Fix
1. Write a regression test that fails.
2. Apply the minimal fix at the root cause (no unrelated cleanup).
3. Test passes + related suite passes.

## 5. Report
`Symptom` · `Root cause` (file:line) · `Fix` · `Regression test` · `Gates` · `Risk of side effects`.
