import { useState } from 'react';
import { Download, RotateCcw, Upload, ChevronFirst, ChevronLeft, ChevronRight, ChevronLast } from 'lucide-react';
import { importPosition } from '../../shared/chess.js';
import { rivals } from './difficulty.js';

export function Controls({ game, onReset, activeTab }) {
  const [transfer, setTransfer] = useState('');
  const [notice, setNotice] = useState('');
  const { state, fullGame, cursor, navigate } = game;
  const index = cursor ?? state.moves.length;
  const history = fullGame.history({ verbose: true });
  const reset = (options, kind = 'settings') => onReset(options, kind);
  function load() {
    try {
      reset({ ...state, ...importPosition(transfer), mode: 'study' }, 'import');
      setNotice('');
    } catch { setNotice('El texto no es un FEN o PGN válido.'); }
  }
  async function exportText(format) {
    const value = format === 'FEN' ? game.game.fen() : game.game.pgn();
    setTransfer(value);
    try { await navigator.clipboard.writeText(value); setNotice(format + ' copiado'); }
    catch { setNotice(format + ' listo en el campo de texto'); }
  }
  return <>
    <section className="settings-game" role="tabpanel" id="settings-panel-game" aria-labelledby="settings-tab-game" hidden={activeTab !== 'game'}>
      <div className="options-section-heading"><div><h3>Tu partida</h3><p>{state.mode === 'play' ? 'Elegí el color y la fuerza del rival.' : 'Elegí la orientación del tablero.'}</p></div></div>
      <div className="settings-fields">
      <label>{state.mode === 'play' ? 'Tu color' : 'Piezas en la parte inferior'} <select value={state.color} onChange={event => reset({ mode: state.mode, color: event.target.value, difficulty: state.difficulty })}>
        <option value="w">Blancas</option><option value="b">Negras</option></select></label>
      {state.mode === 'play' && <label>Fuerza del rival <select value={state.difficulty} onChange={event => reset({ mode: state.mode, color: state.color, difficulty: event.target.value })}>
        {Object.entries(rivals).map(([key, { label }]) => <option value={key} key={key}>{label}</option>)}</select></label>}
      </div>
      <div className="settings-game-actions">
      <button onClick={() => reset({ mode: state.mode, color: state.color, difficulty: state.difficulty }, 'new')}><RotateCcw size={16} /> Nueva</button>
      </div>
      <details className="settings-transfer"><summary>Importar o exportar posición</summary>
      <textarea aria-label="FEN o PGN" value={transfer} onChange={event => setTransfer(event.target.value)} placeholder="Pega un FEN o PGN" />
      <div className="control-row"><button onClick={load}><Upload size={16} /> Importar</button>
        <button onClick={() => exportText('FEN')}><Download size={16} /> FEN</button>
        <button onClick={() => exportText('PGN')}><Download size={16} /> PGN</button><output>{notice}</output></div>
      </details>
    </section>
    <section className="settings-history" role="tabpanel" id="settings-panel-history" aria-labelledby="settings-tab-history" hidden={activeTab !== 'history'}>
      <div className="options-section-heading"><div><h3>Jugadas</h3><p>Recorré la partida movimiento a movimiento.</p></div></div>
      <div className="history-navigation" aria-label="Navegación de jugadas">
        <button title="Inicio" aria-label="Inicio" disabled={!index} onClick={() => navigate(0)}><ChevronFirst size={18} /></button>
        <button title="Anterior" aria-label="Anterior" disabled={!index} onClick={() => navigate(index - 1)}><ChevronLeft size={18} /></button>
        <span>{index} / {history.length}</span>
        <button title="Siguiente" aria-label="Siguiente" disabled={index === history.length} onClick={() => navigate(index + 1)}><ChevronRight size={18} /></button>
        <button title="Última jugada" aria-label="Última jugada" disabled={index === history.length} onClick={() => navigate(history.length)}><ChevronLast size={18} /></button>
      </div>
      <div className="move-list" aria-label="Historial de jugadas">
        {history.length ? history.map((move, offset) => <button key={offset} className={index === offset + 1 ? 'active' : ''} aria-pressed={index === offset + 1} onClick={() => navigate(offset + 1)}>
          <span>{move.before.split(' ')[5]}{move.color === 'b' ? '…' : '.'}</span> {move.san}
        </button>) : <p className="muted">Todavía no hay jugadas.</p>}
      </div>
    </section>
  </>;
}
