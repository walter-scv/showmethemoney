# CLAUDE.md — showmethemoney

## Project

Playwright + TypeScript E2E test project for:
**https://sea-lion-app-7celq.ondigitalocean.app**

Stack: Vue.js SPA (client-side rendered)

---

## Tech Stack

- **Test runner**: Playwright `@playwright/test`
- **Language**: TypeScript
- **Base URL**: `https://sea-lion-app-7celq.ondigitalocean.app`

---

## Directory Structure

```
showmethemoney/
├── pages/           ← Page Objects (*.ts)
├── tests/           ← Test files (*.spec.ts)
├── .claude/
│   ├── agents/      ← Agent definitions
│   ├── commands/    ← Slash commands
│   ├── skills/      ← Reviewer skills
│   └── temp/        ← Temporary workflow files
├── playwright.config.ts
└── CLAUDE.md
```

---

## Page Object Rules (CRITICAL)

```typescript
// pages/FeaturePage.ts
import { Page, Locator } from '@playwright/test';

export class FeaturePage {
  readonly page: Page;
  readonly url: string;

  // ALL locators as readonly properties
  readonly submitButton: Locator;
  readonly emailInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.url = 'https://sea-lion-app-7celq.ondigitalocean.app/path';

    // Selector priority: data-testid > role > label > placeholder > text
    this.submitButton = page.getByRole('button', { name: 'Submit' });
    this.emailInput = page.getByLabel('Email');
  }

  async navigate() {
    await this.page.goto(this.url);
  }

  // Data extraction logic belongs HERE
  async getErrorText(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? '';
  }
}
```

### Page Object DO
- ALL locators as `readonly` class properties
- ALL locators assigned in constructor
- Data extraction / parsing logic in page object methods
- Proper TypeScript return types on all methods
- `navigate()` method on every page object

### Page Object DON'T
- ❌ Locators inside methods
- ❌ `page.waitForTimeout()` — use `waitFor({ state: 'visible' })` instead
- ❌ CSS class selectors (`.btn-primary`)
- ❌ XPath selectors
- ❌ Hardcoded credentials
- ❌ Logic / parsing in tests

---

## Test Rules (CRITICAL)

```typescript
// tests/feature.spec.ts
import { test, expect } from '@playwright/test';
import { FeaturePage } from '../pages/FeaturePage';

test.describe('Feature Name @feature', () => {

  test('happy path scenario @smoke @p0', async ({ page }) => {
    // ARRANGE
    const featurePage = new FeaturePage(page);
    await featurePage.navigate();

    // ACT
    await featurePage.performAction('input');

    // ASSERT
    await expect(page).toHaveURL(/expected/);
  });

});
```

### Test DO
- AAA pattern: Arrange → Act → Assert (with comments)
- Tags in test title: `@smoke`, `@p0`, `@p1`, `@feature-name`
- Use Page Object methods — never raw `page.locator()` in tests
- Self-contained — each test can run independently

### Test DON'T
- ❌ Logic in tests (no parsing, loops, conditionals)
- ❌ Raw `page.locator()` calls inside test body
- ❌ `page.waitForTimeout()` or `setTimeout`
- ❌ Cross-test dependencies
- ❌ Over-atomization: don't create 1 test per element

---

## Selector Priority

1. `page.getByTestId('id')` — when `data-testid` exists
2. `page.getByRole('button', { name: '...' })` — semantic
3. `page.getByLabel('...')` — form fields
4. `page.getByPlaceholder('...')` — inputs
5. `page.getByText('...', { exact: true })` — last resort

---

## Tag Convention

```
@smoke   — Critical, must always pass
@p0      — Highest priority, blocks release
@p1      — High priority
@p2      — Medium priority
@auth    — Authentication tests
@feature — Feature-specific tag
```

---

## Commands Available

- `/explore` — Exploratory testing with Playwright MCP
- `/automate e2e "<description>" --url <url>` — Generate E2E tests
- `/automate-multi e2e "<description>" --url <url>` — Multi-agent test generation

---

## SPA Considerations

This app is a **Vue.js SPA**. Always:
- Wait for page to fully render before interacting
- Use `waitFor({ state: 'visible' })` for dynamic content
- Prefer `networkidle` wait strategy for initial navigation
