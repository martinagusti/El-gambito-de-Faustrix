import { expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app.js';
import { DEFAULT_POSITION } from '../shared/chess.js';

const line = { id: 'pv1', depth: 11, pvUci: ['e2e4', 'e7e5'], score: { type: 'cp', value: 24, perspective: 'white', bound: null } };
const input = { fen: DEFAULT_POSITION, baseFen: DEFAULT_POSITION, gameId: 'test', positionRevision: 7,
  movesUci: [], candidateUci: 'e2e4', question: '¿Qué gano?', level: 'beginner', recentMessages: [],
  analysis: { engineVersion: 'Stockfish test', perspective: 'white', depth: 11, bestLines: [line], candidateLine: line } };
const answer = { verdict: 'good', explanation: 'El peón ocupa el centro.', hint: '', followUpQuestion: '', verifiedLineIds: ['pv1','inventada'] };

it('valida la posición y filtra los IDs de variantes de la respuesta', async () => {
  const coach = vi.fn(async () => answer);
  const app = createApp({ coach });
  const ok = await request(app).post('/api/coach/ask').send(input).expect(200);
  expect(ok.body.verifiedLineIds).toEqual(['pv1']);
  expect(ok.body.positionRevision).toBe(7);
  await request(app).post('/api/coach/ask').send({ ...input, candidateUci: 'e2e5' }).expect(400);
  expect(coach).toHaveBeenCalledTimes(1);
});

it('informa de configuración faltante, cuota y orígenes no permitidos', async () => {
  await request(createApp()).post('/api/coach/ask').send(input).expect(503);
  const app = createApp({ coach: async () => { throw Object.assign(new Error(), { status: 429 }); } });
  await request(app).post('/api/coach/ask').send(input).expect(429);
  await request(app).post('/api/coach/ask').set('Origin', 'https://external.example').send(input).expect(403);
});


it('acepta mentores conocidos, usa Fáustrix por defecto y rechaza personajes ajenos', async () => {
  const coach = vi.fn(async () => answer);
  const app = createApp({ coach });
  await request(app).post('/api/coach/ask').send(input).expect(200);
  expect(coach.mock.calls[0][0].mentor).toBe('fausto');
  await request(app).post('/api/coach/ask').send({ ...input, mentor: 'selene' }).expect(200);
  expect(coach.mock.calls[1][0].mentor).toBe('selene');
  await request(app).post('/api/coach/ask').send({ ...input, mentor: 'desconocido' }).expect(400);
});
