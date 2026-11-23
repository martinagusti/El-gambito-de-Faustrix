import { afterEach, expect, it, vi } from 'vitest';
import { createCoach } from '../server/coach.js';
import { createMagicBudget } from '../server/magicBudget.js';
import { childAnswerIssue, generalAnswerIssue } from '../server/childAnswer.js';
import { validateRequest } from '../server/contract.js';

const env = {
  AZURE_OPENAI_API_KEY: 'clave-de-prueba',
  AZURE_OPENAI_ENDPOINT: 'https://academia.openai.azure.com/openai/v1/',
  AZURE_OPENAI_DEPLOYMENT: 'profesor-ajedrez',
  AZURE_OPENAI_REASONING_EFFORT: 'minimal',
};

afterEach(() => vi.unstubAllGlobals());

it('acepta explicaciones largas o técnicas y protege las pistas infantiles', () => {
  const answer = explanation => ({ explanation, hint: '', followUpQuestion: '' });
  expect(childAnswerIssue(answer('Prepara el enroque.'), false)).toBe('');
  expect(generalAnswerIssue(answer('Stockfish recomienda esta jugada.'), 'intermediate', false)).toBe('');
  expect(generalAnswerIssue(answer('palabra '.repeat(200)), 'intermediate', false)).toBe('');
  expect(childAnswerIssue({ ...answer(''), hint: 'Juega Nf3.' }, true)).toBeTruthy();
});

it('adapta nombres internos y conserva la respuesta sin otra llamada', async () => {
  const answer = { verdict: 'good', explanation: 'Según Stockfish, signals.attackedPieces muestra que tu peón está atacado.', hint: '', followUpQuestion: '', verifiedLineIds: [] };
  const response = value => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] });
  const fetch = vi.fn().mockResolvedValueOnce(response(answer));
  vi.stubGlobal('fetch', fetch);
  const result = await createCoach(env)({ question: '¿Qué amenaza mi rival?', level: 'beginner' });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(result.explanation).toContain('mi análisis');
  expect(result.explanation).toContain('las piezas atacadas');
  expect(result.explanation).toContain('tu peón está atacado');
});

it('entrega una respuesta larga y solo registra una llamada con sus tokens', async () => {
  const answer = { verdict: 'good', explanation: 'Esta jugada ayuda a tus piezas. '.repeat(50), hint: '', followUpQuestion: '', verifiedLineIds: [] };
  const fetch = vi.fn(async () => Response.json({ status: 'completed', usage: { input_tokens: 500, input_tokens_details: { cached_tokens: 0 }, output_tokens: 200, total_tokens: 700 }, output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer) }] }] }));
  vi.stubGlobal('fetch', fetch);
  const budget = createMagicBudget(env, { databasePath: ':memory:' });
  try {
    const result = await createCoach(env, budget)({ question: '¿Por qué es buena?', level: 'intermediate' });
    expect(result.explanation).toBe(answer.explanation);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(budget.status()).toMatchObject({ calls: 1, inputTokens: 500, outputTokens: 200 });
  } finally { budget.close(); }
});

it('tras dos rechazos explica solo hechos comprobados de la candidata y registra el motivo sin contenido privado', async () => {
  const fen = '4k3/3p4/8/8/8/8/8/3QK3 w - - 0 1';
  const entry = { id: 'pv1', depth: 10, pvUci: ['d1d7', 'e8d7'], score: { type: 'cp', value: 0, perspective: 'white', bound: null } };
  const input = validateRequest({ gameId: 'test', positionRevision: 0, fen, baseFen: fen, movesUci: [], candidateUci: 'd1d7',
    question: '¿Qué tiene de buena o arriesgada la jugada Qxd7+? Explica qué podría responder el rival.', level: 'beginner', mentor: 'fausto', recentMessages: [],
    analysis: { engineVersion: 'test', perspective: 'white', depth: 10, bestLines: [entry], candidateLine: entry } });
  const bad = { verdict: 'good', explanation: '', hint: '', followUpQuestion: '', verifiedLineIds: [] };
  const fetch = vi.fn(async () => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(bad) }] }] }));
  vi.stubGlobal('fetch', fetch);
  const log = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const result = await createCoach(env)(input);
    expect(result.explanation).toContain('Qxd7+');
    expect(result.explanation).toContain('captura un peón y da jaque');
    expect(result.explanation).toContain('Kxd7');
    expect(result.explanation).toContain('No puedo precisar');
    expect(result.verifiedLineIds).toEqual(['pv1']);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(log.mock.calls)).not.toContain(input.question);
  } finally { log.mockRestore(); }
});

it('no inventa una explicación de la candidata ante una pregunta diferente', async () => {
  const { candidateFallback } = await import('../server/coachFallback.js');
  expect(candidateFallback({ question: '¿Qué es un gambito?', candidateUci: 'd1d7', analysis: { bestLines: [] } })).toBeNull();
});

