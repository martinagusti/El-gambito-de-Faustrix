import { useMemo, useState } from 'react';
import { replay } from '../../shared/chess.js';
import { mentors } from '../../shared/mentors.js';
import { Board } from '../game/Board.jsx';
import { AcademyMentor } from './AcademyMentor.jsx';

export function AcademyActivity({ item, mode, design, level, mentor, onBack, onComplete, onAttempt, onPractice, onRepeat, onReading, onNextExercise, onNextLesson, nextTitle, exerciseIndex, exerciseCount, results }) {
  const [step, setStep] = useState(() => mode === 'practice' && item.side === 'b' ? 1 : 0);
  const [selected, setSelected] = useState(null);
  const [hint, setHint] = useState(0);
  const [message, setMessage] = useState('');
  const [usedHelp, setUsedHelp] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [hadError, setHadError] = useState(false);
  const game = useMemo(() => replay(item.fen, item.moves.slice(0, step)), [item, step]);
  const done = step >= item.moves.length;
  const finished = mode === 'practice' && done && !onNextExercise;
  const legal = selected ? game.moves({ verbose: true }).filter(move => move.from === selected).map(move => move.to) : [];
  const stage = finished ? 3 : mode === 'practice' ? 2 : step ? 1 : 0;
  function advance(from, to) {
    const move = game.moves({ verbose: true }).find(value => value.from === from && value.to === to && (!value.promotion || value.promotion === item.moves[step]?.[4]));
    if (!move || done || mode !== 'practice') return false;
    if (from + to + (move.promotion || '') !== item.moves[step]) {
      setMessage(item.section === 'Lecciones' ? 'Esta jugada no sigue el plan de este ejercicio. Puede haber otras alternativas válidas; prueba otra vez.' : 'Esta jugada no pertenece a la línea practicada; puede haber otras alternativas válidas.');
      setHadError(true); onAttempt(item.id); setSelected(null); return false;
    }
    let next = step + 1;
    if (next < item.moves.length && replay(item.fen, item.moves.slice(0, next)).turn() !== item.side) next++;
    setStep(next); setSelected(null); setHint(0); setMessage('¡Bien visto! ' + item.explanations[step]);
    if (next >= item.moves.length && !recorded) { onComplete(item.id, revealed ? 'solución vista' : usedHelp ? 'con ayuda' : hadError ? 'con intentos' : 'sin ayuda'); setRecorded(true); }
    return true;
  }
  function click(square) {
    if (selected && selected !== square && advance(selected, square)) return;
    setSelected(game.get(square)?.color === game.turn() ? square : null);
  }
  function showHint() { if (hint === 1) setRevealed(true); setHint(value => Math.min(2, value + 1)); setUsedHelp(true); }
  const prompt = done ? item.finish : message || (mode === 'guide' ? (step ? item.explanations[step - 1] : item.intro) : item.intro);
  return <div className="academy-session">
    <div className="academy-session-header"><button className="academy-session-back" onClick={onBack}>← Academia</button><div><p className="settings-eyebrow">{item.level} · {item.section === 'Aperturas y defensas' ? (item.side === 'w' ? 'JUEGAS CON BLANCAS' : 'JUEGAS CON NEGRAS') : 'LECCIÓN'}</p><h3>{item.title}</h3></div></div>
    <ol className="academy-stages" aria-label="Etapas de la lección">{['Descubre', 'Observa', 'Practica', 'Completa'].map((label, index) => <li key={label} className={index === stage ? 'current' : index < stage ? 'passed' : ''} aria-current={index === stage ? 'step' : undefined}><span>{index + 1}</span>{label}</li>)}</ol>
    <div className="academy-activity">
      <div className="academy-board"><Board design={design} view="classic" game={game} orientation={item.side} selected={selected} legal={legal} last={item.moves[step - 1]} candidate={mode === 'practice' && hint === 2 && !done ? item.moves[step] : null} disabled={mode !== 'practice' || done} onClick={click} onDrop={advance} /></div>
      <div className="academy-instructions"><div className="academy-coach-card"><div className="academy-coach-heading"><img src={mentors[mentor].image} alt="" /><div><strong>{mentors[mentor].shortName}</strong><small>{mode === 'guide' ? 'DESCUBRE LA IDEA' : 'TU TURNO · ' + exerciseIndex + ' DE ' + exerciseCount}</small></div></div><p className="academy-message" aria-live="polite">{prompt}</p></div>
      {mode === 'guide' ? <div className="academy-actions"><button disabled={!step} onClick={() => setStep(step - 1)}>Anterior</button><span>{step} / {item.moves.length}</span><button disabled={done} onClick={() => { const next = step + 1; setStep(next); setMessage(''); if (next === item.moves.length && !recorded) { onComplete(item.id, 'guía completada'); setRecorded(true); } }}>Ver siguiente jugada</button></div>
        : !done && <><div className="academy-exercise-progress"><span>Ejercicio {exerciseIndex} de {exerciseCount}</span><progress value={exerciseIndex - 1} max={exerciseCount} aria-label="Progreso de ejercicios" /></div>{hint > 0 && <p className="academy-hint" role="status">{item.hints[hint - 1]}</p>}<div className="academy-actions"><button disabled={hint === 2} onClick={showHint}>Pedir pista</button><button onClick={() => { setUsedHelp(true); setRevealed(true); setHint(2); }}>Mostrar jugada</button></div></>}
      {done && <div className="academy-next" role="group" aria-label="Continuar aprendiendo">
        {mode === 'guide' && <><p>Ahora es tu turno de aplicar esta idea.</p><button type="button" onClick={onPractice}>Empezar la práctica →</button></>}
        {mode === 'practice' && onNextExercise && <><p>¡Bien! Prueba ahora otra posición.</p><button type="button" onClick={onNextExercise}>Siguiente ejercicio →</button></>}
        {finished && <><span className="academy-complete-mark" aria-hidden="true">✦</span><h4>¡Práctica completada!</h4><p>Has terminado {exerciseCount} {exerciseCount === 1 ? 'ejercicio' : 'ejercicios'}. {results.filter(value => value === 'sin ayuda').length} {exerciseCount === 1 ? 'resuelto' : 'resueltos'} sin pistas ni intentos fallidos.</p>{onNextLesson && <button type="button" onClick={onNextLesson}>Siguiente lección: {nextTitle} →</button>}<div className="academy-actions"><button type="button" onClick={onRepeat}>Repetir práctica</button><button type="button" onClick={onBack}>Volver al recorrido</button></div></>}
      </div>}
      <div className="academy-secondary">{onReading && <button type="button" onClick={onReading}>Profundizar en la biblioteca</button>}<AcademyMentor item={item} step={step} game={game} level={level} mentor={mentor} /></div>
      </div>
    </div>
  </div>;
}
