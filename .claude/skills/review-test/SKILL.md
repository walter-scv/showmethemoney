---
name: review-test
description: Review test file structure, AAA pattern, and tag usage for Playwright TypeScript. Returns APPROVED/REJECTED verdict.
argument-hint: "<pending_test_file>"
context: fork
agent: general-purpose
---

# Review Test Structure

## Invocation Rules

**Only invoked by:**
- `/automate-multi-ts` workflow (phase 3.2)
- `/automate-ts` workflow (during code review)

---

## Arguments

```
/review-test $0
             └── Pending test file (.claude/temp/pending_test.ts)
```

---

## Purpose

Review test file structure, AAA pattern, and tag usage. Ensure:
- Imports `test` and `expect` from `../base-test` (never from `@playwright/test`)
- Proper `test.describe` / `test` structure
- AAA pattern (Arrange-Act-Assert)
- Tags in test title (@smoke, @p0, etc.)
- No over-atomization
- No logic in tests

---

## Review Checklist

### File Structure (Critical)

```
- [ ] Imports `test, expect` from `'../base-test'` — NOT from `@playwright/test`
- [ ] Page Objects imported from `'../../pages/'` (relative depth matches file location)
- [ ] Tests wrapped in `test.describe('Feature @tag', ...)`
- [ ] Feature tag in describe block name
- [ ] tests/base-test.ts exists in the project
```

### Test Method Level (Critical)

```
- [ ] Priority tag in test title: @smoke, @p0, @p1, or @p2
- [ ] Descriptive test name in business language
- [ ] Uses Page Object — no raw page.locator() in test body
```

### AAA Pattern (Critical)

```
ARRANGE:
- [ ] Page object instantiated
- [ ] navigate() called at start

ACT:
- [ ] Performs the action being tested via page object methods
- [ ] // ACT comment present before action block

ASSERT:
- [ ] expect() assertions validate outcome
- [ ] // ASSERT comment present before assertions
- [ ] Assertions use Playwright expect matchers
```

### NO LOGIC IN TESTS (Critical)

```
- [ ] NO parsing (split, trim, regex) in test file
- [ ] NO loops (for, while) in test file
- [ ] NO conditionals (if/else) in test file
- [ ] NO string manipulation in test file
- [ ] NO hardcoded timeout values
- [ ] Simple expect() assertions only
```

### Over-Atomization Check

```
- [ ] Tests target DIFFERENT pages/flows (not same page)
- [ ] No standalone "navigation" tests
- [ ] No tests that check a single element when others test same page
- [ ] Ratio: If tests/pages > 3:1 without exception, likely over-atomized
```

---

## Expected Structure

```typescript
import { test, expect } from '../base-test';          // ← base-test, NOT @playwright/test
import { LoginPage } from '../../pages/LoginPage';

test.describe('Login @auth', () => {

  test('valid login redirects to dashboard @smoke @p0', async ({ page }) => {
    // ARRANGE
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // ACT
    await loginPage.fillEmail('user@example.com');
    await loginPage.fillPassword('password123');
    await loginPage.submit();

    // ASSERT
    await expect(page).toHaveURL(/dashboard/);
  });

});
```

---

## Over-Atomization Red Flags (Auto-Reject)

| Pattern | Verdict |
|---------|---------|
| Multiple tests, same URL, same flow | REJECT |
| Single element test (`test_button_visible`) | REJECT |
| Navigation-only test | REJECT |
| Ratio tests/pages > 3 without justification | REJECT |

---

## Output Format

```json
{
  "reviewer": "review-test",
  "artifact_path": ".claude/temp/pending_test.ts",
  "verdict": "APPROVED | REJECTED",
  "checklist_results": {
    "file_structure": {"passed": 5, "failed": 0},
    "aaa_pattern": {"passed": 3, "failed": 0},
    "no_logic": {"passed": 6, "failed": 0},
    "tags": {"passed": 2, "failed": 0}
  },
  "over_atomization": {
    "test_count": 3,
    "unique_pages": 2,
    "ratio": 1.5,
    "verdict": "OK"
  },
  "issues": [],
  "critical_count": 0,
  "warning_count": 0,
  "summary": "APPROVED"
}
```

---

## Severity Levels

### Critical (Blocks Approval)
- Imports from `@playwright/test` instead of `../base-test`
- Missing AAA pattern
- Logic in tests (parsing, loops, conditionals)
- Raw `page.locator()` calls in tests (should use page objects)
- Over-atomization (ratio > 3 without exception)
- Missing `expect()` assertions
- Hardcoded timeout values in tests

### Warning (Should Fix)
- Missing priority tags (@p0, @p1)
- AAA sections not clearly separated with comments
- Borderline atomization (ratio 2-3)
