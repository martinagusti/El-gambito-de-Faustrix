import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_POSITION, replay, toUci } from '../../shared/chess.js';
import { rival } from '../engine/Stockfish.js';
import { rivals } from './difficulty.js';

const STORAGE = 'golden-library.game.v1';
const fresh = options => ({ mode: 'play', color: 'w', difficulty: 'intermediate', ...options, id: crypto.randomUUID(),
  baseFen: options?.baseFen ?? DEFAULT_POSITION, moves: options?.moves ?? [] });

function restore() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE));
    replay(value.baseFen, value.moves);
    if (!Object.hasOwn(rivals, value.difficulty) || !['w', 'b'].includes(value.color) || !['play', 'study', 'local'].includes(value.mode)) throw new Error();
    return value;
  } catch {
    return fresh();
  }
}

export function useGame() {
  const [state, setState] = useState(restore);
  const [revision, setRevision] = useState(0);
  const [cursor, setCursor] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const fullGame = useMemo(() => replay(state.baseFen, state.moves), [state]);
  const game = useMemo(() => cursor === null ? fullGame : replay(state.baseFen, state.moves.slice(0, cursor)), [state, fullGame, cursor]);
  const thinking = state.mode === 'play' && fullGame.turn() !== state.color && !fullGame.isGameOver();

  function update(next) {
    setState(next);
    setRevision(value => value + 1);
    setCursor(null);
  }
  function navigate(index) {
    setCursor(index === state.moves.length ? null : index);
    setRevision(value => value + 1);
  }
  useEffect(() => {
    try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch { /* Storage may be disabled. */ }
  }, [state]);
  useEffect(() => {
    if (!thinking) return;
    const abort = new AbortController();
    setError('');
    rival.search({ baseFen: state.baseFen, movesUci: state.moves }, { ...rivals[state.difficulty], time: 420, signal: abort.signal })
      .then(({ bestmove }) => {
        if (!abort.signal.aborted && fullGame.moves({ verbose: true }).some(move => toUci(move) === bestmove)) {
          update({ ...state, moves: [...state.moves, bestmove] });
        } else if (!abort.signal.aborted) setError('Stockfish no devolvió una jugada legal.');
      }).catch(cause => { if (!abort.signal.aborted) setError(cause.message); });
    return () => abort.abort();
  }, [state, thinking, retry, fullGame]);

  function move(uci) {
    if ((thinking && state.mode === 'play') || (cursor !== null && state.mode !== 'study') || game.isGameOver()) return false;
    if (!game.moves({ verbose: true }).some(item => toUci(item) === uci)) return false;
    update({ ...state, moves: [...state.moves.slice(0, cursor ?? state.moves.length), uci] });
    return true;
  }
  function reset(options) {
    setError('');
    update(fresh(options));
  }
  const position = { gameId: state.id, positionRevision: revision, fen: game.fen(), baseFen: state.baseFen,
    movesUci: state.moves.slice(0, cursor ?? state.moves.length) };
  return { state, game, fullGame, cursor, thinking, error, position, navigate, move, reset, retry: () => setRetry(value => value + 1) };
}
