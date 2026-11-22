import { Chess, DEFAULT_POSITION } from 'chess.js';
export { DEFAULT_POSITION };

export function playUci(game, uci) {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) throw new Error('Jugada UCI inválida');
  return game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
}

export const toUci = move => move.from + move.to + (move.promotion || '');

export function replay(baseFen, moves = []) {
  const game = new Chess(baseFen === 'startpos' ? DEFAULT_POSITION : baseFen);
  moves.forEach(move => playUci(game, move));
  return game;
}

export function verifyLine(fen, moves) {
  const game = new Chess(fen);
  return moves.map(move => playUci(game, move).san);
}

export function importPosition(value) {
  try {
    return { baseFen: new Chess(value.trim()).fen(), moves: [] };
  } catch {
    const game = new Chess();
    game.loadPgn(value.trim());
    const history = game.history({ verbose: true });
    if (!history.length && !game.getHeaders().FEN) throw new Error('Introduce un FEN o PGN válido');
    return { baseFen: history[0]?.before ?? game.fen(), moves: history.map(toUci) };
  }
}
