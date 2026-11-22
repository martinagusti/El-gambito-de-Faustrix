import { Eye, Sparkles } from 'lucide-react';
import { learningProfiles } from '../../shared/learningProfiles.js';
import './analysis-lines.css';

const pieceNames = { N: 'Caballo', B: 'Alfil', R: 'Torre', Q: 'Dama', K: 'Rey' };

function describeMove(san, uci) {
  if (san.startsWith('O-O-O')) return 'Enroque largo';
  if (san.startsWith('O-O')) return 'Enroque corto';
  const piece = pieceNames[san[0]] ?? 'Peón';
  const destination = uci.slice(2, 4);
  const promotion = san.match(/=([QRBN])/)?.[1];
  return piece + (san.includes('x') ? ' captura en ' : ' a ') + destination
    + (promotion ? ' y corona a ' + pieceNames[promotion].toLowerCase() : '');
}

function evaluation(score) {
  const sign = score.value < 0 ? '−' : '+';
  const prefix = { lowerbound: '≥ ', upperbound: '≤ ' }[score.bound] ?? '';
  return prefix + (score.type === 'mate' ? sign + 'M' + Math.abs(score.value) : sign + (Math.abs(score.value) / 100).toFixed(2));
}

function describeScore(score) {
  const side = (score.perspective === 'white') === (score.value >= 0) ? 'blancas' : 'negras';
  if (score.bound) return 'Evaluación con límite';
  if (score.type === 'mate') return 'Mate previsto para ' + side;
  const magnitude = Math.abs(score.value);
  if (magnitude <= 15) return 'Posición equilibrada';
  return (magnitude < 80 ? 'Ligera ventaja para ' : 'Ventaja para ') + side;
}

export function AnalysisLines({ analysis, showLine, explain, busy, level }) {
  const firstSteps = level === 'firstSteps';
  const recommended = analysis?.bestLines.find(line => line.id === 'pv1');
  const lines = [...new Map([...(analysis?.bestLines ?? []), analysis?.candidateLine, analysis?.comparisonLine]
    .filter(Boolean).map(line => [line.moveUci, line])).values()];
  if (!lines.length) return null;
  const shown = firstSteps ? [recommended ?? lines[0]] :
    lines.filter((line, index) => index < learningProfiles[level].lines || [analysis.candidateLine?.moveUci, analysis.comparisonLine?.moveUci].includes(line.moveUci));
  const close = recommended && analysis.bestLines.some(line => (
    line !== recommended && line.score.type === 'cp' && recommended.score.type === 'cp'
    && !line.score.bound && !recommended.score.bound
    && Math.abs(line.score.value - recommended.score.value) <= 20
  ));

  return <section className="alternatives">
    <h3><Sparkles size={17} /> {firstSteps ? 'Una idea para probar' : 'Jugadas recomendadas'}</h3>
    {!firstSteps && close && <p className="analysis-note muted">Hay alternativas con una evaluación muy parecida.</p>}
    <div className="analysis-line-list">
      {shown.map(line => {
        const preferred = recommended?.moveUci === line.moveUci;
        return <article className={preferred ? 'analysis-line recommended' : 'analysis-line'} key={line.moveUci}>
          {preferred && !firstSteps && <small className="analysis-recommendation">Mejor valorada</small>}
          <div className="analysis-line-heading">
            <strong>{!firstSteps && line.moveSan + ' · '}{describeMove(line.moveSan, line.moveUci)}</strong>
            {!firstSteps && <span>{evaluation(line.score)}</span>}
          </div>
          {!firstSteps && <p className="muted">{describeScore(line.score)}</p>}
          {!firstSteps && line.pvSan[1] && line.pvUci[1] && <p>Respuesta prevista: {line.pvSan[1]} · {describeMove(line.pvSan[1], line.pvUci[1])}</p>}
          {level === 'advanced' && line.pvSan.length > 2 && <p>Continuación: {line.pvSan.slice(2, 10).join(' · ')}</p>}
          <div className="analysis-line-actions">
            <button onClick={() => showLine(firstSteps ? { ...line, pvUci: line.pvUci.slice(0, 1) } : line)}
              aria-label={firstSteps ? 'Mostrar flecha' : 'Ver en el tablero: ' + line.moveSan}><Eye size={16} /> {firstSteps ? 'Mostrar flecha' : 'Ver en el tablero'}</button>
            <button disabled={busy} onClick={() => explain(line, recommended)} aria-label={'¿Por qué esta jugada? ' + line.moveSan}>¿Por qué esta jugada?</button>
          </div>
        </article>;
      })}
    </div>
  </section>;
}
