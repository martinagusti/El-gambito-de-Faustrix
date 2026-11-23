import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createMagicBudget } from '../server/magicBudget.js';

const dirs = [];
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });
const usage = { input_tokens: 1000, input_tokens_details: { cached_tokens: 400 }, output_tokens: 100 };
const clock = () => new Date('2026-11-15T12:00:00Z');
function setup(env = {}, opts = {}) { return createMagicBudget({ MAGIC_MONTHLY_LIMIT_EUR: '2', ...env }, { databasePath: ':memory:', now: clock, ...opts }); }

it('contabiliza entrada, caché y salida con sus tarifas reales y guarda el coste', async () => {
  const budget = setup();
  await budget.run({ inputBytes: 100, maxOutput: 900 }, async () => ({ usage }));
  const state = budget.status();
  expect(state.monthSpent).toBeCloseTo((600 * .25 + 400 * .025 + 100 * 2) / 1e6 / 1.099, 8);
  expect(state).toMatchObject({ inputTokens: 1000, cachedTokens: 400, outputTokens: 100, calls: 1, uncertainCalls: 0, day: '2026-11-15' });
  budget.close();
});

it('reserva de forma atómica entre dos instancias y libera el exceso al medir', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'fausto-magic-')); dirs.push(dir); const databasePath = join(dir, 'budget.sqlite');
  const opts = { databasePath, now: clock }, env = { MAGIC_MONTHLY_LIMIT_EUR: '0.09' };
  const a = createMagicBudget(env, opts), b = createMagicBudget(env, opts);
  let release; const pending = a.run({ inputBytes: 100, maxOutput: 900 }, () => new Promise(resolve => { release = resolve; }));
  await expect(b.run({ inputBytes: 100, maxOutput: 900 }, async () => ({ usage }))).rejects.toMatchObject({ code: 'MAGIC_LIMIT' });
  expect(b.status().uncertainCalls).toBe(1);
  release({ usage }); await pending;
  await b.run({ inputBytes: 100, maxOutput: 900 }, async () => ({ usage }));
  expect(a.status().calls).toBe(2); a.close(); b.close();
});

it('conserva la reserva como estimación si la llamada se cancela o no informa tokens', async () => {
  const budget = setup();
  await expect(budget.run({ inputBytes: 100, maxOutput: 900 }, async () => { throw new Error('cancelada'); })).rejects.toThrow('cancelada');
  const reserved = budget.status(); expect(reserved.uncertainCalls).toBe(1); expect(reserved.monthSpent).toBeGreaterThan(0);
  await budget.run({ inputBytes: 100, maxOutput: 900 }, async () => ({}));
  expect(budget.status().uncertainCalls).toBe(2); budget.close();
});

it('resta el gasto anterior y reparte el presupuesto restante según los días del mes', async () => {
  let date = new Date('2026-11-01T12:00:00Z'); const budget = setup({}, { now: () => date });
  await budget.run({ inputBytes: 1, maxOutput: 900 }, async () => ({ usage }));
  const first = budget.status(); date = new Date('2026-11-02T12:00:00Z'); const second = budget.status();
  expect(second.todaySpent).toBe(0); expect(second.monthSpent).toBe(first.monthSpent);
  expect(second.dailyLimit).toBeCloseTo((2 - first.monthSpent) / 29, 7);
  date = new Date('2026-12-01T12:00:00Z'); expect(budget.status().monthSpent).toBe(0); budget.close();
});


it('conserva el consumo tras reiniciar el proceso', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'fausto-magic-')); dirs.push(dir);
  const options = { databasePath: join(dir, 'magic.sqlite'), now: clock };
  const first = createMagicBudget({}, options);
  await first.run({ inputBytes: 100, maxOutput: 900 }, async () => ({ usage }));
  const previous = first.status(); first.close();
  const second = createMagicBudget({}, options);
  expect(second.status().monthSpent).toBe(previous.monthSpent);
  expect(second.status().inputTokens).toBe(1000);
  second.close();
});
