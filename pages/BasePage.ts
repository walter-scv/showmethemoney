// pages/BasePage.ts
import { Page } from '@playwright/test';

export const TIMEOUTS = {
  /** Short wait for elements that should appear quickly (e.g. buttons, labels). */
  short: 2000,
  /** Standard wait for UI interactions and transitions. */
  standard: 5000,
  /** Extended wait for async operations (e.g. transaction completion, network). */
  long: 10000,
} as const;

export abstract class BasePage {
  readonly page: Page;
  readonly url: string;

  constructor(page: Page, url: string) {
    this.page = page;
    this.url = url;
  }

  async navigate(): Promise<void> {
    await this.page.goto(this.url, { waitUntil: 'networkidle' });
  }
}
