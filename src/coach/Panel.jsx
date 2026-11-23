import { useCallback, useEffect, useRef, useState } from 'react';
import { BarChart3, Send, Sparkles, X } from 'lucide-react';
import { AnalysisLines } from './AnalysisLines.jsx';
import { learningProfiles } from '../../shared/learningProfiles.js';
import { mentors } from '../../shared/mentors.js';
import { MentorDialog } from './MentorDialog.jsx';
import { MagicMeter } from './MagicMeter.jsx';

const mentorThinking = {
  fausto: 'Fáustrix consulta sus hechizos y estudia la mejor jugada…',
  selene: 'Selene observa las estrellas del tablero y prepara su consejo…',
  broin: 'Bróin estudia la posición y forja su consejo…',
};

const tabs = [['coach', 'Asistente', Sparkles], ['analysis', 'Análisis', BarChart3]];

export function CoachPanel({ onClose, hidden, compactOpen, coach, tab, setTab, candidate, comparison, setComparison, legal, showLine, revision, finished, learningLevel, setLearningLevel, mentor, setMentor, automaticAnalysis, setAutomaticAnalysis }) {
  const [question, setQuestion] = useState('');
  const [dragOffset, setDragOffset] = useState(0);
  const [showMentors, setShowMentors] = useState(false);
  const [magicStatus, setMagicStatus] = useState(null);
  const updateMagicStatus = useCallback(value => setMagicStatus(value), []);
  const scroll = useRef();
  const dragStart = useRef(null);
  const { current, messages, phase, error, magicLimit, request, cancel } = coach;
  const analysis = current?.analysis;

  useEffect(() => {
    if (scroll.current && tab === 'coach') scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [messages.length, phase, tab]);
  useEffect(() => {
    if (scroll.current && tab === 'analysis') scroll.current.scrollTop = 0;
  }, [tab]);
  function ask(text, kind = null) {
    if (text.trim() && !phase && !finished) {
      request({ question: text, candidate, comparison, kind });
      setQuestion('');
    }
  }
  function explain(line, recommended) {
    const alternative = line.moveUci === recommended?.moveUci ? candidate : recommended?.moveUci;
    const other = alternative !== line.moveUci && legal.find(move => move.lan === alternative);
    const question = other
      ? '¿Por qué jugar ' + line.moveSan + '? Compárala con ' + other.san + ' y explica qué podría responder el rival.'
      : '¿Qué tiene de buena o arriesgada la jugada ' + line.moveSan + '? Explica qué podría responder el rival.';
    setTab('coach');
    request({ question, candidate: line.moveUci, comparison: other ? other.lan : null });
  }
  return <aside className={"coach panel" + (hidden ? " coach-hidden" : "") + (compactOpen ? " compact-open" : "")} aria-label="Profesor de ajedrez" style={dragOffset ? { transform: `translateY(${dragOffset}px)` } : undefined}>
    <button className="coach-drag-handle" type="button" aria-label="Cerrar profesor" onClick={event => { if (event.detail === 0) onClose(); }}
      onPointerDown={event => { dragStart.current = event.clientY; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={event => { if (dragStart.current !== null) setDragOffset(Math.max(0, event.clientY - dragStart.current)); }}
      onPointerUp={event => { if (dragStart.current !== null && (event.clientY - dragStart.current > 60 || Math.abs(event.clientY - dragStart.current) < 5)) onClose(); dragStart.current = null; setDragOffset(0); }}
      onPointerCancel={() => { dragStart.current = null; setDragOffset(0); }}><span aria-hidden="true" /></button>
    <button className="coach-close" onClick={onClose} aria-label="Cerrar profesor" title="Cerrar profesor"><X size={18} /></button>
    <div className="tabs" role="group" aria-label="Panel del profesor">
      {tabs.map(([key, label, Icon]) => <button key={key} className={tab === key ? 'active' : ''} aria-pressed={tab === key} onClick={() => setTab(key)}><Icon size={18} /> {label}</button>)}
    </div>
    <MagicMeter phase={phase} onStatusChange={updateMagicStatus} />
    {(magicLimit || magicStatus?.blocked) && <div className="magic-alternative" role="status">
      <span>{(magicLimit || magicStatus?.period) === 'month' ? 'La magia de este mes se ha agotado.' : 'La magia de hoy se ha agotado o no alcanza para otra consulta.'} Puedes seguir viendo las recomendaciones del tablero en Análisis, sin gastar magia.</span>
      <button type="button" onClick={() => setTab('analysis')}>Ir a Análisis</button>
    </div>}
    <div className="coach-body" ref={scroll}>
      <button className="mentor-level-summary" type="button" onClick={() => setShowMentors(true)} aria-haspopup="dialog">
        <span>Nivel de aprendizaje: <strong>{learningProfiles[learningLevel].label}</strong></span><span> Cambiar</span>
      </button>
      {tab === 'coach' && <>
        <div className="mentor-intro">
          <button className="mentor-avatar-button" type="button" aria-label="Conocer y cambiar de mentor" aria-haspopup="dialog" onClick={() => setShowMentors(true)}><img className="mentor-avatar" src={mentors[mentor].image} alt="" width="72" height="72" /></button>
          <div><h2>{mentors[mentor].name}</h2><p>Selecciona una jugada candidata o pregunta qué está pasando en la posición.</p><span className="mentor-open-hint">Haz clic en el retrato para conocer a tus mentores.</span></div>
        </div>
        {messages.map((message, index) => <div key={index} className={'message-row ' + message.role}>
          {message.role === 'assistant' && <img className="message-avatar" src={mentors[mentor].image} alt="" width="44" height="44" />}
          <article className={'message ' + message.role}>
          {message.revision !== revision && <small>Posición anterior</small>}
          {message.kind === 'hint' ? <p>{message.data?.hint || 'No he podido preparar una pista. Inténtalo de nuevo.'}</p> : <>
            {message.text && <p>{message.text}</p>}
            {message.data?.hint && <p><strong>Pista</strong> {message.data.hint}</p>}
            {message.data?.followUpQuestion && <p>{message.data.followUpQuestion}</p>}
          </>}
          {message.kind !== 'hint' && message.revision === revision && message.data?.verifiedLineIds.map(id => {
            const line = message.lines?.find(item => item.id === id);
            return line && <button key={id} onClick={() => showLine(line)}>Ver variante · {line.moveSan}</button>;
          })}
          </article>
        </div>)}
      </>}
      {tab === 'analysis' && <><div className="analysis-header"><h2>Recomendaciones para ti</h2>
        <label className="analysis-auto-setting" title="Actualizar las recomendaciones al cambiar la posición, sin gastar magia">
          <input type="checkbox" role="switch" checked={automaticAnalysis} onChange={event => setAutomaticAnalysis(event.target.checked)} aria-label="Actualizar análisis automáticamente" />
          <span>Auto</span>
        </label></div>
        <p className="muted">{analysis ? 'Perspectiva: ' + (analysis.perspective === 'white' ? 'blancas' : 'negras') + ' · Profundidad ' + analysis.depth : 'Calcula variantes desde la posición actual.'}</p>
        {(!automaticAnalysis || error) && <button disabled={Boolean(phase) || finished} onClick={() => request({ local: true, candidate, comparison })}><Sparkles size={16} /> Analizar posición</button>}</>}
      {candidate && <div className="candidate-slot"><strong>Candidata · {legal.find(move => move.lan === candidate)?.san}</strong>
        <label>Comparar con <select aria-label="Comparar con" value={comparison ?? ''} onChange={event => setComparison(event.target.value || null)}>
          <option value="">Otra jugada</option>{legal.filter(move => move.lan !== candidate).map(move => <option key={move.lan} value={move.lan}>{move.san}</option>)}
        </select></label></div>}
      {tab === 'analysis' && <AnalysisLines analysis={analysis} showLine={showLine} explain={explain} busy={Boolean(phase) || finished} level={learningLevel} />}
      {tab === 'coach' && analysis && !phase && <button className="view-recommendations" onClick={() => setTab('analysis')}>Ver recomendaciones del tablero</button>}
      {!phase && !error && tab === 'coach' && <div className="quick-help">
        <div className="quick"><button disabled={finished} onClick={() => ask('Dame una pista.', 'hint')}>Dame una pista</button>
          <button disabled={finished} onClick={() => ask('¿Qué amenaza mi rival?')}>¿Qué amenaza mi rival?</button></div>
        <p className="quick-help-note">Estas consultas usan el asistente y consumen tokens de IA.</p>
      </div>}
      {phase && <div className="status mentor-thinking" role="status"><span className="thinking-sparkle" aria-hidden="true">✦</span><span>{phase === 'local' ? 'Preparando recomendaciones para esta posición…' : mentorThinking[mentor]}</span><button onClick={cancel}>Cancelar</button></div>}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
    {showMentors && <MentorDialog selected={mentor} onSelect={setMentor} learningLevel={learningLevel} onLevelChange={setLearningLevel} levelDisabled={Boolean(phase)} onClose={() => setShowMentors(false)} />}
    {tab === 'coach' && <form className="chat-form" onSubmit={event => { event.preventDefault(); ask(question); }}>
      <input aria-label={'Pregunta a ' + mentors[mentor].shortName} value={question} maxLength={500} placeholder={'Pregunta a ' + mentors[mentor].shortName + '...'} onChange={event => setQuestion(event.target.value)} />
      <button title="Enviar pregunta" aria-label="Enviar pregunta" disabled={!question.trim() || Boolean(phase) || finished}><Send size={20} /></button>
    </form>}
  </aside>;
}