it('envía la consulta a Azure v1 con el nombre de despliegue y analiza el JSON', async () => {
  const answer = { verdict: 'good', explanation: 'Controlas el centro.', hint: '', followUpQuestion: '', verifiedLineIds: [] };
  const fetch = vi.fn(async () => Response.json({
    status: 'completed',
    output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer) }] }],
  }));
  vi.stubGlobal('fetch', fetch);
  expect(await createCoach(env)({ question: '¿Qué aporta?' })).toEqual(answer);
  const [url, request] = fetch.mock.calls[0];
  expect(String(url)).toBe('https://academia.openai.azure.com/openai/v1/responses');
  expect(JSON.parse(request.body)).toMatchObject({
    model: 'profesor-ajedrez', store: false, reasoning: { effort: 'minimal' },
    text: { format: { type: 'json_schema' } },
  });
});

it('mantiene el profesor desactivado si falta un valor o se utiliza la URL del proyecto', () => {
  expect(createCoach({ ...env, AZURE_OPENAI_DEPLOYMENT: '' })).toBeNull();
  expect(createCoach({ ...env, AZURE_OPENAI_ENDPOINT: 'https://academia.services.ai.azure.com/api/projects/ajedrez' })).toBeNull();
});


it('utiliza el estilo del mentor elegido en las instrucciones a Azure', async () => {
  const answer = { verdict: 'good', explanation: 'Controlas el centro.', hint: '', followUpQuestion: '', verifiedLineIds: [] };
  const fetch = vi.fn(async () => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer) }] }] }));
  vi.stubGlobal('fetch', fetch);
  await createCoach(env)({ question: 'Una idea', mentor: 'selene' });
  expect(JSON.parse(fetch.mock.calls[0][1].body).instructions).toContain('Eres Selene');
});


it('envía instrucciones infantiles y evita presentar variantes como hechos ciertos', async () => {
  const answer = { verdict: 'uncertain', explanation: '', hint: 'Mira tus piezas.', followUpQuestion: '', verifiedLineIds: [] };
  const fetch = vi.fn(async () => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer) }] }] }));
  vi.stubGlobal('fetch', fetch);
  await createCoach(env)({ question: 'Dame una pista.', level: 'firstSteps' });
  const prompt = JSON.parse(fetch.mock.calls[0][1].body).instructions;
  expect(prompt).toContain('niño de 5 a 7 años');
  expect(prompt).toContain('No uses letras o números de casillas');
  expect(prompt).toContain('no prueba que será la respuesta del rival');
});


it('reintenta respuestas técnicas para niños y oculta los datos internos de la pista', async () => {
  const first = { verdict: 'good', explanation: 'Interno pv1', hint: 'Juega Nf3 y enrócate.', followUpQuestion: '', verifiedLineIds: ['pv1'] };
  const second = { verdict: 'good', explanation: 'Detalle interno', hint: '¿Puedes sacar una pieza para proteger a tu rey?', followUpQuestion: 'Siguiente', verifiedLineIds: ['pv1'] };
  const fetch = vi.fn().mockImplementationOnce(async () => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(first) }] }] }))
    .mockImplementationOnce(async () => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(second) }] }] }));
  vi.stubGlobal('fetch', fetch);
  const result = await createCoach(env)({ question: 'Dame una pista.', level: 'firstSteps' });
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(result).toMatchObject({ explanation: '', hint: second.hint, followUpQuestion: '', verifiedLineIds: [] });
});

it('conserva una respuesta infantil aunque contenga notación', async () => {
  const answer = { verdict: 'good', explanation: 'Juega Nf3.', hint: '', followUpQuestion: '', verifiedLineIds: ['pv1'] };
  const fetch = vi.fn(async () => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer) }] }] }));
  vi.stubGlobal('fetch', fetch);
  const result = await createCoach(env)({ question: '¿Qué puedo hacer?', level: 'firstSteps' });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(result.explanation).toContain('Nf3');
});


it('acepta una pista infantil concreta con palabras sencillas', async () => {
  const answer = { verdict: 'good', explanation: '', hint: 'Mueve el peón delante del rey dos casillas.', followUpQuestion: '', verifiedLineIds: [] };
  const fetch = vi.fn(async () => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer) }] }] }));
  vi.stubGlobal('fetch', fetch);
  const result = await createCoach(env)({ question: 'Dame una pista.', level: 'firstSteps' });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(result.hint).toContain('dos casillas');
});


it('si faltan respuestas, puede dar una jugada sencilla calculada por el servidor', async () => {
  const answer = { verdict: 'good', explanation: '', hint: '', followUpQuestion: '', verifiedLineIds: [] };
  const fetch = vi.fn(async () => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer) }] }] }));
  vi.stubGlobal('fetch', fetch);
  const result = await createCoach(env)({ question: '¿Qué debería hacer?', level: 'firstSteps', analysis: { bestLines: [{ facts: { childMove: 'Mover el peón delante de la dama 1 paso(s) hacia delante' } }] } });
  expect(result.explanation).toBe('Una posibilidad es mover el peón delante de la dama un paso hacia delante.');
  expect(result.verdict).toBe('uncertain');
});


