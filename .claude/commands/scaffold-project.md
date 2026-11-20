# Scaffold Project

Validates and auto-creates the TypeScript/Playwright project foundation — BasePage, base-test, helpers, and POM/test pattern compliance.

## Usage

```
/scaffold-project
```

No arguments needed. Runs against the current working directory.

---

## What it does

Reads `.claude/skills/scaffold-project/SKILL.md` and executes all 7 checks:

| # | Check | File(s) | Severity |
|---|-------|---------|----------|
| 1 | BasePage exists with TIMEOUTS + helpers | `pages/BasePage.ts` | Critical |
| 2 | base-test exists with tryAssert + re-exports | `tests/base-test.ts` | Critical |
| 3 | helpers exist (screenshots + barrel export) | `helpers/screenshots.ts`, `helpers/index.ts` | Critical |
| 4 | Required directories exist | `pages/`, `tests/`, `helpers/` | Critical |
| 5 | Existing page objects extend BasePage | `pages/*.ts` | Warning |
| 6 | Existing tests import from base-test | `tests/**/*.spec.ts` | Warning |
| 7 | CLAUDE.md has selector priority docs | `CLAUDE.md` | Warning |

Critical issues are **auto-created from templates**. Existing files are never overwritten. Warnings are reported but not blocking.

---

## Execution

```
Read(.claude/skills/scaffold-project/SKILL.md)
Run all 7 checks against the current project
Auto-create any missing files from .claude/skills/scaffold-project/templates/
Run npx tsc --noEmit to verify no TypeScript errors
Print results table and verdict
```

---

## Outcomes

| Verdict | Meaning |
|---------|---------|
| `SKIPPED` | Everything already in place — nothing to do |
| `APPROVED_WITH_FIXES` | Missing files created — review the new files |
| `REJECTED` | A critical issue could not be fixed — manual intervention required |

---

## What gets created (if missing)

| File | What it provides |
|------|-----------------|
| `pages/BasePage.ts` | Abstract base class, `TIMEOUTS` constants, `navigate()`, `click()`, `fill()`, `waitForVisible()`, `dropdownSelect()` |
| `tests/base-test.ts` | Extended `test` fixture, `tryAssert()` for Allure failure screenshots, `expect` re-export |
| `helpers/screenshots.ts` | `captureFailure()` — attaches full-page screenshot to Allure on test failure |
| `helpers/index.ts` | Barrel export: `export { captureFailure } from './screenshots'` |

## Reference templates (not auto-created)

These are pattern examples shown in the skill output, not copied to disk:

| Template | Purpose |
|----------|---------|
| `.claude/skills/scaffold-project/templates/pages/ExamplePage.ts` | POM pattern: locators in constructor, extends BasePage, data extraction methods |
| `.claude/skills/scaffold-project/templates/tests/example.spec.ts` | Test pattern: AAA, numbered steps, tryAssert, tags |

---

## After running

If files were created:
1. Review the new files in `pages/`, `tests/`, and `helpers/`
2. Run `npx tsc --noEmit` to confirm no TypeScript errors
3. Commit the scaffolded structure
