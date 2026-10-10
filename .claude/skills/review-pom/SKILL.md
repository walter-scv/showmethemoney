---
name: review-pom
description: Review Page Object implementations for TypeScript/Playwright patterns. Returns APPROVED/REJECTED verdict.
argument-hint: "<pending_page_object_file> [selectors_file]"
context: fork
agent: general-purpose
---

# Review Page Object

## Invocation Rules

**Only invoked by:**
- `/automate-multi-ts` workflow (phase 3.2)
- `/automate-ts` workflow (during code review)

---

## Arguments

```
/review-pom $0 [$1]
            │   └── Verified selectors file (optional, .claude/temp/selectors.json)
            └────── Pending Page Object file (.claude/temp/pending_page_object.ts)
```

---

## Purpose

Review Page Object implementations against Playwright TypeScript patterns. Ensure:
- Extends `BasePage` from `pages/BasePage.ts`
- Uses `TIMEOUTS` constants — no hardcoded numbers
- Locators in constructor only
- Logic belongs in page objects (not tests)
- No forbidden patterns

---

## Review Checklist

### Structure (Critical)

```
- [ ] Class extends BasePage: `export class FeaturePage extends BasePage`
- [ ] Imports BasePage AND TIMEOUTS: `import { BasePage, TIMEOUTS } from './BasePage'`
- [ ] Constructor calls `super(page, url)` — does NOT redeclare `this.page` or `this.url`
- [ ] Does NOT override `navigate()` unless adding extra logic beyond goto
- [ ] pages/BasePage.ts exists in the project
```

### Locators — ALL in constructor (Critical)

```
- [ ] ALL locators defined as `readonly` class properties
- [ ] ALL locators assigned in constructor
- [ ] NO locators defined inside methods
- [ ] Selector priority followed:
  1. getByTestId('...') — when data-testid exists
  2. getByRole('...', { name: '...' }) — semantic role
  3. getByLabel('...') — form fields
  4. getByPlaceholder('...') — inputs
  5. locator('tag', { hasText }) — when inner elements shadow text
  6. getByText('...') — last resort
```

### Forbidden Patterns (Critical)

```
- [ ] NO hardcoded timeout numbers (2000, 5000, 10000) — use TIMEOUTS.short/standard/long
- [ ] NO .nth(n) without justification comment
- [ ] NO CSS class selectors (.class-name) without justification comment
- [ ] NO XPath
- [ ] NO page.waitForTimeout()
- [ ] NO hardcoded credentials
```

### Methods

```
- [ ] Single responsibility per method
- [ ] Data extraction / parsing logic HERE (not in tests)
- [ ] Proper TypeScript return types on all public methods
- [ ] Async methods properly typed as Promise<T>
- [ ] waitFor() calls use TIMEOUTS.* constants
```

---

## Expected Structure

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage, TIMEOUTS } from './BasePage';

export class FeaturePage extends BasePage {
  // ALL locators here
  readonly submitButton: Locator;
  readonly emailInput: Locator;

  constructor(page: Page) {
    super(page, 'https://sea-lion-app-7celq.ondigitalocean.app/path');

    this.submitButton = page.getByRole('button', { name: 'Submit' });
    this.emailInput = page.getByLabel('Email');
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.waitFor({ state: 'visible', timeout: TIMEOUTS.standard });
    await this.emailInput.fill(email);
  }

  async getErrorText(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? '';
  }
}
```

---

## Output Format

```json
{
  "reviewer": "review-pom",
  "artifact_path": ".claude/temp/pending_page_object.ts",
  "verdict": "APPROVED | REJECTED",
  "checklist_results": {
    "structure": {"passed": 5, "failed": 0},
    "locators": {"passed": 5, "failed": 0},
    "forbidden_patterns": {"passed": 5, "failed": 0},
    "methods": {"passed": 3, "failed": 0}
  },
  "issues": [
    {
      "severity": "critical",
      "line": 35,
      "category": "structure",
      "code": "export class FeaturePage {",
      "description": "Does not extend BasePage",
      "suggestion": "Change to: export class FeaturePage extends BasePage"
    }
  ],
  "critical_count": 0,
  "warning_count": 0,
  "summary": "APPROVED"
}
```

---

## Severity Levels

### Critical (Blocks Approval)
- Does NOT extend `BasePage`
- Does NOT import `TIMEOUTS` from BasePage
- Hardcoded timeout numbers (use `TIMEOUTS.*`)
- Locators defined in methods (not constructor)
- `page.waitForTimeout()` usage
- CSS class selectors without justification comment
- Missing TypeScript types on public methods

### Warning (Should Fix)
- Missing return type annotations on private methods
- Role-based selector when data-testid might exist
- Unverified selectors (if selectors file provided)
