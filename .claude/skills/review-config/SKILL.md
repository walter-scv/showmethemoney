---
name: review-config
description: Review project configuration files and CI/CD workflows for required settings. Returns SKIPPED if nothing is missing, or APPROVED_WITH_FIXES after auto-correcting gaps.
argument-hint: "<playwright_config_path>"
context: fork
agent: general-purpose
---

# Review Project Config

## Invocation Rules

**Only invoked by:**
- `/automate-multi-ts` workflow (phase 1.2, after scaffolding check)

**Execution condition:**
- Run ALL checks unconditionally
- If ALL pass → return `SKIPPED` immediately (no changes made)
- If ANY fail → auto-fix and return `APPROVED_WITH_FIXES`

---

## Arguments

```
/review-config $0
               └── playwright.config.ts path (e.g. playwright.config.ts)
```

---

## Purpose

Validate and auto-fix project configuration before test generation begins. Covers:
- Playwright config (Allure reporter, CI flags, failure capture, timeouts, baseURL)
- TypeScript strict mode
- ESLint no-explicit-any
- `.gitignore` entries
- GitHub Actions CI/CD workflows (manual + scheduled)
- Custom `publish-allure` GitHub Action

This skill does NOT review page objects or test structure — those are covered by `review-pom` and `review-test`.

---

## Checks

### 1. playwright.config.ts — Allure Reporter (Critical)

Read `playwright.config.ts` and verify the `reporter` array contains:
```ts
['allure-playwright', { resultsDir: 'allure-results', detail: true, suiteTitle: true }]
```

**FAIL action**:
1. Add the entry to the `reporter` array
2. Verify `allure-playwright` is installed: `npm list allure-playwright` — if not, run `npm install --save-dev allure-playwright`
3. **IMPORTANT**: Use ONLY the string-tuple form. NEVER `new AllureReporter(...)` or any class import. Playwright's `ReporterDescription` type only accepts `[string] | [string, any]` tuples — class instances cause a TypeScript error.

---

### 2. playwright.config.ts — CI Safety Flags (Critical)

Verify all three are present:
```ts
forbidOnly: !!process.env.CI
retries: process.env.CI ? 2 : 0
workers: process.env.CI ? (Number(process.env.WORKERS) || 2) : undefined
```

**FAIL action**: Add any missing lines to the `defineConfig({})` block.

> `WORKERS` is injected by the workflow as an env var — the manual workflow exposes it as a `workflow_dispatch` input (1/2/4/8, default 2), the daily regression hardcodes it to 2.

---

### 3. playwright.config.ts — Failure Capture (Warning)

Verify inside the `use: {}` block:
```ts
trace: 'on-first-retry'
screenshot: 'only-on-failure'
video: 'retain-on-failure'
```

**FAIL action**: Add missing lines to the `use: {}` block.

---

### 4. playwright.config.ts — Timeouts (Warning)

Verify inside the `use: {}` block:
```ts
actionTimeout: 10000
navigationTimeout: 30000
```

**FAIL action**: Add missing lines to the `use: {}` block.

---

### 5. playwright.config.ts — baseURL via env (Warning)

Verify baseURL uses an environment variable with a fallback:
```ts
baseURL: process.env.BASE_URL ?? 'https://...'
```

**FAIL action**: Report as warning only — do not auto-fix (requires knowing the correct URL).

---

### 6. tsconfig.json — Strict Mode (Critical)

Read `tsconfig.json` and verify:
```json
"strict": true
```

**FAIL action**: Add `"strict": true` to `compilerOptions`.

---

### 7. eslint.config.mjs — no-explicit-any as error (Warning)

Read `eslint.config.mjs` (or `.eslintrc.*`) and verify:
```js
'@typescript-eslint/no-explicit-any': 'error'
```

**FAIL action**: Change from `'warn'` to `'error'` if present; report as warning if file doesn't exist.

---

### 8. .gitignore — allure-results excluded (Critical)

Read `.gitignore` and verify `/allure-results/` or `allure-results/` is present.

**FAIL action**: Append `/allure-results/` to `.gitignore`.

---

### 9. GitHub Actions — Manual workflow (Critical)

Check if `.github/workflows/e2e-tests.yml` exists.

**PASS condition**: File exists and contains `workflow_dispatch` trigger with `tag` input and `workers` input (options: 1/2/4/8, default 2). The run step must pass `WORKERS: ${{ inputs.workers }}` as env var.

