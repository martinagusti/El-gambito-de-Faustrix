import { Chess } from 'chess.js';
import { analyst } from './Stockfish.js';
import { playUci, verifyLine } from '../../shared/chess.js';

const cache = new Map();
const roots = new Map();

function facts(fen, candidate) {
  const game = new Chess(fen);
  const material = { white: {}, black: {} };
  game.board().flat().filter(Boolean).forEach(({ color, type }) => {
    const side = material[color === 'w' ? 'white' : 'black'];
    side[type] = (side[type] ?? 0) + 1;
  });
  const signals = [{ material, inCheck: game.isCheck() }];
  if (candidate) {
    const move = playUci(game, candidate);
    signals.push({ move: move.san, piece: move.piece, captured: move.captured, givesCheck: game.isCheck(),
      opponentLegalCaptures: game.moves({ verbose: true }).filter(item => item.captured).map(item => item.san) });
  }
  return signals;
}

function normalize(info, fen, id, perspective) {
  try {
    const pvSan = verifyLine(fen, info.pvUci);
    return { id, depth: info.depth, moveUci: info.pvUci[0], moveSan: pvSan[0],
      score: { ...info.score, perspective }, pvUci: info.pvUci, pvSan };
  } catch {
    return null;
  }
}

export async function analyze(position, candidate, signal) {
  signal.throwIfAborted();
  const key = JSON.stringify([position.baseFen, position.movesUci, candidate ?? null, 700, 3]);
  if (cache.has(key)) {
    const result = cache.get(key);
    cache.delete(key);
    cache.set(key, result);
    return result;
  }
  const perspective = position.fen.split(' ')[1] === 'w' ? 'white' : 'black';
  const signals = facts(position.fen, candidate);
  const rootKey = JSON.stringify([position.baseFen, position.movesUci, 700, 3]);
  let root = roots.get(rootKey);
  if (!root) {
    root = await analyst.search(position, { multi: 3, signal });
    if (roots.size >= 64) roots.delete(roots.keys().next().value);
    roots.set(rootKey, root);
  }
  const bestLines = root.lines.map(info => normalize(info, position.fen, 'pv' + info.index, perspective)).filter(Boolean);
  let candidateLine = bestLines.find(line => line.moveUci === candidate) ?? null;
  if (candidate && !candidateLine) {
    const result = await analyst.search(position, { candidate, signal });
    const info = result.lines.find(item => item.pvUci[0] === candidate);
    if (info) candidateLine = normalize(info, position.fen, 'candidate', perspective);
  }
  const result = { engineVersion: analyst.version, perspective, depth: bestLines[0]?.depth ?? 0,
    bestLines, candidateLine, signals };
  if (cache.size >= 64) cache.delete(cache.keys().next().value);
  cache.set(key, result);
  return result;
}
