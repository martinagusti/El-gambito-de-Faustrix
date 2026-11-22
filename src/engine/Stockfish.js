import { parseInfo } from './uci.js';

export class Stockfish {
  #queue = Promise.resolve();
  #worker;
  #receive;
  #fail;
  version = 'Stockfish';

  #reset() {
    this.#worker?.terminate();
    this.#worker = undefined;
  }

  async #start() {
    if (this.#worker) return;
    const response = await fetch('/engine/manifest.json');
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Stockfish no está instalado. Ejecuta npm run setup:engine.');
    }
    const { worker } = await response.json();
    this.#worker = new Worker('/engine/' + worker);
    this.#worker.onmessage = ({ data }) => String(data).split('\n').forEach(line => this.#receive?.(line.trim()));
    this.#worker.onerror = () => this.#fail?.(new Error('No se pudo iniciar Stockfish WASM'));
    await this.#exchange('uci', line => {
      if (line.startsWith('id name ')) this.version = line.slice(8);
      return line === 'uciok' ? true : undefined;
    }, 20000);
  }

  #exchange(command, parse, timeout = 12000, signal) {
    return new Promise((resolve, reject) => {
      let timer;
      const abort = () => this.#worker?.postMessage('stop');
      const finish = (error, value) => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
        this.#receive = this.#fail = undefined;
        if (error) reject(error);
        else if (signal?.aborted) reject(signal.reason);
        else resolve(value);
      };
      this.#receive = line => {
        const value = parse(line);
        if (value !== undefined) finish(null, value);
      };
      this.#fail = finish;
      timer = setTimeout(() => finish(new Error('Stockfish tardó demasiado')), timeout);
      signal?.addEventListener('abort', abort, { once: true });
      this.#worker.postMessage(command);
      if (signal?.aborted) abort();
    });
  }

  search(position, { multi = 1, skill = 20, time = 700, depth, elo, candidate, signal } = {}) {
    const job = this.#queue.then(async () => {
      signal?.throwIfAborted();
      try {
        await this.#start();
        this.#worker.postMessage('setoption name UCI_LimitStrength value ' + (elo !== undefined));
        if (elo !== undefined) this.#worker.postMessage('setoption name UCI_Elo value ' + elo);
        this.#worker.postMessage('setoption name Skill Level value ' + skill);
        this.#worker.postMessage('setoption name MultiPV value ' + multi);
        await this.#exchange('isready', line => line === 'readyok' ? true : undefined);
        signal?.throwIfAborted();
        const { baseFen, movesUci } = position;
        this.#worker.postMessage('position fen ' + baseFen + (movesUci.length ? ' moves ' + movesUci.join(' ') : ''));
        const lines = new Map();
        const command = 'go movetime ' + time + (depth ? ' depth ' + depth : '') + (candidate ? ' searchmoves ' + candidate : '');
        return await this.#exchange(command, line => {
          const info = parseInfo(line);
          if (info && info.index <= multi) lines.set(info.index, info);
          if (line.startsWith('bestmove ')) {
            return { bestmove: line.split(' ')[1], lines: [...lines.values()].sort((a, b) => a.index - b.index) };
          }
        }, 12000, signal);
      } catch (error) {
        if (error?.name !== 'AbortError') this.#reset();
        throw error;
      }
    });
    this.#queue = job.catch(() => {});
    return job;
  }
}

export const rival = new Stockfish();
export const analyst = new Stockfish();