**FAIL action**: Copy template verbatim:
```
.claude/skills/review-config/templates/workflows/e2e-tests.yml
→ .github/workflows/e2e-tests.yml
```

---

### 10. GitHub Actions — Scheduled regression workflow (Critical)

Check if `.github/workflows/daily-regression.yml` exists.

**PASS condition**: File exists and contains `schedule` trigger with a cron expression. The run step must pass `WORKERS: 2` as env var (hardcoded, no input).

**FAIL action**: Copy template verbatim:
```
.claude/skills/review-config/templates/workflows/daily-regression.yml
→ .github/workflows/daily-regression.yml
```

---

### 11. GitHub Actions — publish-allure custom action (Critical)

Check if `.github/actions/publish-allure/action.yml` exists.

**PASS condition**: File exists and contains steps for generating execution ID, downloading gh-pages history, installing Allure CLI, generating HTML report, and deploying via `peaceiris/actions-gh-pages@v4`.

**FAIL action**: Copy template verbatim:
```
.claude/skills/review-config/templates/actions/publish-allure/action.yml
→ .github/actions/publish-allure/action.yml
```
Create parent directories if they don't exist.

---

### 12. GitHub Actions — slack-notification custom action (Critical)

Check if `.github/actions/slack-notification/action.yml` exists.

**PASS condition**: File exists and contains a `node` inline script that parses Playwright's JSON report (`test-results/results.json`) and sends a formatted Slack message via webhook.

**FAIL action**: Copy template verbatim:
```
.claude/skills/review-config/templates/actions/slack-notification/action.yml
→ .github/actions/slack-notification/action.yml
```
Create parent directories if they don't exist.

---

### 13. playwright.config.ts — JSON reporter for Slack (Critical)

Verify the `reporter` array contains the JSON reporter:
```ts
['json', { outputFile: 'test-results/results.json' }]
```

This file is consumed by the `slack-notification` action to parse test results.

**FAIL action**: Add the entry to the `reporter` array in `playwright.config.ts`.

---

## Execution Flow

```
1. Read playwright.config.ts, tsconfig.json, .gitignore
2. Check existence of .github/workflows/e2e-tests.yml
3. Check existence of .github/workflows/daily-regression.yml
4. Check existence of .github/actions/publish-allure/action.yml
5. Check existence of .github/actions/slack-notification/action.yml
6. Run all 13 checks
7. If ALL pass → return SKIPPED immediately
8. For each failing check:
   - Critical: auto-fix and record fix
   - Warning: record as warning, auto-fix if safe
9. Run npx tsc --noEmit to verify no TypeScript errors after fixes
10. Return verdict
```

---

## Output Format

```json
{
  "reviewer": "review-config",
  "verdict": "SKIPPED | APPROVED_WITH_FIXES | REJECTED",
  "checks": {
    "allure_reporter": "PASS | FAIL | FIXED",
    "ci_safety_flags": "PASS | FAIL | FIXED",
    "failure_capture": "PASS | FAIL | FIXED",
    "timeouts": "PASS | FAIL | FIXED",
    "base_url_via_env": "PASS | WARN",
    "tsconfig_strict": "PASS | FAIL | FIXED",
    "eslint_no_any": "PASS | WARN",
    "gitignore_allure": "PASS | FAIL | FIXED",
    "workflow_manual": "PASS | FAIL | FIXED",
    "workflow_scheduled": "PASS | FAIL | FIXED",
    "action_publish_allure": "PASS | FAIL | FIXED",
    "action_slack_notification": "PASS | FAIL | FIXED",
    "json_reporter": "PASS | FAIL | FIXED"
  },
  "fixes_applied": [
    {
      "file": ".github/workflows/e2e-tests.yml",
      "check": "workflow_manual",
      "description": "Created manual e2e workflow with workflow_dispatch trigger"
    }
  ],
  "warnings": [],
  "typescript_check": "PASS | FAIL",
  "summary": "3 fixes applied. TypeScript check passed."
}
```

---

## Verdict Rules

| Condition | Verdict |
|-----------|---------|
| All checks pass, nothing done | `SKIPPED` |
| All critical issues fixed, TS check passes | `APPROVED_WITH_FIXES` |
| Critical issue could not be fixed OR TS check fails after fix | `REJECTED` |

`SKIPPED` and `APPROVED_WITH_FIXES` both allow the workflow to continue.
`REJECTED` blocks the workflow — escalate to user.
