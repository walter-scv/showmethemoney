// tests/base-test.ts
import { test as base } from '@playwright/test';

/**
 * Base test fixture for all E2E tests.
 *
 * Extend this instead of importing `test` directly from `@playwright/test`.
 * Add shared fixtures here (e.g. authenticated page, seeded data, etc.)
 *
 * Usage:
 *   import { test } from '../base-test';
 */
export const test = base.extend({
  // Placeholder for future shared fixtures (auth state, custom page wrappers, etc.)
  // Example:
  // authenticatedPage: async ({ page }, use) => {
  //   await page.goto('/login');
  //   await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL ?? '');
  //   await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD ?? '');
  //   await page.getByRole('button', { name: 'Login' }).click();
  //   await use(page);
  // },
});

export { expect } from '@playwright/test';
