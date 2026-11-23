import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { academyContent } from '../academy/content.js';
import { AcademyJourney } from '../academy/AcademyJourney.jsx';
import { lessonNumber, nextLesson } from '../academy/sequence.js';
import { AcademyRun } from '../academy/AcademyRun.jsx';
import { ReadingGuide } from '../academy/ReadingGuide.jsx';
import { readingGuides } from '../academy/readingContent.js';
import '../academy/academy.css';

const storageKey = 'fausto.academy.v1';
function loadProgress() { try { const data = JSON.parse(localStorage.getItem(storageKey)); return data && typeof data === 'object' && !Array.isArray(data) ? data : {}; } catch { return {}; } }
function saveProgress(data) { try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch { /* Progress remains in memory. */ } }
export function LessonsDialog({ onClose, design, level, mentor }) {
  const dialog = useRef(null);
  const [tab, setTab] = useState('Aprender');
  const [activity, setActivity] = useState(null);
  const [progress, setProgress] = useState(loadProgress);
  const [filter, setFilter] = useState('Todos');
  useEffect(() => { const element = dialog.current; element.showModal(); return () => { if (element.open) element.close(); }; }, []);
  function update(fn) { setProgress(previous => { const next = fn(previous); saveProgress(next); return next; }); }
  function start(item, mode) { update(previous => ({ ...previous, last: { id: item.id, mode } })); setActivity(previous => ({ item, mode: mode === 'practice-repeat' ? 'practice' : mode, runId: (previous?.runId ?? 0) + 1 })); }
  function complete(id, result) {
    update(previous => ({ ...previous, [id]: { ...previous[id], [result === 'guía completada' ? 'guide' : 'practice']: result, ...(result === 'sin ayuda' ? { review: false } : {}) } }));
  }
  function attempt(id) { update(previous => ({ ...previous, [id]: { ...previous[id], review: true } })); }
  const items = academyContent.filter(item => {
    if (tab === 'Lecciones' && item.section !== 'Lecciones') return false;
    if (filter === 'Aperturas y defensas' && item.section !== 'Aperturas y defensas') return false;
    if (tab === 'Practicar' && filter === 'Para repasar' && !progress[item.id]?.review) return false;
    if (filter === 'Inicial' || filter === 'Intermedio' || filter === 'Avanzado') return item.level === filter;
    if (filter === 'Blancas') return item.side === 'w';
    if (filter === 'Negras') return item.side === 'b';
    return true;
  });
  return <dialog ref={dialog} className="settings-dialog lessons-dialog academy-dialog" aria-labelledby="lessons-title" onClose={onClose}>
    <div className="settings-shell"><header className="settings-header"><div><p className="settings-eyebrow">EL GAMBITO DE FAUSTO</p><h2 id="lessons-title">Academia de ajedrez</h2></div><button className="settings-close" type="button" aria-label="Cerrar lecciones" onClick={() => dialog.current.close()}><X size={21} /></button></header>
      {!activity && <nav className="settings-tabs academy-tabs" aria-label="Secciones de la academia">{['Aprender', 'Practicar', 'Biblioteca'].map(name => <button key={name} className={tab === name ? 'selected' : ''} aria-current={tab === name ? 'page' : undefined} onClick={() => { setTab(name); setFilter('Todos'); }}>{name}</button>)}</nav>}
      <div className="academy-content">{activity ? activity.mode === 'reading' ? <ReadingGuide item={activity.item} design={design} onStart={start} onBack={() => { setActivity(null); setTab('Biblioteca'); setFilter('Todos'); }} /> : <AcademyRun key={activity.item.id + activity.mode + activity.runId} {...activity} design={design} level={level} mentor={mentor} onBack={() => setActivity(null)} onComplete={complete} onAttempt={attempt} onStart={start} next={nextLesson(activity.item.id, academyContent)} /> : <>
        {tab === 'Aprender' ? <AcademyJourney progress={progress} mentor={mentor} onStart={start} /> : tab === 'Biblioteca' ? <><p className="academy-intro">Guías para leer con calma, explorar ejemplos en el tablero y practicar.</p><label className="academy-filter">Filtrar <select value={filter} onChange={event => setFilter(event.target.value)}><option>Todos</option><option>Fundamentos</option><option>Táctica</option><option>Peones y estrategia</option><option>Aperturas y defensas</option></select></label><div className="academy-cards">{readingGuides.filter(guide => filter === 'Todos' || guide.category === filter).map(guide => { const item = academyContent.find(value => value.id === guide.id); return <article className="academy-card" key={guide.id}><p className="settings-eyebrow">GUÍA DE LECTURA · {guide.category} · {guide.level}</p><h3>{guide.title}</h3><p>{guide.subtitle}</p><div className="academy-actions"><button onClick={() => start(item, 'reading')}>Abrir lectura</button><button onClick={() => start(item, 'practice')}>Practicar</button></div></article>; })}</div><p className="academy-note">Guías originales con ejemplos vinculados a las lecciones de la academia.</p></> : <>
        <p className="academy-intro">{tab === 'Practicar' ? 'Elige un tema y practica en el tablero.' : tab === 'Aperturas y defensas' ? 'Descubre las ideas y practica con blancas o negras.' : 'Comprende una idea y aplícala en el tablero.'}</p>
        {tab !== 'Aprender' && <label className="academy-filter">Filtrar <select value={filter} onChange={event => setFilter(event.target.value)}><option>Todos</option><option>Inicial</option><option>Intermedio</option><option>Avanzado</option><option>Aperturas y defensas</option><option>Blancas</option><option>Negras</option>{tab === 'Practicar' && <option>Para repasar</option>}</select></label>}
        <div className="academy-cards">{items.map(item => <article className="academy-card" key={item.id}><p className="settings-eyebrow">{String(lessonNumber(item.id)).padStart(2, '0')} · {item.level} · {item.side === 'w' ? 'BLANCAS' : 'NEGRAS'}</p><h3>{item.title}</h3><p>{item.summary}</p><small>{progress[item.id]?.practice ? 'Práctica: ' + progress[item.id].practice : progress[item.id]?.guide || 'Sin comenzar'}{progress[item.id]?.review ? ' · Para repasar' : ''}</small><div className="academy-actions">{tab !== 'Prácticas' && <button onClick={() => start(item, 'guide')}>Ver guía</button>}<button onClick={() => start(item, 'practice')}>Practicar</button></div></article>)}</div>
        {!items.length && <p>No hay actividades para este filtro.</p>}
        <p className="academy-note">Colección inicial en ampliación. El progreso se guarda en este navegador.</p></>}
      </>}</div></div></dialog>;
}
