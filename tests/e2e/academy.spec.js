import { test, expect } from '@playwright/test';

const at = (page, square) => page.locator('[data-square="' + square + '"]').first();

test('Stockfish responde y la partida persiste tras recargar', async ({ page }) => {
  await page.goto('/');
  await at(page, 'e2').click();
  await at(page, 'e4').click();
  await expect(page.getByText('Turno de blancas')).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Controles e historial' }).click();
  await expect(page.locator('.moves button')).toHaveCount(2);
  await page.reload();
  await page.getByRole('button', { name: 'Controles e historial' }).click();
  await expect(page.locator('.moves button')).toHaveCount(2);
});

test('abrir y cerrar una variante real preserva la posición inicial en móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Preparar jugada' }).click();
  await at(page, 'g1').click();
  await at(page, 'f3').click();
  await expect(page.getByText('Candidata · Nf3')).toBeVisible();
  await page.getByRole('button', { name: 'Análisis', exact: true }).last().click();
  await page.getByRole('button', { name: 'Analizar posición' }).click();
  await expect(page.locator('.line-grid button').first()).toBeVisible({ timeout: 30000 });
  await page.locator('.line-grid button').first().click();
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await page.getByRole('button', { name: 'Volver a la partida' }).click();
  await expect(at(page, 'g1').locator('img')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
