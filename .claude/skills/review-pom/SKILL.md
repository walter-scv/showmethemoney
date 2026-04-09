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
- `/automate-multi` workflow (phase 3.2)
- `/automate` workflow (during code review)

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
- Proper class structure
- Locators in constructor only
- Logic belongs in page objects (not tests)
- No forbidden patterns

---

## Review Checklist

### Structure (Critical)

```
- [ ] Class exported with `export class`
- [ ] Constructor receives `page: Page`
- [ ] URL defined in constructor
- [ ] Implements navigate() method
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
  5. getByText('...') — last resort
```

### Forbidden Patterns (Critical)

```
- [ ] NO .nth(n) without justification
- [ ] NO CSS class selectors (.class-name)
- [ ] NO XPath
- [ ] NO page.waitForTimeout()
- [ ] NO hardcoded credentials
```

### Methods

```
- [ ] Single responsibility per method
- [ ] Data extraction / parsing logic HERE (not in tests)
- [ ] Proper TypeScript return types
- [ ] Async methods properly typed
```

---

## Expected Structure

```typescript
import { Page, Locator } from '@playwright/test';

export class FeaturePage {
  readonly page: Page;
  readonly url: string;

  // ALL locators here
  readonly submitButton: Locator;
  readonly emailInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.url = 'https://sea-lion-app-7celq.ondigitalocean.app/path';

    this.submitButton = page.getByRole('button', { name: 'Submit' });
    this.emailInput = page.getByLabel('Email');
  }

  async navigate() {
    await this.page.goto(this.url);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  // Logic belongs HERE
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
    "structure": {"passed": 4, "failed": 0},
    "locators": {"passed": 5, "failed": 0},
    "forbidden_patterns": {"passed": 4, "failed": 0},
    "methods": {"passed": 3, "failed": 0}
  },
  "issues": [
    {
      "severity": "critical",
      "line": 35,
      "category": "locators",
      "code": "const btn = this.page.locator(...)",
      "description": "Locator defined in method instead of constructor",
      "suggestion": "Move to constructor as readonly property"
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
- Locators defined in methods (not constructor)
- `page.waitForTimeout()` usage
- CSS class selectors
- Missing TypeScript types on public methods

### Warning (Should Fix)
- Missing return type annotations
- Role-based selector when data-testid might exist
- Unverified selectors (if selectors file provided)
