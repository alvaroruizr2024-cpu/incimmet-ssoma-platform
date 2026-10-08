import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test.describe('QA final responsive e hidratación', () => {
  for (const width of [360, 768, 1440])
    test(`rutas operativas sin desborde a ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(() =>
        sessionStorage.setItem(
          'incimmet-sesion-demo-v1',
          JSON.stringify({
            state: { actor: { rol: 'SSOMA corporativo', proyectoCodigo: 'EP' } },
            version: 0,
          }),
        ),
      );
      for (const ruta of ['/dashboard', '/analisis', '/lecciones', '/acciones', '/campo']) {
        await page.goto(ruta);
        await expect(page.locator('h1')).toBeVisible();
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
          .toBe(true);
      }
    });
  test('404 conserva código HTTP y no produce error de hidratación', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const response = await page.goto('/eventos/NO-EXISTE');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
    await page.waitForTimeout(750);
    expect(errors).toEqual([]);
  });
  test('tabla accesible y patrones opcionales en dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    const card = page
      .getByRole('heading', { name: 'Eventos por proyecto', exact: true })
      .locator('..')
      .locator('..');
    await card.getByRole('button', { name: 'Ver datos', exact: true }).click();
    await expect(
      card.getByRole('button', { name: 'Filtrar Cerro Lindo', exact: true }),
    ).toBeVisible();
    await card.getByRole('button', { name: 'Filtrar Cerro Lindo', exact: true }).click();
    await expect(page).toHaveURL(/proyectos/);
  });
});
test.describe('PWA real con Workbox', () => {
  test.setTimeout(120000);
  test('reporte offline, recarga y reintento idempotente', async ({ page, context }) => {
    await page.goto('/campo?origen=pwa');
    await page
      .getByRole('combobox', { name: 'Proyecto del supervisor', exact: true })
      .selectOption('EP');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.getByText('Instalación y disponibilidad sin conexión', { exact: true }).click();
    await expect(page.getByText(/Campo preparado sin conexión/)).toBeVisible({ timeout: 40000 });
    await context.setOffline(true);
    await page.getByRole('button', { name: 'Nuevo reporte de evento' }).click();
    await page
      .getByRole('textbox', { name: 'Lugar o labor', exact: true })
      .fill('Prueba automática, no real');
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    await page
      .getByRole('textbox', { name: 'Descripción del hecho', exact: true })
      .fill('Prueba automática de guardado local.');
    await page.getByLabel('Adjuntar fotos del evento', { exact: true }).setInputFiles({
      name: 'prueba.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAABgAAAAQCAIAAACDRijCAAAAHElEQVR4nGP0Lm1noAZgooopowaNGjRq0Ag2CAAfEAFnzBUrawAAAABJRU5ErkJggg==',
        'base64',
      ),
    });
    await expect(page.getByText(/JPEG sin EXIF/)).toBeVisible();
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    await page.getByLabel('¿Hubo persona afectada?').selectOption('no');
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    await page
      .getByRole('textbox', { name: 'Acciones inmediatas', exact: true })
      .fill('Prueba sin acción real.');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Guardar reporte', exact: true }).click();
    await expect(
      page.getByText('Guardado en este dispositivo · Pendiente de envío.'),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Campo · Reporte y seguimiento' }),
    ).toBeVisible();
    await page.getByRole('button', { name: /Cola \(1\)/ }).click();
    await expect(page.getByRole('heading', { name: 'Cola de reportes' })).toBeVisible();
    await context.setOffline(false);
    await expect(page.getByText('Registrado en la demo local', { exact: true })).toBeVisible({
      timeout: 20000,
    });
    await page.getByRole('button', { name: 'Reintentar pendientes', exact: true }).click();
    await expect(page.getByText('Registrado en la demo local', { exact: true })).toHaveCount(1);
    await page.goto(
      '/eventos?contexto=base%2Blocal&busqueda=Prueba%20autom%C3%A1tica%20de%20guardado%20local',
    );
    const localEvent = page.locator('a[href^="/eventos/local?id="]').first();
    await expect(localEvent).toBeVisible();
    await localEvent.click();
    await expect(page.locator('h1')).toContainText('LOCAL-');
    await expect(
      page.getByText('Prueba automática de guardado local.', { exact: true }),
    ).toBeVisible();
  });
  test('DNI impide guardar, teclado y AA en formulario', async ({ page }) => {
    await page.goto('/campo?origen=pwa');
    await page
      .getByRole('combobox', { name: 'Proyecto del supervisor', exact: true })
      .selectOption('EP');
    await page.getByRole('button', { name: 'Nuevo reporte de evento' }).click();
    await page.getByRole('textbox', { name: 'Lugar o labor', exact: true }).fill('DNI 12345678');
    await expect(page.getByRole('button', { name: 'Continuar', exact: true })).toBeDisabled();
    await page.getByRole('textbox', { name: 'Lugar o labor', exact: true }).fill('Taller');
    await page.getByRole('button', { name: 'Continuar', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: /Paso 2 de 4/ })).toBeFocused();
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(audit.violations).toEqual([]);
  });
});

test('encabezados de producción distinguen Campo de otras rutas', async ({ request }) => {
  const campo = await request.get('/campo');
  const dashboard = await request.get('/dashboard');
  expect(campo.headers()['permissions-policy']).toContain('camera=(self)');
  expect(campo.headers()['permissions-policy']).toContain('microphone=(self)');
  expect(dashboard.headers()['permissions-policy']).toContain('camera=()');
  expect(dashboard.headers()['permissions-policy']).toContain('microphone=()');
  expect(dashboard.headers()['x-content-type-options']).toBe('nosniff');
  expect(dashboard.headers()['content-security-policy']).not.toContain("'unsafe-eval'");
  const worker = await request.get('/sw.js');
  expect(worker.headers()['cache-control']).toContain('no-cache');
  expect(worker.headers()['content-security-policy']).toContain('workbox-cdn/releases/7.3.0/');
});
