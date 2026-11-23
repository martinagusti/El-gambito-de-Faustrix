import { useMemo, useState } from 'react';
import { replay } from '../../shared/chess.js';
import { Board } from '../game/Board.jsx';
import { readingFor } from './readingContent.js';
import './reading.css';

export function ReadingGuide({ item, design, onBack, onStart }) {
  const guide = readingFor(item.id);
  const [step, setStep] = useState(0);
  const [mobilePanel, setMobilePanel] = useState('text');
  const game = useMemo(() => replay(item.fen, item.moves.slice(0, step)), [item, step]);
  return <div className="reading-guide">
    <div className="reading-toolbar"><button onClick={onBack}>← Biblioteca</button><span>GUÍA DE LECTURA · {guide.level}</span><button onClick={() => onStart(item, 'practice')}>Practicar</button></div>
    <div className="reading-mobile-tabs" role="group" aria-label="Vista de lectura"><button aria-pressed={mobilePanel === 'text'} onClick={() => setMobilePanel('text')}>Leer</button><button aria-pressed={mobilePanel === 'board'} onClick={() => setMobilePanel('board')}>Ver tablero</button></div>
    <div className="reading-layout"><article className={'reading-article' + (mobilePanel !== 'text' ? ' reading-mobile-hidden' : '')}>
      <p className="settings-eyebrow">BIBLIOTECA DE FAUSTO · {guide.category.toUpperCase()}</p><h3>{guide.title}</h3><p className="reading-subtitle">{guide.subtitle}</p>
      <div className="reading-callout">{guide.callout}</div>
      {guide.sections.map(section => <section key={section.title}><h4>{section.title}</h4>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}{section.boardLink && <button className="reading-show-board" onClick={() => setMobilePanel('board')}>Ver ejemplo en el tablero →</button>}</section>)}
      <p className="reading-source">{guide.source}</p><div className="academy-actions"><button onClick={() => onStart(item, 'guide')}>Ver lección</button><button onClick={() => onStart(item, 'practice')}>Practicar este tema</button></div>
    </article>
    <aside className={'reading-board-panel' + (mobilePanel !== 'board' ? ' reading-mobile-hidden' : '')} aria-label={'Ejemplo: ' + guide.title}><p className="settings-eyebrow">EJEMPLO INTERACTIVO</p><h4>{guide.boardTitle}</h4><Board design={design} view="classic" game={game} orientation={item.side} last={item.moves[step - 1]} disabled onClick={() => {}} onDrop={() => false} />
      <p className="reading-board-caption" aria-live="polite">{step ? item.explanations[step - 1] : 'Posición inicial. Avanza para ver la explicación de cada jugada.'}</p><div className="academy-actions"><button disabled={!step} onClick={() => setStep(step - 1)}>Anterior</button><span>{step} / {item.moves.length}</span><button disabled={step === item.moves.length} onClick={() => setStep(step + 1)}>Siguiente</button></div>
    </aside></div>
  </div>;
}
