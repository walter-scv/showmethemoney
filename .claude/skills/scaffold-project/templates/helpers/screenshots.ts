// helpers/screenshots.ts
import { Page, TestInfo } from '@playwright/test';

/**
 * Capture a full-page screenshot and attach it to the Allure report.
 *
 * Requires Playwright's TestInfo object (available in test fixtures as `testInfo`).
 * The allure-playwright reporter picks up `testInfo.attach()` calls and shows
 * the screenshot under "Attachments" in the report.
 *
 * Usage in a test:
 *   import { captureFailure } from '../../helpers';
 *
 *   await test.step('3- Verify result', async () => {
 *     try {
 *       await expect(locator).toBeVisible();
 *     } catch (err) {
 *       await captureFailure(page, testInfo);
 *       throw err;
 *     }
 *   });
 *
 * Or use tryAssert() from base-test which wraps this automatically:
 *   await tryAssert(page, testInfo, async () => {
 *     await expect(locator).toBeVisible();
 *   });
 */
export async function captureFailure(page: Page, testInfo: TestInfo): Promise<void> {
  try {
    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('Failure Screenshot', {
      body: screenshot,
      contentType: 'image/png',
    });
  } catch {
    // Silently ignore — screenshot capture must never fail a test
  }
}
