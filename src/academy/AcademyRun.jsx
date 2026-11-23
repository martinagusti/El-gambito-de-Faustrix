import { useState } from 'react';
import { AcademyActivity } from './AcademyActivity.jsx';
import { exercisesFor } from './exercises.js';
import { readingFor } from './readingContent.js';

const priority = { 'sin ayuda': 0, 'con intentos': 1, 'con ayuda': 2, 'solución vista': 3 };
export function AcademyRun({ item, mode, next, onStart, onComplete, onAttempt, ...props }) {
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [worst, setWorst] = useState('sin ayuda');
  const [results, setResults] = useState([]);
  const exercises = mode === 'practice' ? exercisesFor(item) : [item];
  const last = index === exercises.length - 1;
  function complete(_id, value) {
    if (mode === 'guide') { onComplete(item.id, value); return; }
    const combined = priority[value] > priority[worst] ? value : worst;
    setWorst(combined); setResult(combined); setResults(previous => [...previous, value]);
    if (last) onComplete(item.id, combined);
  }
  return <AcademyActivity key={exercises[index].id} {...props} item={exercises[index]} mode={mode}
    exerciseIndex={index + 1} exerciseCount={exercises.length} nextTitle={next?.title} results={results}
    onComplete={complete} onAttempt={() => onAttempt(item.id)}
    onPractice={() => onStart(item, 'practice')} onRepeat={() => onStart(item, 'practice-repeat')} 
    onReading={readingFor(item.id) ? () => onStart(item, 'reading') : null}
    onNextExercise={result && !last ? () => { setResult(null); setIndex(index + 1); } : null}
    onNextLesson={next ? () => onStart(next, 'guide') : null} />;
}
