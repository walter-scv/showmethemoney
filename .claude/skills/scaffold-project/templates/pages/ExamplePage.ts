// pages/ExamplePage.ts
// TEMPLATE — rename and adapt for your feature
import { Page, Locator } from '@playwright/test';
import { BasePage, TIMEOUTS } from './BasePage';

/**
 * Page Object for the Example feature.
 *
 * Rules:
 * - ALL locators are readonly class properties
 * - ALL locators are assigned in the constructor (never inside methods)
 * - Selector priority: data-testid > role > label > placeholder > text
 * - Data extraction / parsing logic belongs HERE, not in tests
 * - No raw page.locator() calls in test files
 */
export class ExamplePage extends BasePage {
  // ── Locators ──────────────────────────────────────────────────────────────
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page, `${process.env.BASE_URL ?? 'https://sea-lion-app-7celq.ondigitalocean.app'}/example`);

    // Selector priority: data-testid > role > label > placeholder > text
    this.heading      = page.getByRole('heading', { name: 'Example' });
    this.emailInput   = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Submit' });
    this.errorMessage = page.getByRole('alert');
  }

  // ── Data extraction ────────────────────────────────────────────────────────

  /**
   * Returns the text content of the error message element.
   * Logic in page object — tests just call getErrorText().
   */
  async getErrorText(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? '';
  }

  // ── Composite actions ──────────────────────────────────────────────────────

  /**
   * Fill and submit the form in one call.
   * Composite actions belong in page objects, not tests.
   */
  async submitForm(email: string, password: string): Promise<void> {
    await this.fill(this.emailInput, email);
    await this.fill(this.passwordInput, password);
    await this.click(this.submitButton);
    // Wait for the async response (spinner disappears or result appears)
    await this.submitButton.waitFor({ state: 'visible', timeout: TIMEOUTS.long });
  }
}
