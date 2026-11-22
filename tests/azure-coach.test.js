import { afterEach, expect, it, vi } from 'vitest';
import { createCoach } from '../server/coach.js';

const env = {
  AZURE_OPENAI_API_KEY: 'clave-de-prueba',
  AZURE_OPENAI_ENDPOINT: 'https://academia.openai.azure.com/openai/v1/',
  AZURE_OPENAI_DEPLOYMENT: 'profesor-ajedrez',
  AZURE_OPENAI_REASONING_EFFORT: 'minimal',
};

afterEach(() => vi.unstubAllGlobals());

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
