# Setup Project Config

Validates and auto-fixes all project configuration — Playwright, TypeScript, ESLint, `.gitignore`, and GitHub Actions CI/CD setup (workflows, Allure reporting, Slack notifications).

## Usage

```
/setup-config
```

No arguments needed. Runs against the current working directory.

---

## What it does

Reads `.claude/skills/review-config/SKILL.md` and executes all 13 checks:

| # | Check | File | Severity |
|---|-------|------|----------|
| 1 | Allure reporter (string-tuple form) | `playwright.config.ts` | Critical |
| 2 | CI safety flags + WORKERS env var | `playwright.config.ts` | Critical |
| 3 | Failure capture (trace/screenshot/video) | `playwright.config.ts` | Warning |
| 4 | Timeouts (action/navigation) | `playwright.config.ts` | Warning |
| 5 | baseURL via env var | `playwright.config.ts` | Warning |
| 6 | Strict mode | `tsconfig.json` | Critical |
| 7 | no-explicit-any as error | `eslint.config.mjs` | Warning |
| 8 | allure-results in .gitignore | `.gitignore` | Critical |
| 9 | Manual workflow (e2e-tests.yml) | `.github/workflows/` | Critical |
| 10 | Scheduled regression workflow | `.github/workflows/` | Critical |
| 11 | publish-allure custom action | `.github/actions/` | Critical |
| 12 | slack-notification custom action | `.github/actions/` | Critical |
| 13 | JSON reporter for Slack | `playwright.config.ts` | Critical |

Critical issues are **auto-fixed**. Warnings are reported but not blocking.

---

## Execution

```
Read(.claude/skills/review-config/SKILL.md)
Run all 13 checks against the current project
Auto-fix any gaps using templates from .claude/skills/review-config/templates/
Run npx tsc --noEmit to verify no TypeScript errors
Print results table and verdict
```

---

## Outcomes

| Verdict | Meaning |
|---------|---------|
| `SKIPPED` | Everything already configured — nothing to do |
| `APPROVED_WITH_FIXES` | Gaps found and fixed — review the changes |
| `REJECTED` | A critical issue could not be auto-fixed — manual intervention required |

---

## After running

If fixes were applied:
1. Review the changed files
2. Run `npx tsc --noEmit` to confirm no TypeScript errors
3. Commit the changes
4. Activate GitHub Pages in **Settings → Pages → branch: `gh-pages`** (if not already done)
5. Add `SLACK_WEBHOOK_URL` secret in **Settings → Secrets and variables → Actions** (if not already done)