it('responde a una pregunta inequívoca sobre la hora con el personaje sin consultar Azure', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  const result = await createCoach(env)({ question: 'Dime qué hora es', level: 'firstSteps', mentor: 'selene' });
  expect(result.verdict).toBe('out_of_scope');
  expect(result.explanation).toContain('estrellas');
  expect(result.verifiedLineIds).toEqual([]);
  expect(fetch).not.toHaveBeenCalled();
});

it('usa la clasificación del modelo para otros temas y devuelve el mensaje del mentor', async () => {
  const answer = { verdict: 'out_of_scope', explanation: 'La hora es', hint: 'Nf3', followUpQuestion: '', verifiedLineIds: ['pv1'] };
  const fetch = vi.fn(async () => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer) }] }] }));
  vi.stubGlobal('fetch', fetch);
  const result = await createCoach(env)({ question: '¿Qué tiempo hace?', level: 'beginner', mentor: 'broin' });
  expect(result.verdict).toBe('out_of_scope');
  expect(result.explanation).toContain('taller');
  expect(result.hint).toBe('');
  expect(result.verifiedLineIds).toEqual([]);
});

it('permite preguntas de ajedrez con la palabra hora', async () => {
  const answer = { verdict: 'good', explanation: 'Puedes preparar el enroque.', hint: '', followUpQuestion: '', verifiedLineIds: [] };
  const fetch = vi.fn(async () => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer) }] }] }));
  vi.stubGlobal('fetch', fetch);
  expect(await createCoach(env)({ question: '¿Es hora de enrocar?', level: 'beginner' })).toEqual(answer);
  expect(fetch).toHaveBeenCalledTimes(1);
});


it('no adjunta variantes de la partida a explicaciones generales de ajedrez', async () => {
  const answer = { verdict: 'general_chess', explanation: 'Un gambito ofrece una pieza o un peón para buscar una ventaja.', hint: '', followUpQuestion: '', verifiedLineIds: ['pv1'] };
  const fetch = vi.fn(async () => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer) }] }] }));
  vi.stubGlobal('fetch', fetch);
  const result = await createCoach(env)({ question: '¿Qué es un gambito?', level: 'beginner' });
  expect(result.explanation).toContain('gambito');
  expect(result.verifiedLineIds).toEqual([]);
});


it('registra cada intento de Azure, también respuestas fuera de alcance', async () => {
  const answer = { verdict: 'out_of_scope', explanation: '', hint: '', followUpQuestion: '', verifiedLineIds: [] };
  const fetch = vi.fn(async () => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer) }] }] }));
  vi.stubGlobal('fetch', fetch);
  const budget = { run: vi.fn(async (_reserve, action) => action()) };
  const result = await createCoach(env, budget)({ question: '¿Qué clima hace?', level: 'beginner' });
  expect(result.verdict).toBe('out_of_scope');
  expect(budget.run).toHaveBeenCalledTimes(1);
  expect(budget.run.mock.calls[0][0].inputBytes).toBeGreaterThan(0);
});


it('acumula tokens de ambas llamadas cuando se reintenta una respuesta', async () => {
  const bad = { verdict: 'good', explanation: '', hint: 'Juega Nf3.', followUpQuestion: '', verifiedLineIds: [] };
  const good = { verdict: 'good', explanation: '', hint: 'Mira tus piezas.', followUpQuestion: '', verifiedLineIds: [] };
  const response = value => Response.json({ status: 'completed', usage: { input_tokens: 1000, input_tokens_details: { cached_tokens: 100 }, output_tokens: 100, output_tokens_details: { reasoning_tokens: 0 }, total_tokens: 1100 }, output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] });
  const fetch = vi.fn().mockImplementationOnce(async () => response(bad)).mockImplementationOnce(async () => response(good));
  vi.stubGlobal('fetch', fetch);
  const budget = createMagicBudget(env, { databasePath: ':memory:' });
  try {
    await createCoach(env, budget)({ question: 'Dame una pista.', level: 'firstSteps' });
    expect(budget.status()).toMatchObject({ calls: 2, inputTokens: 2000, cachedTokens: 200, outputTokens: 200, uncertainCalls: 0 });
  } finally { budget.close(); }
});


it('acepta una pista concreta con casilla sin reintentar', async () => {
  const answer = { verdict: 'good', explanation: '', hint: 'Piensa en llevar el caballo a f3.', followUpQuestion: '', verifiedLineIds: [] };
  const fetch = vi.fn(async () => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer) }] }] }));
  vi.stubGlobal('fetch', fetch);
  const result = await createCoach(env)({ question: 'Dame una pista.', level: 'intermediate' });
  expect(result.hint).toBe(answer.hint);
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('usa una recomendación verificada cuando no hay pista útil', async () => {
  const answer = { verdict: 'good', explanation: '', hint: '', followUpQuestion: '', verifiedLineIds: [] };
  const fetch = vi.fn(async () => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer) }] }] }));
  vi.stubGlobal('fetch', fetch);
  const result = await createCoach(env)({ question: 'Dame una pista.', level: 'intermediate', analysis: { bestLines: [{ moveSan: 'Nf3' }] } });
  expect(result.hint).toContain('Nf3');
  expect(result.hint).not.toContain('Pista general');
});
