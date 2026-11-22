import { useEffect, useRef } from 'react';
import { BookOpenCheck, Sparkles, X } from 'lucide-react';

export function LessonsDialog({ onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => { if (element.open) element.close(); };
  }, []);
  return <dialog ref={dialog} className="settings-dialog lessons-dialog" aria-labelledby="lessons-title" onClose={onClose}
    onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
    <div className="settings-shell">
      <header className="settings-header">
        <div><p className="settings-eyebrow">EL GAMBITO DE FAUSTO</p><h2 id="lessons-title">Lecciones y prácticas</h2></div>
        <button className="settings-close" type="button" aria-label="Cerrar lecciones" onClick={() => dialog.current.close()}><X size={21} /></button>
      </header>
      <div className="lessons-coming-soon">
        <div className="lessons-emblem" aria-hidden="true"><BookOpenCheck size={46} /><Sparkles size={22} /></div>
        <p className="settings-eyebrow">PRÓXIMAMENTE</p>
        <h3>Una nueva aventura está en camino</h3>
        <p>Estamos preparando lecciones y prácticas para aprender ajedrez paso a paso, con la ayuda de tu mentor.</p>
        <button type="button" onClick={() => dialog.current.close()}>Volver a la partida</button>
      </div>
    </div>
  </dialog>;
}
