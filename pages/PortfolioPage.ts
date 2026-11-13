// pages/PortfolioPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage, TIMEOUTS } from './BasePage';

export class PortfolioPage extends BasePage {
  // Sidebar locators
  readonly savingsBalance: Locator;
  readonly savingsBalanceLabel: Locator;
  readonly portfolioSectionLabel: Locator;
  readonly availableSectionLabel: Locator;

  // Portfolio asset buttons
  // NOTE: .first() required — 'Ternium Argentina' appears in both Mi portfolio and
  // Inversiones disponibles. No data-testid available on this app.
  readonly terniumArgentinaButton: Locator;
  readonly transportadoraGasButton: Locator;

  // Main panel — overview state
  readonly totalCarteraLabel: Locator;
  // NOTE: p.nth(1) is the only available selector for both the total portfolio value
  // (chart view) and the asset name (detail view). They reference the same DOM slot
  // that changes meaning based on UI state. No data-testid available.
  readonly mainPanelSecondParagraph: Locator;
  readonly portfolioChart: Locator;

  // Detail panel locators
  readonly detailCotizacion: Locator;
  readonly detailCantidadAdquirida: Locator;
  readonly detailValorTotal: Locator;

  // Transaction spinbuttons
  // NOTE: .first()/.nth(1) required — no data-testid attributes available.
  // first() = Comprar, nth(1) = Vender (only present for portfolio assets).
  readonly comprarSpinbutton: Locator;
  readonly venderSpinbutton: Locator;

  // Transaction action buttons
  readonly realizarCompraButton: Locator;
  readonly realizarVentaButton: Locator;

  // Transaction state messages
  readonly transactionProcessingMsg: Locator;
  readonly transactionDoneMsg: Locator;

  constructor(page: Page) {
    super(page, 'https://sea-lion-app-7celq.ondigitalocean.app');

    // Sidebar
    // NOTE: The first <p> in the sidebar is "Caja de ahorro", the second is the balance.
    // Using nth(1) to target the balance <p> specifically. No data-testid available.
    this.savingsBalance = page.getByRole('complementary').locator('p').nth(1);
    this.savingsBalanceLabel = page.getByRole('complementary').locator('p').first();
    this.portfolioSectionLabel = page.getByText('Mi portfolio');
    this.availableSectionLabel = page.getByText('Inversiones disponibles');

    // Asset buttons — .first() required for disambiguation (see note above)
    this.terniumArgentinaButton = page.getByRole('button', { name: 'Ternium Argentina' }).first();
    this.transportadoraGasButton = page.getByRole('button', { name: 'Transportadora Gas del Norte' });

    // Main panel
    this.totalCarteraLabel = page.getByText('Valor total cartera');
    // Shared slot: resolves to asset name in detail view, total value in chart view
    this.mainPanelSecondParagraph = page.getByRole('main').locator('p').nth(1);
    this.portfolioChart = page.getByRole('img');

    // Detail panel
    // NOTE: Each detail row is a <p> containing a <strong> label + text.
    // Using locator('p', { hasText }) to match the <p>, not the inner <strong>.
    this.detailCotizacion = page.locator('p', { hasText: /Cotización:/ });
    this.detailCantidadAdquirida = page.locator('p', { hasText: /Cantidad adquirida/ });
    this.detailValorTotal = page.locator('p', { hasText: /Valor total/ });

    // Spinbuttons — .first()/.nth(1) required (see note above)
    this.comprarSpinbutton = page.getByRole('spinbutton').first();
    this.venderSpinbutton = page.getByRole('spinbutton').nth(1);

    // Action buttons
    this.realizarCompraButton = page.getByRole('button', { name: 'Realizar compra' });
    this.realizarVentaButton = page.getByRole('button', { name: 'Realizar venta' });

    // Transaction state messages shown in detail panel after buy/sell
    this.transactionProcessingMsg = page.getByText('Operación en proceso');
    this.transactionDoneMsg = page.getByText('Operación realizada');
  }

  // --- Dynamic locator factories ---

  /** Returns a locator for any button by name (sidebar or available). */
  assetButton(name: string): Locator {
    return this.page.getByRole('button', { name });
  }

  /** Returns a locator scoped to Mi portfolio section buttons only. */
  portfolioAssetButton(name: string): Locator {
    return this.page.locator('.my-investments__items__name', { hasText: name });
  }

