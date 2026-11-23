import { useEffect, useRef } from 'react';
import { Crown, X } from 'lucide-react';
import './confirm-dialog.css';

export function GameResultDialog({ result, onRestart, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => { if (element.open) element.close(); };
  }, []);
  return <dialog ref={dialog} className="settings-dialog confirm-dialog" aria-labelledby="result-title"
    aria-describedby="result-description" onClose={onClose}>
    <div className="confirm-content">
      <button className="confirm-close" type="button" aria-label="Cerrar resultado" onClick={() => dialog.current.close()}><X size={19} /></button>
      <div className="confirm-emblem" aria-hidden="true"><Crown size={29} /></div>
      <p className="settings-eyebrow">EL GAMBITO DE FAUSTO</p>
      <h2 id="result-title">{result.title}</h2>
      <p id="result-description">{result.description}</p>
      <div className="confirm-actions">
        <button type="button" onClick={() => dialog.current.close()}>Salir</button>
        <button className="confirm-primary" type="button" autoFocus onClick={onRestart}>Nueva partida</button>
      </div>
    </div>
  </dialog>;
}
