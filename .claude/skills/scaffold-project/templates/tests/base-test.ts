// tests/base-test.ts
import { test as base, expect, TestInfo } from '@playwright/test';
import { captureFailure } from '../helpers';

/**
 * Extended test fixture for all E2E tests.
 *
 * Import `test` and `expect` from this file instead of `@playwright/test`:
 *   import { test, expect } from '../base-test';
 *
 * Add shared fixtures here:
 * - authenticatedPage: pre-logged-in page context
 * - seededData: test data created via API before test runs
 *
 * tryAssert pattern:
 * Wraps assertions with automatic Allure failure screenshot capture.
 * Equivalent to Python's `async with self.try_assert(page):` context manager.
 *
 *   await test.step('3- Verify result', async () => {
 *     await tryAssert(page, testInfo, async () => {
 *       await expect(locator).toBeVisible();
 *     });
 *   });
 */
export const test = base.extend<{
  // Add custom fixture types here as the project grows
  // authenticatedPage: Page;
}>({
  // Example — authenticated page fixture:
  // authenticatedPage: async ({ page }, use) => {
  //   await page.goto('/login');
  //   await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL ?? '');
  //   await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD ?? '');
  //   await page.getByRole('button', { name: 'Sign In' }).click();
  //   await page.waitForURL(/dashboard/);
  //   await use(page);
  // },
});

export { expect };

/**
 * Wrap assertions with automatic failure screenshot capture for Allure.
 *
 * Usage:
 *   await tryAssert(page, testInfo, async () => {
 *     await expect(page.getByText('Hello')).toBeVisible();
 *   });
 *
 * testInfo is available as a fixture parameter:
 *   test('my test', async ({ page }, testInfo) => { ... });
 */
export async function tryAssert(
  page: import('@playwright/test').Page,
  testInfo: TestInfo,
  fn: () => Promise<void>
): Promise<void> {
  try {
    await fn();
  } catch (err) {
    await captureFailure(page, testInfo);
    throw err;
  }
}
