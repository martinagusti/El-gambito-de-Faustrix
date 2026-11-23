import { test, expect } from '@playwright/test';

test('reproduce una jugada y conserva el silencio al recargar', async ({ page }) => {
  await page.addInitScript(() => {
    window.soundEvents = [];
    window.Audio = class {
      constructor(url) { this.url = url; }
      addEventListener() {}
      play() { window.soundEvents.push(this.url); return Promise.resolve(); }
      pause() {}
    };
  });
  await page.goto('/');
  await page.locator('[data-square="e2"]').first().click();
  await page.locator('[data-square="e4"]').first().click();
  await expect.poll(() => page.evaluate(() => window.soundEvents.includes('/sounds/move.mp3'))).toBe(true);
  await page.getByRole('button', { name: 'Opciones' }).click();
  await page.getByRole('tab', { name: 'Sonido' }).click();
  const sound = page.getByRole('switch', { name: 'Efectos de sonido' });
  await expect(sound).toBeChecked();
  await sound.uncheck();
  await page.reload();
  await page.getByRole('button', { name: 'Opciones' }).click();
  await page.getByRole('tab', { name: 'Sonido' }).click();
  await expect(page.getByRole('switch', { name: 'Efectos de sonido' })).not.toBeChecked();
  expect(await page.evaluate(() => window.soundEvents)).toEqual([]);
});

test('ofrece análisis local cuando termina la magia diaria', async ({ page }) => {
  await page.route('**/api/magic', route => route.fulfill({ json: { blocked: true, period: 'day', dailyPercent: 0 } }));
  await page.goto('/');
  await expect(page.getByText(/La magia de hoy se ha agotado/)).toBeVisible();
  await page.getByRole('button', { name: 'Ir a Análisis' }).click();
  await expect(page.getByRole('button', { name: 'Analizar posición' })).toBeVisible();
});
