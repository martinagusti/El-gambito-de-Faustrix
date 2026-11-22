import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const version = '18.0.5';
const worker = 'stockfish-18-lite-single.js';
const wasm = 'stockfish-18-lite-single.wasm';
const output = resolve('public/engine');
const files = [
  { name: worker, path: 'bin/' + worker, valid: bytes => bytes.length > 10000 && !bytes.toString().trimStart().startsWith('<') },
  { name: wasm, path: 'bin/' + wasm, valid: bytes => bytes.length > 7000000 && bytes.subarray(0, 8).equals(Buffer.from([0, 97, 115, 109, 1, 0, 0, 0])) },
  { name: 'Copying.txt', path: 'Copying.txt', valid: bytes => bytes.includes('GNU GENERAL PUBLIC LICENSE') },
];
const sources = [
  'https://cdn.jsdelivr.net/npm/stockfish@' + version + '/',
  'https://unpkg.com/stockfish@' + version + '/',
];

async function install({ name, path, valid }) {
  const destination = resolve(output, name);
  const installed = await readFile(destination).catch(() => null);
  if (installed && valid(installed)) return;
  const temp = destination + '.' + process.pid + '.tmp';
  for (const source of sources) {
    try {
      const response = await fetch(source + path, { signal: AbortSignal.timeout(25000) });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!valid(bytes)) throw new Error('archivo incompleto o inválido');
      await writeFile(temp, bytes);
      await rename(temp, destination);
      return;
    } catch (error) {
      await rm(temp, { force: true });
      console.warn(new URL(source).host + ' · ' + name + ' · ' + (error.cause?.code || error.message));
    }
  }
  throw new Error('No se pudo descargar ' + name);
}

try {
  await mkdir(output, { recursive: true });
  for (const file of files) await install(file);
  await writeFile(resolve(output, 'SOURCE.txt'), [
    'Stockfish ' + version + ' (Lite Single), unmodified, licensed under GPLv3.',
    'Source and build instructions: https://github.com/nmrugg/stockfish.js',
    'Upstream: https://github.com/official-stockfish/Stockfish',
    'Package: https://www.npmjs.com/package/stockfish/v/' + version,
    '',
  ].join('\n'));
  await writeFile(resolve(output, 'manifest.json'), JSON.stringify({ worker, version }));
  console.log('Stockfish ' + version + ' Lite Single preparado.');
} catch (error) {
  console.error(error.message + '. Vuelve a ejecutar npm run setup:engine cuando tengas conexión.');
  process.exitCode = 1;
}
