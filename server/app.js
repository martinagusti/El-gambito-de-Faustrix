import express from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { answerSchema, validateRequest } from './contract.js';

export function createApp({ coach = null, env = process.env } = {}) {
  const app = express();
  app.disable('x-powered-by');
  const origins = new Set((env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(item => item.trim()));
  app.use('/api', (req, res, next) => {
    const origin = req.get('origin');
    if (origin && !origins.has(origin) && !['http://localhost:', 'http://127.0.0.1:'].some(base => origin === base + (env.PORT || 3001))) {
      return res.status(403).json({ error: 'Origen no permitido' });
    }
    if (origin) res.set('Access-Control-Allow-Origin', origin).vary('Origin');
    if (req.method === 'OPTIONS') return res.set({ 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type' }).sendStatus(204);
    next();
  });
  app.use('/api', express.json({ limit: '32kb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', coachConfigured: Boolean(coach) }));
  let active = 0;
  let used = 0;
  let windowStart = Date.now();
  app.post('/api/coach/ask', async (req, res) => {
    if (!coach) return res.status(503).json({ error: 'Revisa AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY y AZURE_OPENAI_DEPLOYMENT en el servidor.' });
    let input;
    try { input = validateRequest(req.body); }
    catch { return res.status(400).json({ error: 'La posición o el análisis no son válidos.' }); }
    if (Date.now() - windowStart >= 60000) { used = 0; windowStart = Date.now(); }
    if (used >= (Number(env.COACH_REQUESTS_PER_MINUTE) || 12) || active >= (Number(env.COACH_MAX_CONCURRENT) || 2)) {
      return res.status(429).json({ error: 'Límite de consultas alcanzado. Inténtalo en un momento.' });
    }
    used += 1;
    active += 1;
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), Number(env.COACH_TIMEOUT_MS) || 20000);
    const disconnect = () => { if (!res.writableEnded) abort.abort(); };
    res.on('close', disconnect);
    try {
      const answer = answerSchema.parse(await coach(input, abort.signal));
      if (!res.destroyed) res.json({ ...answer, positionRevision: input.positionRevision,
        verifiedLineIds: [...new Set(answer.verifiedLineIds.filter(id => input.lineIds.includes(id)))] });
    } catch (error) {
      if (res.destroyed) return;
      if (error.status === 429) return res.status(429).json({ error: 'Azure OpenAI alcanzó la cuota del despliegue. Inténtalo en un momento.' });
      if (abort.signal.aborted) return res.status(504).json({ error: 'El profesor tardó demasiado.' });
      res.status(502).json({ error: 'El profesor no pudo responder. Puedes seguir usando el análisis local.' });
    } finally {
      active -= 1;
      clearTimeout(timer);
      res.off('close', disconnect);
    }
  });
  if (existsSync(resolve('dist/index.html'))) app.use(express.static(resolve('dist')));
  app.use((error, _req, res, _next) => res.status(error.status === 413 ? 413 : 400).json({ error: 'Solicitud demasiado grande o inválida.' }));
  return app;
}
