---
name: scaffold-project
description: Validate and scaffold the TypeScript/Playwright project structure. Checks for BasePage, base-test, helpers, and enforces POM patterns. Auto-creates missing pieces from templates.
argument-hint: ""
context: fork
agent: general-purpose
---

# Scaffold Project

## Invocation Rules

**Invoked by:**
- `/scaffold-project` standalone command
- `/automate-multi-ts` workflow (phase 1.1, after scaffolding check)

**Execution condition:**
- Run ALL checks unconditionally
- If ALL pass → return `SKIPPED` immediately (no changes made)
- If ANY fail → auto-create from templates and return `APPROVED_WITH_FIXES`

---

## Purpose

Ensure the project has the correct TypeScript/Playwright foundation before test generation begins. Creates missing files from templates. Does NOT touch existing files.

Covers:
- `pages/BasePage.ts` — abstract base class with TIMEOUTS and helper methods
- `tests/base-test.ts` — extended test fixture with tryAssert helper
- `helpers/screenshots.ts` — Allure failure capture
- `helpers/index.ts` — barrel export
- Directory structure: `pages/`, `tests/`, `helpers/`
- CLAUDE.md conventions compliance (POM rules, selector priority, AAA pattern)

---

## Checks

### 1. pages/BasePage.ts — Exists and has required shape (Critical)

Read `pages/BasePage.ts` and verify:
- `export abstract class BasePage` is present
- `readonly page: Page` and `readonly url: string` properties exist
- `constructor(page: Page, url: string)` accepts both
- `navigate()` method uses `{ waitUntil: 'networkidle' }`
- `export const TIMEOUTS` object with at least `short`, `standard`, `long` keys

**FAIL action**: Copy template verbatim:
```
.claude/skills/scaffold-project/templates/pages/BasePage.ts
→ pages/BasePage.ts
```

Do NOT overwrite if file exists. Only create if missing.

---

### 2. tests/base-test.ts — Exists and re-exports (Critical)

Read `tests/base-test.ts` and verify:
- Imports `test as base` from `@playwright/test`
- Exports `test` (extended fixture)
- Exports `expect`
- Exports `tryAssert` helper function

**FAIL action**: Copy template verbatim:
```
.claude/skills/scaffold-project/templates/tests/base-test.ts
→ tests/base-test.ts
```

Do NOT overwrite if file exists. Only create if missing.

---

### 3. helpers/screenshots.ts — Exists (Critical)

Check if `helpers/screenshots.ts` exists.

**FAIL action**: Copy templates verbatim:
```
.claude/skills/scaffold-project/templates/helpers/screenshots.ts
→ helpers/screenshots.ts

.claude/skills/scaffold-project/templates/helpers/index.ts
→ helpers/index.ts
```

Create `helpers/` directory if it doesn't exist.

---

### 4. Directory structure — Required folders exist (Critical)

Verify these directories exist:
- `pages/`
- `tests/`
- `helpers/`

**FAIL action**: Create missing directories.

---

### 5. Existing page objects — Extend BasePage (Warning)

Scan `pages/*.ts` (excluding `BasePage.ts`) and verify each one:
- Has `extends BasePage`
- Has `constructor(page: Page)` that calls `super(page, ...)`
- Declares ALL locators as `readonly` properties (not inside methods)

**FAIL action**: Report files that violate the pattern as warnings. Do NOT auto-fix existing page objects (too risky). List violations in the output.

Common violations to flag:
- `extends` missing → page object is standalone class
- `locator()` calls inside method bodies (not constructor)
- Missing `super()` call in constructor
- `page` or `url` redeclared as properties (they come from BasePage)

---

### 6. Existing test files — Import from base-test (Warning)

Scan `tests/**/*.spec.ts` and verify each one:
- Imports `test` and `expect` from `../base-test` or `../../base-test` (relative path)
- Does NOT import directly from `@playwright/test`
- Uses `test.step()` with numbered steps: `'1- ...'`, `'2- ...'`, `'3- ...'`
- Tests are tagged in the title with `@smoke`, `@p0`, `@p1`, or `@feature`
- Contains `// ARRANGE`, `// ACT`, `// ASSERT` comments

**FAIL action**: Report violations as warnings. Do NOT auto-fix existing tests.

---

### 7. CLAUDE.md — Selector priority rules present (Warning)

Read `CLAUDE.md` and verify selector priority documentation exists:
1. `page.getByTestId(...)` — data-testid
2. `page.getByRole(...)` — semantic
3. `page.getByLabel(...)` — form fields
4. `page.getByPlaceholder(...)` — inputs
5. `page.getByText(...)` — last resort

**FAIL action**: Warning only — do not auto-fix CLAUDE.md.

---

## Templates

All templates are in `.claude/skills/scaffold-project/templates/`:

