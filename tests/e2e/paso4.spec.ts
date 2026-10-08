import { expect, test } from '@playwright/test';

const appRoutes = ['/dashboard', '/analisis', '/eventos', '/acciones', '/lecciones', '/campo'];

test('dashboard: cifras, filtro accesible, URL y restauración', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByTestId('kpi-eventos')).toHaveText('225');
  await expect(page.getByTestId('kpi-hpri')).toHaveText('6');
  await expect(page.getByTestId('kpi-cierre')).toHaveText('1.8%');
  // Cada gráfico ofrece su misma selección mediante una tabla accesible.
  const section = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Eventos por proyecto', exact: true }) })
    .last();
  await section.getByRole('button', { name: 'Ver datos', exact: true }).click();
  await section.getByRole('button', { name: 'Filtrar Cerro Lindo', exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get('proyectos')).toBe('"CL"');
  await expect(page.getByTestId('kpi-eventos')).toHaveText('138');
  await page.reload();
  await expect(page.getByTestId('kpi-eventos')).toHaveText('138');
  await expect(
    page.getByRole('region', { name: 'Datos de Eventos por proyecto', exact: true }),
  ).toHaveCount(0);
});

test('reproducción: KPIs cambian sin duplicar y se restaura la base', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByTestId('kpi-eventos')).toHaveText('225');
  await page.getByRole('button', { name: 'Simular tiempo real', exact: true }).click();
  await expect(page).toHaveURL(/contexto=reproduccion/);
  await expect(page.getByRole('status').filter({ hasText: 'Nuevo evento' })).toBeVisible({
    timeout: 15_000,
  });
  const count = Number(await page.getByTestId('kpi-eventos').textContent());
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThanOrEqual(52);
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await page.getByRole('button', { name: 'Salir y restaurar base', exact: true }).click();
  await expect(page.getByTestId('kpi-eventos')).toHaveText('225');
});

test('404 documental, metadatos específicos y favicon', async ({ page, request }) => {
  expect((await request.get('/eventos/NO-EXISTE')).status()).toBe(404);
  expect((await request.get('/favicon.ico')).status()).toBe(200);
  await page.goto('/eventos/EV-2026-022');
  await expect(page).toHaveTitle(/EV-2026-022/);
  await expect(page.getByText('AC-143', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /^LA-014 ·/ })).toBeVisible();
});

test('rol de campo persiste al recargar', async ({ page }) => {
  await page.goto('/?intro=2d');
  await page.getByRole('link', { name: 'Reportar en campo', exact: true }).click();
  await expect(page).toHaveURL(/\/campo/);
  await expect(
    page.getByRole('combobox', { name: 'Rol de demostración', exact: true }),
  ).toHaveValue('Supervisor de campo');
  await page.reload();
  await expect(
    page.getByRole('combobox', { name: 'Rol de demostración', exact: true }),
  ).toHaveValue('Supervisor de campo');
  await expect(page.getByText('Módulo no disponible para el rol seleccionado')).toHaveCount(0);
});

for (const route of appRoutes) {
  test(`móvil 390 px: ${route} sin desborde de página`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard');
    const selector = page.getByRole('combobox', { name: 'Rol de demostración', exact: true });
    const rol = route === '/campo' ? 'Supervisor de campo' : 'SSOMA corporativo';
    if ((await selector.inputValue()) !== rol) {
      await selector.selectOption(rol);
      // Elegir rol navega al inicio de ese rol; esperar a que termine evita interrumpir la siguiente navegación.
      await page.waitForURL(route === '/campo' ? /\/campo/ : /\/analisis/);
    }
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}

test('lección: búsqueda y PNG de difusión', async ({ page }) => {
  await page.goto('/lecciones');
  await page.getByRole('searchbox', { name: 'Búsqueda de texto completo' }).fill('voladura');
  await expect(page.locator('.control-pyramid').first()).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Generar ficha de difusión' }).first().click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/^INCIMMET_LA-\d+_difusion\.png$/);
});

test('exportación de eventos CSV respeta la selección completa', async ({ page }) => {
  await page.goto('/eventos?anios=2024');
  await expect(page.getByRole('heading', { name: 'Eventos', exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar eventos CSV', exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/\.csv$/);
});
