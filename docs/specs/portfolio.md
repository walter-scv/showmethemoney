# Portfolio de Inversiones

> Explored: 2026-04-09
> URL: https://sea-lion-app-7celq.ondigitalocean.app

---

## Overview

La app "Show me the money!" es un simulador de inversiones personales. El usuario dispone de una caja de ahorro con saldo inicial y puede comprar o vender activos financieros (acciones y bonos) de un listado disponible. El portfolio refleja en tiempo real las posiciones del usuario y el saldo restante.

---

## Use Cases

### UC-1: Ver el estado del portfolio

**Actor**: Inversor  
**Goal**: Ver el resumen de su cartera actual

**Main flow**:
1. El usuario abre la app
2. Ve en el sidebar izquierdo su saldo en caja de ahorro
3. Ve la lista de activos que tiene en su portfolio (nombre + unidades)
4. Ve en el panel principal el valor total de su cartera con un gráfico de distribución

**Expected result**: Se muestra el saldo de caja de ahorro, los activos con sus unidades, y el valor total de la cartera.

---

### UC-2: Ver detalle de un activo del portfolio

**Actor**: Inversor  
**Goal**: Consultar el detalle de un activo que ya posee

**Main flow**:
1. El usuario hace click en un activo de "Mi portfolio"
2. El panel principal muestra el detalle: nombre, cotización actual, cantidad adquirida, valor total
3. Se muestran los controles para comprar más unidades o vender

**Expected result**: Panel de detalle con cotización, posición actual y controles de compra/venta.

---

### UC-3: Comprar un activo ya existente en el portfolio

**Actor**: Inversor  
**Goal**: Incrementar su posición en un activo que ya posee

**Main flow**:
1. El usuario selecciona un activo de "Mi portfolio"
2. Ingresa la cantidad a comprar en el spinbutton "Comprar"
3. Aparece el botón "Realizar compra"
4. El usuario hace click en "Realizar compra"

**Expected result**:
- La cantidad de unidades del activo aumenta en el portfolio
- El saldo de la caja de ahorro se reduce en `cantidad × cotización`
- El spinbutton vuelve a 0

---

### UC-4: Comprar un activo nuevo (no está en el portfolio)

**Actor**: Inversor  
**Goal**: Agregar un nuevo activo a su cartera

**Main flow**:
1. El usuario selecciona un activo de "Inversiones disponibles"
2. El panel muestra solo cotización y control de compra (sin posición previa)
3. Ingresa la cantidad y hace click en "Realizar compra"

**Expected result**:
- El activo aparece en "Mi portfolio" con la cantidad comprada
- El saldo de la caja de ahorro se reduce correctamente
- El panel actualiza mostrando la posición y el control de venta habilitado

---

### UC-5: Vender un activo del portfolio

**Actor**: Inversor  
**Goal**: Reducir o liquidar su posición en un activo

**Main flow**:
1. El usuario selecciona un activo de "Mi portfolio"
2. Ingresa la cantidad a vender en el spinbutton "Vender"
3. Aparece el botón "Realizar venta"
4. El usuario hace click en "Realizar venta"

**Expected result**:
- La cantidad de unidades del activo disminuye
- El saldo de la caja de ahorro aumenta en `cantidad × cotización`
- Si vende todas las unidades, el activo desaparece del portfolio
- El panel vuelve a mostrar el gráfico general de cartera al liquidar el último activo

---

## Edge Cases & Border Behaviors

- **Vender más unidades de las que se tienen**: El spinbutton se limita automáticamente al máximo disponible. Al ingresar 100 teniendo 3, el campo muestra 3. ✅ Correcto.

- **Vender todas las unidades de un activo**: El activo desaparece del portfolio y el panel principal vuelve al gráfico de cartera. ✅ Correcto.

- **Comprar un activo que no está en el portfolio**: El panel no muestra "Cantidad adquirida" ni "Valor total" ni control de venta hasta que se realiza la primera compra. ✅ Correcto.

- **Comprar más unidades de las que puede pagar (saldo insuficiente)**: La app **no valida** el saldo disponible. Permite comprar cualquier cantidad, llevando la caja de ahorro a valores negativos (ej: $ -12.582.873,75). ❌ **Bug crítico.**

- **Valor total cartera con activos en negativo**: El gráfico y el valor total reflejan la compra aunque el saldo sea negativo. No hay alerta ni bloqueo. ❌ Comportamiento incorrecto.

---

## Issues Found

| # | Severity | Description |
|---|----------|-------------|
| 1 | **High** | La app permite comprar activos sin validar el saldo disponible. El usuario puede generar un saldo negativo ilimitado en la caja de ahorro. No hay mensaje de error, validación ni bloqueo del botón "Realizar compra". |

---

## Test Coverage

> Automated: 2026-04-09  
> Files: `tests/portfolio/portfolio.spec.ts` · `pages/PortfolioPage.ts`

| ID | Test | Tags | UC | Status |
|----|------|------|----|--------|
| S1-S2 | portfolio page overview and asset detail panel | @smoke @p0 @portfolio | UC-1, UC-2 | ✅ Pass |
| S3 | buy existing portfolio asset increases units and decreases balance | @smoke @p0 @portfolio | UC-3 | ✅ Pass |
| S4 | buy new asset adds it to portfolio and shows vender spinbutton | @smoke @p0 @portfolio | UC-4 | ✅ Pass |
| S5-S6 | sell all units removes asset from portfolio and restores balance | @smoke @p0 @portfolio | UC-5 | ✅ Pass |
| S7 | buying beyond available balance results in negative balance (known bug) | @p1 @portfolio | Bug #1 | ✅ Pass (documents bug) |

**Implementation notes:**
- App uses Argentine locale format (`$ 42.000,00`) — parsing handled in `PortfolioPage`
- Each buy/sell triggers an async "Operación en proceso..." → "Operación realizada." cycle — `waitForTransactionComplete()` handles this
- After a transaction, the detail panel shows the result message and hides spinbuttons — tests re-click the asset to verify updated state
- Vender spinbutton has `max` attribute set to owned units — spinbutton accepts values up to owned quantity
- Comprar spinbutton has no `max` attribute — allows any quantity (hence the negative balance bug)

---

## Technical Notes

| Element | Selector | Notes |
|---------|----------|-------|
| Caja de ahorro (saldo) | `page.getByRole('complementary').locator('p').nth(1)` | Second `<p>` in sidebar — first is the label |
| Mi portfolio asset buttons | `page.locator('.my-investments__items__name', { hasText: name })` | Scoped to portfolio section only |
| Lista Inversiones disponibles | `page.getByRole('button', { name: 'Transportadora Gas del Norte' })` | Unique name = no disambiguation needed |
| Spinbutton Comprar | `page.getByRole('spinbutton').first()` | No `max` attribute |
| Spinbutton Vender | `page.getByRole('spinbutton').nth(1)` | `max` = owned units, only visible for portfolio assets |
| Botón Realizar compra | `page.getByRole('button', { name: 'Realizar compra' })` | Appears after entering qty > 0 |
| Botón Realizar venta | `page.getByRole('button', { name: 'Realizar venta' })` | Appears after entering qty > 0 |
| Cotización | `page.locator('p', { hasText: /Cotización:/ })` | Must use `locator('p')` — inner `<strong>` shadows `getByText` |
| Cantidad adquirida | `page.locator('p', { hasText: /Cantidad adquirida/ })` | Same — inner `<strong>` |
| Valor total cartera | `page.getByText('Valor total cartera')` | Visible in main panel when no asset selected |
