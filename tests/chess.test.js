import { describe, expect, it } from 'vitest';
import { DEFAULT_POSITION, importPosition, replay, verifyLine } from '../shared/chess.js';

describe('reglas e historial', () => {
  it('rechaza jugadas ilegales y verifica SAN sin modificar el tablero', () => {
    expect(() => verifyLine(DEFAULT_POSITION, ['e2e5'])).toThrow();
    expect(verifyLine(DEFAULT_POSITION, ['e2e4', 'e7e5', 'g1f3'])).toEqual(['e4', 'e5', 'Nf3']);
    expect(replay(DEFAULT_POSITION).fen()).toBe(DEFAULT_POSITION);
  });
  it('conserva enroque, captura al paso y promoción', () => {
    expect(verifyLine('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', ['e1g1', 'e8c8'])).toEqual(['O-O', 'O-O-O']);
    expect(verifyLine('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2', ['e5d6'])).toEqual(['exd6']);
    expect(verifyLine('4k3/P7/8/8/8/8/8/4K3 w - - 0 1', ['a7a8n'])).toEqual(['a8=N']);
  });
  it('preserva repeticiones y reconoce mate desde PGN', () => {
    const cycle = ['g1f3', 'g8f6', 'f3g1', 'f6g8'];
    expect(replay(DEFAULT_POSITION, [...cycle, ...cycle]).isThreefoldRepetition()).toBe(true);
    const position = importPosition('1. f3 e5 2. g4 Qh4# 0-1');
    expect(replay(position.baseFen, position.moves).isCheckmate()).toBe(true);
  });
});