| Template | Target | Purpose |
|----------|--------|---------|
| `pages/BasePage.ts` | `pages/BasePage.ts` | Abstract base class with TIMEOUTS, navigate(), click(), fill(), waitForVisible(), dropdownSelect() |
| `tests/base-test.ts` | `tests/base-test.ts` | Extended test fixture, tryAssert() helper, re-exports expect |
| `helpers/screenshots.ts` | `helpers/screenshots.ts` | captureFailure() attaches full-page screenshot to Allure |
| `helpers/index.ts` | `helpers/index.ts` | Barrel export: `export { captureFailure } from './screenshots'` |
| `pages/ExamplePage.ts` | Reference only | POM pattern example — NOT copied automatically |
| `tests/example.spec.ts` | Reference only | Test pattern example — NOT copied automatically |

> **ExamplePage.ts** and **example.spec.ts** are reference templates only. They are shown in the output as examples when new page objects or tests are needed, but never written to disk automatically.

---

## Execution Flow

```
1. Check directory structure (pages/, tests/, helpers/)
2. Read pages/BasePage.ts → Check 1
3. Read tests/base-test.ts → Check 2
4. Check helpers/screenshots.ts exists → Check 3
5. Scan pages/*.ts for BasePage compliance → Check 5
6. Scan tests/**/*.spec.ts for base-test imports → Check 6
7. Read CLAUDE.md → Check 7
8. If ALL pass → return SKIPPED
9. For each failing Critical check: auto-create from template
10. For each failing Warning check: record violation
11. Run npx tsc --noEmit to verify no TypeScript errors
12. Return verdict
```

---

## POM Pattern Reference

```typescript
// pages/FeaturePage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage, TIMEOUTS } from './BasePage';

export class FeaturePage extends BasePage {
  // ALL locators as readonly properties (never inside methods)
  readonly submitButton: Locator;
  readonly emailInput: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page, `${process.env.BASE_URL ?? 'https://...'}/path`);

    // Selector priority: data-testid > role > label > placeholder > text
    this.submitButton = page.getByRole('button', { name: 'Submit' });
    this.emailInput   = page.getByLabel('Email');
    this.errorMessage = page.getByRole('alert');
  }

  // Data extraction logic belongs in page objects
  async getErrorText(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? '';
  }
}
```

**NEVER in page objects:**
- `page.waitForTimeout()` — use `waitFor({ state: 'visible' })` instead
- CSS class selectors (`.btn-primary`)
- XPath selectors
- Hardcoded credentials
- Locators inside method bodies (only in constructor)
- Redeclaring `page` or `url` (they come from BasePage)

---

## Test Pattern Reference

```typescript
// tests/feature/feature.spec.ts
import { test, expect, tryAssert } from '../base-test';
import { FeaturePage } from '../../pages/FeaturePage';

test.describe('Feature Name @feature', () => {

  test('action results in outcome @smoke @p0 @feature', async ({ page }) => {
    // ARRANGE
    const featurePage = new FeaturePage(page);
    await test.step('1- User navigates to feature page', async () => {
      await featurePage.navigate();
    });

    // ACT
    await test.step('2- User performs the action', async () => {
      await featurePage.doSomething();
    });

    // ASSERT
    await test.step('3- Validate the expected result', async () => {
      await tryAssert(page, async () => {
        await expect(featurePage.resultLocator).toBeVisible();
      });
    });
  });

});
```

**NEVER in tests:**
- Raw `page.locator()` calls
- Logic (no parsing, loops, conditionals)
- `page.waitForTimeout()` or `setTimeout`
- Cross-test dependencies (each test must run independently)
- Import from `@playwright/test` directly — always use `../base-test`
- Over-atomization: 1 test per element is wrong — group related assertions

---

## Data Isolation Convention

Adapted from syn-e2e-testing Python patterns:

| Scope | Convention | When |
|-------|-----------|------|
| Shared (read-only) | `testShared*` prefix | VIEW tests that only read |
| Edit exclusive | `testEdit*` prefix | UPDATE tests that modify |
| Delete exclusive | `testDelete*` prefix | DELETE tests that remove |

Each test must be self-contained. Never rely on state left by another test.

---

## Output Format

```json
{
  "reviewer": "scaffold-project",
  "verdict": "SKIPPED | APPROVED_WITH_FIXES | REJECTED",
  "checks": {
    "basepage_exists": "PASS | FAIL | FIXED",
    "base_test_exists": "PASS | FAIL | FIXED",
    "helpers_exist": "PASS | FAIL | FIXED",
    "directory_structure": "PASS | FAIL | FIXED",
    "pom_compliance": "PASS | WARN",
    "test_imports": "PASS | WARN",
    "claude_md_selectors": "PASS | WARN"
  },
  "fixes_applied": [
    {
      "file": "helpers/screenshots.ts",
      "check": "helpers_exist",
      "description": "Created Allure failure capture helper from template"
    }
  ],
  "warnings": [
    {
      "file": "pages/OldPage.ts",
      "check": "pom_compliance",
      "description": "Does not extend BasePage"
    }
  ],
  "typescript_check": "PASS | FAIL",
  "summary": "2 files created. 1 warning. TypeScript check passed."
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
`REJECTED` blocks — escalate to user.
