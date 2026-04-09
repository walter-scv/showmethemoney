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
- `/automate-multi` workflow (phase 3.2)
- `/automate` workflow (during code review)

---

## Arguments

```
/review-test $0
             └── Pending test file (.claude/temp/pending_test.spec.ts)
```

---

## Purpose

Review test file structure, AAA pattern, and tag usage. Ensure:
- Proper `test.describe` / `test` structure
- AAA pattern (Arrange-Act-Assert)
- Tags in test title (@smoke, @p0, etc.)
- No over-atomization
- No logic in tests

---

## Review Checklist

### File Structure (Critical)

```
- [ ] Uses `import { test, expect } from '@playwright/test'`
- [ ] Page Objects imported from `../pages/`
- [ ] Tests wrapped in `test.describe('Feature @tag', ...)`
- [ ] Feature tag in describe block name
```

### Test Method Level (Critical)

```
- [ ] Priority tag in test title: @smoke, @p0, @p1, @p2
- [ ] Descriptive test name
- [ ] Uses Page Object (not raw page.locator() in test)
```

### AAA Pattern (Critical)

```
ARRANGE:
- [ ] Page object instantiated
- [ ] Navigation to page

ACT:
- [ ] Performs the action being tested via page object methods

ASSERT:
- [ ] expect() assertions validate outcome
- [ ] Assertions use Playwright expect matchers
```

### NO LOGIC IN TESTS (Critical)

```
- [ ] NO parsing (split, trim, regex) in test file
- [ ] NO loops (for, while) in test file
- [ ] NO conditionals (if/else) for logic in test file
- [ ] NO string manipulation in test file
- [ ] Simple expect() assertions only
```

### Over-Atomization Check

```
- [ ] Tests target DIFFERENT pages/flows (not same page)
- [ ] No standalone "navigation" tests
- [ ] No tests that check a single element when others test same page
- [ ] Ratio: If tests/pages > 2:1, likely over-atomized
```

---

## Expected Structure

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

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
| Ratio tests/pages > 3 | REJECT |

---

## Output Format

```json
{
  "reviewer": "review-test",
  "artifact_path": ".claude/temp/pending_test.spec.ts",
  "verdict": "APPROVED | REJECTED",
  "checklist_results": {
    "file_structure": {"passed": 4, "failed": 0},
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
- Missing AAA pattern
- Logic in tests (parsing, loops, conditionals)
- Raw `page.locator()` calls in tests (should use page objects)
- Over-atomization (ratio > 3)
- Missing `expect()` assertions

### Warning (Should Fix)
- Missing priority tags (@p0, @p1)
- Steps not clearly separated with comments
- Borderline atomization (ratio 2-3)
