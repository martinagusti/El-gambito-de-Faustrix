import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { gameResult } from '../src/game/gameResult.js';

describe('resultado de la partida', () => {
  const mate = () => {
    const game = new Chess();
    for (const move of ['f3', 'e5', 'g4', 'Qh4#']) game.move(move);
    return game;
  };
  it('identifica derrota, victoria y ganador en juego local', () => {
    expect(gameResult(mate(), 'play', 'w').description).toContain('Has perdido');
    expect(gameResult(mate(), 'play', 'b').title).toContain('ganado');
    expect(gameResult(mate(), 'local', 'w').description).toContain('negras');
  });
  it('distingue una partida en curso y tablas por ahogado', () => {
    expect(gameResult(new Chess(), 'play', 'w')).toBeNull();
    const stalemate = new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
    expect(gameResult(stalemate, 'play', 'w').description).toContain('ahogado');
  });
});
