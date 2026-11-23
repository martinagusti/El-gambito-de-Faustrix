import { test, expect } from '@playwright/test';

const initial = { id: 'result-test', mode: 'local', color: 'w', difficulty: 'intermediate',
  baseFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', moves: ['f2f3', 'e7e5', 'g2g4'] };

test('anuncia el mate con retraso y permite comenzar otra partida', async ({ page }) => {
  await page.addInitScript(game => localStorage.setItem('golden-library.game.v1', JSON.stringify(game)), initial);
  await page.goto('/');
  await page.locator('[data-square="d8"]').first().click();
  await page.locator('[data-square="h4"]').first().click();
  const dialog = page.getByRole('dialog', { name: '¡Jaque mate!' });
  await expect(dialog).toBeHidden();
  await expect(dialog).toBeVisible({ timeout: 5000 });
  await expect(dialog.getByText('La partida ha terminado. Ganan las negras.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Nueva partida' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Partida de dos jugadores')).toBeVisible();
  await expect(page.getByText('0 / 0')).toBeVisible();
});

test('permite cerrar el resultado y revisar la partida', async ({ page }) => {
  await page.addInitScript(game => localStorage.setItem('golden-library.game.v1', JSON.stringify(game)), initial);
  await page.goto('/');
  await page.locator('[data-square="d8"]').first().click();
  await page.locator('[data-square="h4"]').first().click();
  const dialog = page.getByRole('dialog', { name: '¡Jaque mate!' });
  await expect(dialog).toBeVisible({ timeout: 5000 });
  await dialog.getByRole('button', { name: 'Salir' }).click();
  await page.getByRole('button', { name: 'Jugada anterior' }).click();
  await expect(page.getByText('3 / 4')).toBeVisible();
  await expect(dialog).toBeHidden();
});
