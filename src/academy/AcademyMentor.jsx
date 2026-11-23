import { useState } from 'react';
import { useCoach } from '../coach/useCoach.js';
import { mentors } from '../../shared/mentors.js';

export function AcademyMentor({ item, step, game, level, mentor }) {
  const [question, setQuestion] = useState('');
  const position = { gameId: 'academy-' + item.id, positionRevision: step, fen: game.fen(), baseFen: item.fen, movesUci: item.moves.slice(0, step) };
  const coach = useCoach(position, level, mentor);
  function submit(event) {
    event.preventDefault();
    const text = question.trim();
    if (!text || coach.phase) return;
    coach.request({ question: ('Tema de la academia: ' + item.title + '. ' + text).slice(0, 500) });
    setQuestion('');
  }
  return <details className="academy-mentor"><summary>Preguntar a {mentors[mentor].shortName}</summary>
    <p>Consulta opcional sobre esta posición. Usa el presupuesto del asistente.</p>
    {coach.messages.map((message, index) => <p key={index}><strong>{message.role === 'user' ? 'Tú' : mentors[mentor].shortName}:</strong> {message.text}{message.revision !== step && ' (posición anterior)'}</p>)}
    {coach.phase && <p role="status">{coach.phase}</p>}{coach.error && <p role="alert">{coach.error}</p>}
    <form onSubmit={submit}><label htmlFor="academy-question">Tu pregunta</label><textarea id="academy-question" maxLength={400} value={question} onChange={event => setQuestion(event.target.value)} /><button type="submit" disabled={!question.trim() || Boolean(coach.phase)}>Enviar pregunta</button></form>
  </details>;
}
