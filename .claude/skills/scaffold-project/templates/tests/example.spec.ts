// tests/example/example.spec.ts
// TEMPLATE — rename and adapt for your feature
import { test, expect, tryAssert } from '../base-test';
import { ExamplePage } from '../../pages/ExamplePage';

/**
 * Test suite conventions:
 * - describe label: "Feature Name @feature-tag"
 * - test title: "action result description @tag1 @tag2"
 * - Tags: @smoke @p0 @p1 @p2 @feature-name
 *
 * AAA pattern — every test has:
 *   // ARRANGE  (setup + navigation)
 *   // ACT      (user interaction)
 *   // ASSERT   (verification)
 *
 * Steps are numbered: '1- ...', '2- ...', '3- ...'
 * Assertions wrapped in tryAssert(page, testInfo, ...) for Allure failure screenshot.
 *
 * testInfo is the second destructured fixture parameter:
 *   test('name', async ({ page }, testInfo) => { ... })
 */
test.describe('Example Feature @example', () => {

  test('happy path does X and shows Y @smoke @p0 @example', async ({ page }, testInfo) => {
    // ARRANGE
    const examplePage = new ExamplePage(page);

    await test.step('1- User navigates to the example page', async () => {
      await examplePage.navigate();
      await expect(examplePage.heading).toBeVisible();
    });

    // ACT
    await test.step('2- User fills the form and submits', async () => {
      await examplePage.submitForm('user@example.com', 'password123');
    });

    // ASSERT
    await test.step('3- Validate the result is displayed correctly', async () => {
      await tryAssert(page, testInfo, async () => {
        await expect(page).toHaveURL(/success/);
      });
    });
  });

  test('error case shows validation message @p1 @example', async ({ page }, testInfo) => {
    // ARRANGE
    const examplePage = new ExamplePage(page);

    await test.step('1- User navigates to the example page', async () => {
      await examplePage.navigate();
    });

    // ACT
    await test.step('2- User submits with invalid input', async () => {
      await examplePage.submitForm('invalid', 'wrong');
    });

    // ASSERT
    await test.step('3- Validate error message is shown', async () => {
      await tryAssert(page, testInfo, async () => {
        await expect(examplePage.errorMessage).toBeVisible();
        expect(await examplePage.getErrorText()).toContain('Invalid');
      });
    });
  });

});
