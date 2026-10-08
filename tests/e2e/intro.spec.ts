import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Narrativa accesible y fallback', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test('ocho escenas y números del conjunto original', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await expect(page.locator('[data-intro-scene]')).toHaveCount(8);
    await expect(page.locator('#eventos [data-value="225"] .sr-only')).toHaveText('225');
    await expect(page.locator('#proyectos .intro-inline-stat .sr-only')).toHaveText('12');
    await expect(page.locator('#indicadores .intro-indicator-grid .sr-only')).toHaveText([
      '2.71',
      '283.92',
      '0.769',
    ]);
    await expect(page.locator('#evidencia .intro-gap-number .sr-only')).toHaveText([
      '1.8%',
      '75.6%',
    ]);
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
  test('Saltar intro conserva los filtros aprobados', async ({ page }) => {
    await page.goto('/?anios=2024');
    const skip = page.getByRole('link', { name: 'Saltar intro' });
    await expect(skip).toHaveAttribute('href', '/dashboard?anios=2024');
    await skip.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/dashboard\?anios=2024/);
  });
  test('selección de escena accesible mueve el foco y mantiene el HTML', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '6. La brecha de evidencia', exact: true }).click();
    await expect(page.locator('#evidencia')).toBeFocused();
    await expect(page.locator('[data-intro-scene]')).toHaveCount(8);
  });
  test('360 px: no desborde horizontal; CTA accesible', async ({ page }, info) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: info.outputPath('intro-mobile-2d.png'), fullPage: true });
    await page.getByRole('combobox', { name: 'Ir a una escena' }).selectOption('7');
    await expect(page.getByRole('link', { name: 'Explorar dashboard', exact: true })).toBeVisible();
  });
  test('texto y cifras también existen sin JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(process.env.NATIVE_SERVER_URL || 'http://127.0.0.1:3101/');
    await expect(page.locator('[data-intro-scene]')).toHaveCount(8);
    await expect(page.locator('#eventos')).toContainText('225');
    await expect(page.getByRole('link', { name: 'Saltar intro' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    await context.close();
  });
  test('axe WCAG AA sobre la narrativa 2D', async ({ page }) => {
    await page.goto('/');
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  });
});

test('WebGL bloqueado conserva narrativa y controles', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
        return type === 'webgl' || type === 'webgl2'
          ? null
          : Reflect.apply(original, this, [type, ...args]);
      },
    });
  });
  await page.goto('/');
  await expect(page.locator('.intro-root')).toHaveAttribute('data-mode', '2d');
  await expect(page.locator('.intro-footer')).toContainText('WebGL2 no disponible');
  await expect(page.locator('[data-intro-scene]')).toHaveCount(8);
});

test.describe('WebGL real — requiere GPU/WebGL2 disponible', () => {
  test.skip(
    process.env.E2E_WEBGL !== '1',
    'Activar E2E_WEBGL=1 en un navegador con WebGL2. No se falsea la capacidad de GPU.',
  );
  test('recorrido, reposo demand, ocultación y pérdida de contexto', async ({ page }, info) => {
    await page.goto('/');
    const canvas = page.locator('[data-renderer="incimmet-three"]');
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(6500);
    await expect(page.getByTestId('mine-canvas-root')).toHaveAttribute(
      'data-render-loop',
      'demand',
    );
    await page.getByRole('button', { name: '4. Indicadores oficiales', exact: true }).click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: info.outputPath('intro-webgl.png') });
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(page.getByTestId('mine-canvas-root')).toHaveAttribute('data-render-loop', 'never');
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await canvas.evaluate((element) =>
      element.dispatchEvent(new Event('webglcontextlost', { cancelable: true })),
    );
    await expect(page.locator('.intro-root')).toHaveAttribute('data-mode', '2d');
    await expect(page.locator('[data-intro-scene]')).toHaveCount(8);
  });
});
