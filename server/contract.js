import { z } from 'zod';
import { replay, verifyLine, playUci } from '../shared/chess.js';
import { learningProfiles } from '../shared/learningProfiles.js';
import { mentors } from '../shared/mentors.js';
const uci = z.string().regex(/^[a-h][1-8][a-h][1-8][qrbn]?$/);
const side = z.enum(['white', 'black']);
const level = z.enum(Object.keys(learningProfiles));
const line = z.object({ id: z.string().regex(/^(pv[1-3]|candidate|comparison)$/),
  depth: z.number().int().min(1).max(128), pvUci: z.array(uci).min(1).max(16),
  score: z.object({ type: z.enum(['cp', 'mate']), value: z.number().int().min(-50000).max(50000),
    perspective: side, bound: z.enum(['lowerbound', 'upperbound']).nullable() }) });
const request = z.object({
  gameId: z.string().min(1).max(80), positionRevision: z.number().int().nonnegative(),
  fen: z.string().max(120), baseFen: z.string().max(120), movesUci: z.array(uci).max(600),
  candidateUci: uci.nullish(), comparisonUci: uci.nullish(), question: z.string().trim().min(1).max(500), level, mentor: z.enum(Object.keys(mentors)).default('fausto'),
  recentMessages: z.array(z.object({ role: z.enum(['user', 'assistant']), text: z.string().max(1200) })).max(6),
  analysis: z.object({ engineVersion: z.string().max(80), perspective: side,
    depth: z.number().int().min(0).max(128), bestLines: z.array(line).max(3),
    candidateLine: line.nullable(), comparisonLine: line.nullish() }),
});

export function validateRequest(body) {
  const data = request.parse(body);
  const game = replay(data.baseFen, data.movesUci);
  const perspective = game.turn() === 'w' ? 'white' : 'black';
  if (game.fen() !== data.fen || perspective !== data.analysis.perspective) throw new Error('Posición incoherente');
  function checkedLine(entry) {
    if (entry.score.perspective !== perspective) throw new Error('Perspectiva incoherente');
    const pvSan = verifyLine(data.fen, entry.pvUci);
    return { ...entry, moveSan: pvSan[0], moveUci: entry.pvUci[0], pvSan };
  }
  const material = { white: {}, black: {} };
  game.board().flat().filter(Boolean).forEach(({ color, type }) => {
    const pieces = material[color === 'w' ? 'white' : 'black'];
    pieces[type] = (pieces[type] ?? 0) + 1;
  });
  const signals = { material, inCheck: game.isCheck() };
  for (const [moveKey, lineKey] of [['candidateUci', 'candidateLine'], ['comparisonUci', 'comparisonLine']]) {
    const candidate = data[moveKey];
    const entry = data.analysis[lineKey];
    if (entry && entry.pvUci[0] !== candidate) throw new Error('Variante candidata incoherente');
    if (candidate) {
      const after = replay(data.fen);
      const move = playUci(after, candidate);
      signals[moveKey] = { san: move.san, piece: move.piece, captured: move.captured,
        givesCheck: after.isCheck(), legalReplies: after.moves(),
        attackedCentralSquares: ['d4', 'd5', 'e4', 'e5'].filter(square => after.isAttacked(square, game.turn())) };
    }
    data.analysis[lineKey] = entry ? checkedLine(entry) : null;
  }
  data.analysis.bestLines = data.analysis.bestLines.map(checkedLine);
  const lines = [data.analysis.candidateLine, data.analysis.comparisonLine, ...data.analysis.bestLines].filter(Boolean);
  for (const entry of lines) {
    if (lines.some(other => other.id === entry.id && other.pvUci.join(' ') !== entry.pvUci.join(' '))) throw new Error('ID de variante duplicado');
  }
  return { ...data, analysis: { ...data.analysis, signals }, lineIds: [...new Set(lines.map(entry => entry.id))] };
}

export const answerSchema = z.object({
  verdict: z.enum(['good', 'acceptable', 'inaccuracy', 'mistake', 'uncertain']),
  explanation: z.string(), hint: z.string(),
  verifiedLineIds: z.array(z.string()), followUpQuestion: z.string(),
});