  // --- Data extraction methods (parsing logic belongs here, not in tests) ---

  /**
   * Parses Argentine locale numbers: "$ 42.000,00" → 42000.00
   * Period = thousands separator, comma = decimal separator.
   */
  private parseArgentineNumber(text: string): number {
    return parseFloat(
      text
        .replace(/\$/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '.')
        .trim()
    );
  }

  async getSavingsBalance(): Promise<number> {
    await this.savingsBalance.waitFor({ state: 'visible', timeout: TIMEOUTS.long });
    const text = (await this.savingsBalance.textContent()) ?? '0';
    return this.parseArgentineNumber(text);
  }

  async getAssetPrice(): Promise<number> {
    const text = (await this.detailCotizacion.textContent()) ?? '0';
    // Text format: "Cotización: $ 126,25 / unidad"
    const priceText = text.replace('Cotización:', '').replace('/ unidad', '').trim();
    return this.parseArgentineNumber(priceText);
  }

  async getUnitsOwned(): Promise<number> {
    const text = (await this.detailCantidadAdquirida.textContent()) ?? '0';
    // Text format: "Cantidad adquirida: 10 unidades"
    const unitsText = text
      .replace(/Cantidad adquirida\s*:?\s*/i, '')
      .replace(/\s*unidades?/i, '')
      .trim();
    return parseFloat(unitsText);
  }

  /** Returns the expected balance after selling a given number of units at a given price. */
  getExpectedBalanceAfterSale(balanceBefore: number, units: number, price: number): number {
    return balanceBefore + units * price;
  }

  async getComprarSpinbuttonValue(): Promise<number> {
    const value = await this.comprarSpinbutton.inputValue();
    return parseFloat(value) || 0;
  }

  async getVenderSpinbuttonValue(): Promise<number> {
    const value = await this.venderSpinbutton.inputValue();
    return parseFloat(value) || 0;
  }

  async isVenderSpinbuttonVisible(): Promise<boolean> {
    return this.venderSpinbutton.isVisible();
  }

  /** Fill the Comprar quantity input with the given number. */
  async fillComprar(quantity: number): Promise<void> {
    await this.comprarSpinbutton.waitFor({ state: 'visible', timeout: TIMEOUTS.standard });
    await this.comprarSpinbutton.clear();
    await this.comprarSpinbutton.pressSequentially(String(quantity));
  }

  /** Fill the Vender quantity input with the given number. */
  async fillVender(quantity: number): Promise<void> {
    await this.venderSpinbutton.waitFor({ state: 'visible', timeout: TIMEOUTS.standard });
    await this.venderSpinbutton.clear();
    await this.venderSpinbutton.pressSequentially(String(quantity));
  }

  /** Click the Realizar compra button and wait for the transaction to complete. */
  async clickRealizarCompra(): Promise<void> {
    await this.realizarCompraButton.waitFor({ state: 'visible', timeout: TIMEOUTS.standard });
    await this.realizarCompraButton.click();
    await this.waitForTransactionComplete();
  }

  /** Click the Realizar venta button and wait for the transaction to complete. */
  async clickRealizarVenta(): Promise<void> {
    await this.realizarVentaButton.waitFor({ state: 'visible', timeout: TIMEOUTS.standard });
    await this.realizarVentaButton.click();
    await this.waitForTransactionComplete();
  }

  /**
   * Waits for transaction messages to cycle (en proceso → realizada → gone),
   * then waits for the sidebar balance to be visible and stable.
   */
  private async waitForTransactionComplete(): Promise<void> {
    try {
      await this.transactionProcessingMsg.waitFor({ state: 'visible', timeout: TIMEOUTS.short });
      await this.transactionProcessingMsg.waitFor({ state: 'hidden', timeout: TIMEOUTS.long });
    } catch {
      // May not appear for fast transactions
    }
    try {
      await this.transactionDoneMsg.waitFor({ state: 'visible', timeout: TIMEOUTS.short });
      await this.transactionDoneMsg.waitFor({ state: 'hidden', timeout: TIMEOUTS.long });
    } catch {
      // May not appear
    }
    // Ensure sidebar has re-rendered before callers read state
    await this.savingsBalance.waitFor({ state: 'visible', timeout: TIMEOUTS.long });
  }
}
