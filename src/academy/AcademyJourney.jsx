import { BookOpen, Check, ChevronRight, Flag, Sparkles, Swords } from 'lucide-react';
import { academyContent } from './content.js';
import { mentors } from '../../shared/mentors.js';
import { lessonOrder, lessonNumber } from './sequence.js';

const chapters = [
  { title: 'Primeros pasos', description: 'Descubre cómo un peón puede convertirse en una pieza más poderosa.', ids: ['promocion'], Icon: Flag },
  { title: 'Descubre la táctica', description: 'Aprende a reconocer amenazas y a coordinar tus piezas.', ids: ['doble', 'clavada', 'mate-octava', 'descubierta'], Icon: Sparkles },
  { title: 'Peones y estrategia', description: 'Construye planes y aprende a activar tus piezas.', ids: ['peon-pasado', 'columna-abierta', 'puesto-avanzado'], Icon: BookOpen },
  { title: 'Aperturas y defensas', description: 'Da tus primeros pasos con blancas y con negras.', ids: ['italiana', 'siciliana', 'espanola', 'francesa', 'gambito-dama', 'caro-kann', 'escandinava', 'escocesa', 'londres', 'eslava', 'inglesa', 'india-rey'], Icon: Swords },
];
const ordered = lessonOrder;

export function AcademyJourney({ progress, mentor, onStart }) {
  const nextId = ordered.find(id => !progress[id]?.practice) || ordered[0];
  const next = academyContent.find(item => item.id === nextId);
  const count = ordered.filter(id => progress[id]?.practice).length;
  return <div className="journey">
    <div className="journey-welcome"><div><p className="settings-eyebrow">TU CAMINO DE APRENDIZAJE</p><h3>{count === ordered.length ? 'Has recorrido todas las lecciones' : 'Tu próximo paso: ' + next.title}</h3><p>{count === ordered.length ? 'Elige cualquier capítulo para volver a practicar.' : 'Lección ' + lessonNumber(next.id) + ' · ' + next.summary}</p><button onClick={() => onStart(next, progress[nextId]?.guide ? 'practice' : 'guide')}><BookOpen size={17} /> {count ? 'Continuar aprendiendo' : 'Comenzar mi camino'} <ChevronRight size={16} /></button></div><img src={mentors[mentor].image} alt="" /></div>
    <div className="journey-progress"><div><strong>Tu progreso</strong><span>{count} de {ordered.length} prácticas completadas</span></div><progress value={count} max={ordered.length} aria-label="Prácticas completadas" /></div>
    {chapters.map(({ title, description, ids, Icon }, chapterIndex) => <details className="journey-chapter" key={title} open={ids.includes(nextId) ? true : undefined}><summary className="journey-chapter-title"><span className="journey-chapter-icon"><Icon size={21}/></span><div><p className="settings-eyebrow">CAPÍTULO {chapterIndex + 1}</p><h3>{title}</h3><p>{description}</p><small>{ids.filter(id => progress[id]?.practice).length} / {ids.length} prácticas</small></div><ChevronRight className="chapter-chevron" size={20} /></summary>
      <ol className="journey-list">{ids.map(id => { const item = academyContent.find(value => value.id === id); const done = Boolean(progress[id]?.practice); return <li key={id} className="journey-item"><span className={'journey-number' + (done ? ' done' : '')}>{done ? <Check size={19} aria-label="Completado" /> : String(lessonNumber(id)).padStart(2, '0')}</span><div className="journey-item-text"><span>{item.level} · {item.section === 'Lecciones' ? 'LECCIÓN' : item.side === 'w' ? 'BLANCAS' : 'NEGRAS'}</span><h4>{item.title}</h4><p>{item.summary}</p></div><button onClick={() => onStart(item, 'guide')} aria-label={'Ver guía: ' + item.title}>{done ? 'Repasar' : 'Explorar'} <ChevronRight size={16}/></button></li>; })}</ol>
    </details>)}
    <p className="journey-footnote">Puedes entrar en cualquier tema. Seguiremos ampliando este camino con nuevos niveles y ejercicios.</p>
  </div>;
}
