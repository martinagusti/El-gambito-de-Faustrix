import { useEffect, useState } from 'react';
import { BookOpen, BookOpenCheck, ChevronLeft, ChevronRight, Crown, GraduationCap, Maximize, Settings, Swords, Users } from 'lucide-react';
import { replay, toUci } from '../shared/chess.js';
import { useGame } from './game/useGame.js';
import { Board } from './game/Board.jsx';
import { boardDesigns, boardPreference, boardViewPreference } from './game/BoardOptions.jsx';
import { SettingsDialog } from './game/SettingsDialog.jsx';
import { LessonsDialog } from './game/LessonsDialog.jsx';
import { rivals } from './game/difficulty.js';
import { learningProfiles } from '../shared/learningProfiles.js';
import { mentors } from '../shared/mentors.js';
import { useCoach } from './coach/useCoach.js';
import { CoachPanel } from './coach/Panel.jsx';
import { theme } from './theme.js';

const promotionNames = { q: 'Dama', r: 'Torre', b: 'Alfil', n: 'Caballo' };

export function App() {
  const session = useGame();
  const { game, state, position, cursor, thinking } = session;
  const [learningLevel, setLearningLevel] = useState(() => {
    try {
      const saved = localStorage.getItem('fausto.learning-level');
      if (Object.hasOwn(learningProfiles, saved)) return saved;
    } catch { /* Storage may be blocked. */ }
    return 'beginner';
  });
  const [mentor, setMentor] = useState(() => {
    try { const saved = localStorage.getItem('fausto.mentor'); if (Object.hasOwn(mentors, saved)) return saved; } catch { /* Storage may be blocked. */ }
    return 'fausto';
  });
  const coach = useCoach(position, learningLevel, mentor);
  const [selection, setSelection] = useState({});
  const [tab, setTab] = useState('coach');
  const [options, setOptions] = useState(null);
  const [lessonsOpen, setLessonsOpen] = useState(false);
  const [boardView, setBoardView] = useState(() => {
    try {
      if (localStorage.getItem(boardViewPreference) === 'perspective') return 'perspective';
    } catch { /* Storage may be blocked. */ }
    return 'classic';
  });
  const [boardDesign, setBoardDesign] = useState(() => {
    try {
      const saved = localStorage.getItem(boardPreference);
      if (Object.hasOwn(boardDesigns, saved)) return saved;
    } catch { /* Storage may be blocked. */ }
    return 'biblioteca-dorada';
  });
  const [studyMode, setStudyMode] = useState(false);
  const [displayError, setDisplayError] = useState('');
  const revision = position.positionRevision;
  const { selected, candidate, comparison, variation, step = 0, promotions } = selection.revision === revision ? selection : {};
  const patch = values => setSelection(previous => ({ ...(previous.revision === revision ? previous : {}), revision, ...values }));
  const legal = game.moves({ verbose: true });
  const blocked = Boolean(variation) || game.isGameOver() || (state.mode !== 'study' && cursor !== null) || (state.mode === 'play' && thinking);
  const boardGame = variation ? replay(position.fen, variation.pvUci.slice(0, step)) : game;
  const variationMove = variation && step ? boardGame.history({ verbose: true }).at(-1) : null;
  const last = variation ? variation.pvUci[step - 1] : position.movesUci.at(-1);
  const arrow = variation ? variation.pvUci[step] : candidate;
  const historyIndex = cursor ?? state.moves.length;
  useEffect(() => {
    function onHistoryKey(event) {
      if (!event.ctrlKey || !event.altKey || event.shiftKey || event.metaKey || options || document.querySelector('dialog[open]') || variation || promotions) return;
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      event.preventDefault();
      const next = historyIndex + (event.key === 'ArrowLeft' ? -1 : 1);
      if (next >= 0 && next <= state.moves.length) session.navigate(next);
    }
    window.addEventListener('keydown', onHistoryKey);
    return () => window.removeEventListener('keydown', onHistoryKey);
  }, [historyIndex, state.moves.length, options, variation, promotions]);
  const currentTurn = game.turn() === 'w' ? 'blancas' : 'negras';
  const status = game.isCheckmate() ? 'Jaque mate · ganan ' + (game.turn() === 'w' ? 'negras' : 'blancas')
    : game.isStalemate() ? 'Tablas por ahogado' : game.isThreefoldRepetition() ? 'Tablas por repetición'
      : game.isDraw() ? 'Tablas' : thinking ? (session.error ? 'Rival detenido' : 'El rival está pensando…')
        : 'Turno de ' + currentTurn + (game.isCheck() ? ' · Jaque' : '');

  function reset(options) {
    setSelection({});
    setStudyMode(false);
    session.reset(options);
  }
  function mode(value) {
    if (state.mode === value) return;
    if (state.moves.length && !window.confirm('¿Comenzar una nueva partida en este modo?')) return;
    reset({ mode: value, color: state.color, difficulty: state.difficulty });
  }
  function submitMoves(options, prepare = studyMode) {
    if (!options.length) return false;
    if (options.length > 1) { patch({ promotions: { options, prepare } }); return false; }
    const uci = toUci(options[0]);
    if (prepare) { patch({ candidate: uci, comparison: null, selected: null, promotions: null }); setTab('coach'); return false; }
    return session.move(uci);
  }
  function onSquareClick(square) {
    if (variation) { patch({ variation: null, step: 0 }); return; }
    if (blocked) return;
    if (selected && selected !== square) {
      const options = legal.filter(move => move.from === selected && move.to === square);
      if (options.length) { submitMoves(options); return; }
    }
    patch({ selected: square !== selected && game.get(square)?.color === game.turn() ? square : null });
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { setDisplayError('La pantalla completa no está disponible en este dispositivo.'); }
  }
  function showLine(line) { patch({ variation: line, step: 0 }); }
  function chooseBoard(id) {
    setBoardDesign(id);
    try { localStorage.setItem(boardPreference, id); } catch { /* Selection still applies. */ }
  }
  function chooseBoardView(view) {
    setBoardView(view);
    try { localStorage.setItem(boardViewPreference, view); } catch { /* Selection still applies. */ }
  }
  function chooseMentor(id) {
    setMentor(id);
    try { localStorage.setItem('fausto.mentor', id); } catch { /* Selection still applies. */ }
  }
  function chooseLearningLevel(level) {
    setLearningLevel(level);
    try { localStorage.setItem('fausto.learning-level', level); } catch { /* Selection still applies. */ }
  }
  const askCandidate = () => {
    setTab('coach');
    coach.request({ question: comparison ? 'Compara estas dos jugadas.' : '¿Es buena idea jugar esta candidata?', candidate, comparison });
  };

  return <div className="app" style={{ '--library-image': 'url(' + theme.background + ')' }}>
    <header className="header">
      <div className="brand"><Crown size={40} /><div>El Gambito<span>de Fausto</span></div></div>
      <div className="header-tools"><span className="mode-pill"><GraduationCap size={19} /> {state.mode === 'play' ? 'Partida contra el ordenador' : state.mode === 'local' ? 'Partida de dos jugadores' : 'Estudio libre'}</span>
        <button aria-label="Opciones" aria-haspopup="dialog" aria-expanded={Boolean(options)} onClick={() => setOptions('design')}><Settings size={20} /></button>
        <button aria-label="Pantalla completa" onClick={fullscreen}><Maximize size={20} /></button></div>
    </header>
    {displayError && <p className="error">{displayError}</p>}
    <main className="layout">
      <nav className="sidebar panel" aria-label="Modos de juego">
        <button className={state.mode === 'play' ? 'active' : ''} onClick={() => mode('play')}><Swords /> Contra el ordenador</button>
        <button className={state.mode === 'local' ? 'active' : ''} onClick={() => mode('local')}><Users /> Dos jugadores</button>
        <button className={state.mode === 'study' ? 'active' : ''} onClick={() => mode('study')}><BookOpen /> Estudio libre</button>
        <button onClick={() => setLessonsOpen(true)} aria-haspopup="dialog"><BookOpenCheck /> Lecciones y prácticas</button>
      </nav>
      <section className="board-area panel" aria-label="Partida de ajedrez">
        <div className="player"><div className="avatar"><Swords size={22} /></div><div><strong>{state.mode === 'play' ? 'Rival · Stockfish' : state.mode === 'local' ? (state.color === 'w' ? 'Jugador 2' : 'Jugador 1') : 'Estudio libre'}</strong><small>{state.mode === 'play' ? rivals[state.difficulty].label : state.mode === 'local' ? 'Partida en el mismo dispositivo' : 'Controla ambos bandos'}</small></div><span className="turn-mark">{state.color === 'w' ? 'Negras' : 'Blancas'}</span></div>
        <Board design={boardDesign} view={boardView} game={boardGame} orientation={state.color} selected={variation ? null : selected}
          legal={variation || !selected ? [] : legal.filter(move => move.from === selected).map(move => move.to)}
          last={last} candidate={arrow} disabled={blocked} onDismissVariation={variation ? () => patch({ variation: null, step: 0 }) : undefined}
          onClick={onSquareClick} onDrop={(from, to) => !blocked && submitMoves(legal.filter(move => move.from === from && move.to === to))} />
        <div className="player bottom"><div className="avatar"><Crown size={23} /></div><div><strong>{state.mode === 'local' ? (state.color === 'w' ? 'Jugador 1' : 'Jugador 2') : 'Tú'}</strong><small role="status">{status}</small></div><span className="turn-mark">{state.color === 'w' ? 'Blancas' : 'Negras'}</span></div>
        <div className="board-actions-wrapper">
        <div className="board-actions" style={variation ? { visibility: 'hidden' } : undefined} aria-hidden={Boolean(variation)} inert={variation ? '' : undefined}>
          <div className="board-history-controls" role="group" aria-label="Navegar jugadas">
            <button aria-label="Jugada anterior" title="Jugada anterior · Ctrl + Alt + ←" disabled={historyIndex === 0}
              onClick={() => session.navigate(historyIndex - 1)}><ChevronLeft size={18} /></button>
            <span aria-live="polite">{historyIndex} / {state.moves.length}</span>
            <button aria-label="Jugada siguiente" title="Jugada siguiente · Ctrl + Alt + →" disabled={historyIndex === state.moves.length}
              onClick={() => session.navigate(historyIndex + 1)}><ChevronRight size={18} /></button>

          </div>
          <button className={studyMode ? 'active' : ''} aria-pressed={studyMode} disabled={blocked} onClick={() => { setStudyMode(!studyMode); patch({ candidate: null, comparison: null, selected: null }); }}>Preparar jugada</button>
          {candidate && <><button disabled={Boolean(coach.phase)} onClick={askCandidate}>Consultar al profesor</button><button onClick={() => { session.move(candidate); setStudyMode(false); }}>Jugar candidata</button></>}
          {!candidate && <button onClick={() => setOptions('history')}>Controles e historial</button>}
        </div>
        {variation && <div className="variation-overlay" role="group" aria-label="Vista de variante">
          <button disabled={!step} onClick={() => patch({ step: step - 1 })}>Anterior</button>
          <span aria-live="polite">{variationMove ? variationMove.san : 'Vista previa'} · {step}/{variation.pvUci.length}
            {variationMove?.captured ? ' · Captura' : ''}{variationMove && boardGame.isCheck() ? ' · Jaque' : ''}</span>
          <button disabled={step === variation.pvUci.length} onClick={() => patch({ step: step + 1 })}>Siguiente</button>
          <button onClick={() => patch({ variation: null, step: 0 })}>Cerrar</button>
        </div>}
        </div>
        {session.error && <div className="error">{session.error} <button onClick={session.retry}>Reintentar</button></div>}
        {promotions && <div className="variation-bar" role="group" aria-label="Promoción de peón">
          {promotions.options.map(move => <button key={move.promotion} onClick={() => submitMoves([move], promotions.prepare)}>{promotionNames[move.promotion]}</button>)}
          <button onClick={() => patch({ promotions: null })}>Cancelar</button>
        </div>}
      </section>
      <CoachPanel coach={coach} tab={tab} setTab={setTab} candidate={candidate} comparison={comparison}
        learningLevel={learningLevel} setLearningLevel={chooseLearningLevel} mentor={mentor} setMentor={chooseMentor}
        setComparison={value => patch({ comparison: value })} legal={legal} showLine={showLine} revision={revision} finished={game.isGameOver()} />
    </main>
    {lessonsOpen && <LessonsDialog onClose={() => setLessonsOpen(false)} />}
    {options && <SettingsDialog initialTab={options} onClose={() => setOptions(null)} game={session} onReset={reset}
      selected={boardDesign} onChange={chooseBoard} view={boardView} onViewChange={chooseBoardView} />}
  </div>;
}
