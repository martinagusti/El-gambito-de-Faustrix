import { useEffect, useRef, useState } from 'react';
import { BarChart3, Send, Sparkles } from 'lucide-react';
import { AnalysisLines } from './AnalysisLines.jsx';
import { learningProfiles } from '../../shared/learningProfiles.js';
import { mentors } from '../../shared/mentors.js';
import { MentorDialog } from './MentorDialog.jsx';

const mentorThinking = {
  fausto: 'Fáustrix consulta sus hechizos y estudia la mejor jugada…',
  selene: 'Selene observa las estrellas del tablero y prepara su consejo…',
  broin: 'Bróin estudia la posición y forja su consejo…',
};

const tabs = [['coach', 'Asistente', Sparkles], ['analysis', 'Análisis', BarChart3]];

export function CoachPanel({ coach, tab, setTab, candidate, comparison, setComparison, legal, showLine, revision, finished, learningLevel, setLearningLevel, mentor, setMentor }) {
  const [question, setQuestion] = useState('');
  const [showMentors, setShowMentors] = useState(false);
  const scroll = useRef();
  const { current, messages, phase, error, request, cancel } = coach;
  const analysis = current?.analysis;

  useEffect(() => {
    if (scroll.current && tab === 'coach') scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [messages.length, phase, tab]);
  useEffect(() => {
    if (scroll.current && tab === 'analysis') scroll.current.scrollTop = 0;
  }, [tab]);
  function ask(text) {
    if (text.trim() && !phase && !finished) {
      request({ question: text, candidate, comparison });
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
  return <aside className="coach panel" aria-label="Profesor de ajedrez">
    <div className="tabs" role="group" aria-label="Panel del profesor">
      {tabs.map(([key, label, Icon]) => <button key={key} className={tab === key ? 'active' : ''} aria-pressed={tab === key} onClick={() => setTab(key)}><Icon size={18} /> {label}</button>)}
    </div>
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
          <p>{message.text}</p>
          {message.data?.hint && <p><strong>Pista</strong> {message.data.hint}</p>}
          {message.data?.followUpQuestion && <p>{message.data.followUpQuestion}</p>}
          {message.revision === revision && message.data?.verifiedLineIds.map(id => {
            const line = message.lines?.find(item => item.id === id);
            return line && <button key={id} onClick={() => showLine(line)}>Ver variante · {line.moveSan}</button>;
          })}
          </article>
        </div>)}
      </>}
      {tab === 'analysis' && <><h2>Recomendaciones para ti</h2>
        {learningLevel !== 'firstSteps' && <p className="muted">{analysis ? 'Perspectiva: ' + (analysis.perspective === 'white' ? 'blancas' : 'negras') + ' · Profundidad ' + analysis.depth : 'Calcula variantes desde la posición actual.'}</p>}
        <button disabled={Boolean(phase) || finished} onClick={() => request({ local: true, candidate, comparison })}><Sparkles size={16} /> {learningLevel === 'firstSteps' ? 'Mostrar una idea' : 'Analizar posición'}</button></>}
      {candidate && <div className="candidate-slot"><strong>Candidata · {legal.find(move => move.lan === candidate)?.san}</strong>
        <label>Comparar con <select aria-label="Comparar con" value={comparison ?? ''} onChange={event => setComparison(event.target.value || null)}>
          <option value="">Otra jugada</option>{legal.filter(move => move.lan !== candidate).map(move => <option key={move.lan} value={move.lan}>{move.san}</option>)}
        </select></label></div>}
      {tab === 'analysis' && <AnalysisLines analysis={analysis} showLine={showLine} explain={explain} busy={Boolean(phase) || finished} level={learningLevel} />}
      {tab === 'coach' && analysis && !phase && <button className="view-recommendations" onClick={() => setTab('analysis')}>Ver recomendaciones del tablero</button>}
      {!phase && !error && tab === 'coach' && <div className="quick"><button disabled={finished} onClick={() => ask('Dame una pista para encontrar una buena jugada.')}>Pedir pista</button>
        <button disabled={finished} onClick={() => ask(comparison ? 'Compara las dos jugadas candidatas.' : '¿Qué debería tener en cuenta antes de mover?')}>{comparison ? 'Comparar jugadas' : '¿Qué amenazas hay?'}</button></div>}
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
