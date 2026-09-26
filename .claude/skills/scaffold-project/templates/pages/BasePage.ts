// pages/BasePage.ts
import { Page, Locator } from '@playwright/test';

/**
 * Timeout constants shared across all page objects.
 * Use these instead of magic numbers.
 */
export const TIMEOUTS = {
  /** Short wait — elements that appear immediately (buttons, labels). */
  short: 2000,
  /** Standard wait — UI transitions and interactions. */
  standard: 5000,
  /** Long wait — async operations, network responses, animations. */
  long: 10000,
  /** Processing wait — background tasks, transactions, data sync. */
  processing: 60000,
} as const;

/**
 * Abstract base class for all Page Objects.
 *
 * Provides:
 * - navigate() with networkidle wait strategy
 * - click() with configurable timeout
 * - fill() with clear + Tab press (mimics real user input)
 * - waitForVisible() helper
 * - TIMEOUTS constants
 *
 * Usage:
 *   export class MyPage extends BasePage {
 *     readonly myButton: Locator;
 *     constructor(page: Page) {
 *       super(page, 'https://example.com/my-path');
 *       this.myButton = page.getByRole('button', { name: 'Submit' });
 *     }
 *   }
 */
export abstract class BasePage {
  readonly page: Page;
  readonly url: string;

  constructor(page: Page, url: string) {
    this.page = page;
    this.url = url;
  }

  /**
   * Navigate to the page URL and wait for network to settle.
   */
  async navigate(): Promise<void> {
    await this.page.goto(this.url, { waitUntil: 'networkidle' });
  }

  /**
   * Click a locator with optional timeout override.
   * Defaults to TIMEOUTS.standard.
   */
  async click(locator: Locator, timeout = TIMEOUTS.standard): Promise<void> {
    await locator.click({ timeout });
  }

  /**
   * Clear a field, fill it with text, then press Tab.
   * Mimics real user input — triggers blur/change events.
   */
  async fill(locator: Locator, text: string): Promise<void> {
    await locator.clear();
    await locator.fill(text);
    await locator.press('Tab');
  }

  /**
   * Wait for a locator to become visible.
   * Defaults to TIMEOUTS.standard.
   */
  async waitForVisible(locator: Locator, timeout = TIMEOUTS.standard): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for a locator to be hidden (removed or invisible).
   * Defaults to TIMEOUTS.standard.
   */
  async waitForHidden(locator: Locator, timeout = TIMEOUTS.standard): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Select an option from a custom dropdown (click to open, click option, Escape to close).
   * Use for non-native <select> dropdowns.
   */
  async dropdownSelect(dropdown: Locator, optionName: string): Promise<void> {
    await dropdown.click();
    await this.page.getByRole('option', { name: optionName }).click();
    // Press Escape instead of clicking again — dropdown text may change after selection
    await this.page.keyboard.press('Escape');
  }
}
