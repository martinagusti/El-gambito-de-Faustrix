import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const SCALE = 1_000_000_000;
function number(env, key, fallback, allowZero = false) {
  const raw = env[key];
  const value = raw === undefined || raw === '' ? fallback : Number(raw);
  if (!Number.isFinite(value) || value < 0 || (!allowZero && value === 0)) throw new Error('Configuración inválida: ' + key);
  return value;
}
function currentDay(date, zone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export class MagicLimitError extends Error {
  constructor(period) { super(period === 'month' ? 'No queda magia suficiente para otra consulta este mes.' : 'No queda magia suficiente para otra consulta hoy.'); this.period = period; this.code = 'MAGIC_LIMIT'; }
}
export function createMagicBudget(env = process.env, { now = () => new Date(), databasePath } = {}) {
  const config = {
    monthly: number(env, 'MAGIC_MONTHLY_LIMIT_EUR', 2),
    input: number(env, 'MAGIC_INPUT_USD_PER_MILLION', 0.25, true),
    cached: number(env, 'MAGIC_CACHED_INPUT_USD_PER_MILLION', 0.025, true),
    output: number(env, 'MAGIC_OUTPUT_USD_PER_MILLION', 2, true),
    usdPerEur: number(env, 'MAGIC_USD_PER_EUR', 1.099),
    multiplier: number(env, 'MAGIC_COST_MULTIPLIER', 1),
    timezone: env.MAGIC_TIMEZONE || 'Europe/Madrid',
    model: env.AZURE_OPENAI_DEPLOYMENT?.trim() || 'No configurado',
  };
  if (config.cached > config.input || config.input === 0 || config.output === 0) throw new Error('Las tarifas de magia no son válidas.');
  currentDay(now(), config.timezone);
  const filename = databasePath ?? resolve(env.MAGIC_DB_PATH || './data/magic.sqlite');
  if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS magic_usage (
      id TEXT PRIMARY KEY, day TEXT NOT NULL, model TEXT NOT NULL,
      status TEXT NOT NULL, cost INTEGER NOT NULL, input_tokens INTEGER NOT NULL DEFAULT 0,
      cached_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS magic_usage_day ON magic_usage(day);`);
  const queryMonth = db.prepare("SELECT day, status, cost, input_tokens, cached_tokens, output_tokens FROM magic_usage WHERE day >= ? AND day < ?");
  const insert = db.prepare('INSERT INTO magic_usage(id, day, model, status, cost) VALUES (?, ?, ?, ?, ?)');
  const finish = db.prepare('UPDATE magic_usage SET status = ?, cost = ?, input_tokens = ?, cached_tokens = ?, output_tokens = ? WHERE id = ?');
  function totals() {
    const day = currentDay(now(), config.timezone), [y, m, d] = day.split('-').map(Number);
    const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const month = day.slice(0, 7), rows = queryMonth.all(month + '-01', next);
    const monthCost = rows.reduce((sum, row) => sum + row.cost, 0);
    const todayCost = rows.filter(row => row.day === day).reduce((sum, row) => sum + row.cost, 0);
    const daysLeft = new Date(Date.UTC(y, m, 0)).getUTCDate() - d + 1;
    const limit = Math.floor(config.monthly * SCALE);
    const dailyLimit = Math.max(0, Math.floor((limit - (monthCost - todayCost)) / daysLeft));
    return { day, month, rows, monthCost, todayCost, limit, dailyLimit };
  }
  function status() {
    const t = totals();
    const sum = (key) => t.rows.reduce((n, row) => n + row[key], 0);
    const available = Math.max(0, Math.min(t.limit - t.monthCost, t.dailyLimit - t.todayCost));
    return { day: t.day, month: t.month, timezone: config.timezone, model: config.model,
      monthlyLimit: t.limit / SCALE, monthSpent: t.monthCost / SCALE,
      dailyLimit: t.dailyLimit / SCALE, todaySpent: t.todayCost / SCALE,
      dailyRemaining: available / SCALE, dailyPercent: t.dailyLimit ? Math.max(0, Math.min(100, available / t.dailyLimit * 100)) : 0,
      inputTokens: sum('input_tokens'), cachedTokens: sum('cached_tokens'), outputTokens: sum('output_tokens'),
      calls: t.rows.filter(row => row.status !== 'reserved').length,
      uncertainCalls: t.rows.filter(row => row.status !== 'measured').length,
      rates: { input: config.input, cached: config.cached, output: config.output, usdPerEur: config.usdPerEur, multiplier: config.multiplier },
      blocked: available <= 0, period: t.monthCost >= t.limit ? 'month' : 'day' };
  }
  function units(input, cached, output) {
    return Math.ceil(((input - cached) * config.input + cached * config.cached + output * config.output) / 1_000_000 / config.usdPerEur * config.multiplier * SCALE);
  }
  async function run({ inputBytes, maxOutput }, action) {
    if (!Number.isSafeInteger(inputBytes) || inputBytes < 0 || !Number.isSafeInteger(maxOutput) || maxOutput <= 0) throw new Error('Reserva de magia inválida.');
    // Un byte por token es una cota conservadora, con margen para el esquema y el mensaje adicional.
    const reserve = units(inputBytes + 8192, 0, maxOutput);
    const id = randomUUID();
    db.exec('BEGIN IMMEDIATE');
    try {
      const t = totals();
      if (t.monthCost + reserve > t.limit) throw new MagicLimitError('month');
      if (t.todayCost + reserve > t.dailyLimit) throw new MagicLimitError('day');
      insert.run(id, t.day, config.model, 'reserved', reserve);
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
    try {
      const result = await action();
      const usage = result?.usage;
      const input = usage?.input_tokens, cached = usage?.input_tokens_details?.cached_tokens ?? 0, output = usage?.output_tokens;
      if ([input, cached, output].every(Number.isSafeInteger) && input >= 0 && cached >= 0 && cached <= input && output >= 0) {
        finish.run('measured', units(input, cached, output), input, cached, output, id);
      } else finish.run('estimated', reserve, 0, 0, 0, id);
      return result;
    } catch (error) {
      // Una petición fallida o cancelada puede haberse facturado; no liberamos su reserva.
      finish.run('estimated', reserve, 0, 0, 0, id);
      throw error;
    }
  }
  return { run, status, close: () => db.close() };
}
