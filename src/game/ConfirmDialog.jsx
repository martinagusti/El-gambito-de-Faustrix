import { useEffect, useRef } from 'react';
import { Crown, X } from 'lucide-react';
import './confirm-dialog.css';

export function ConfirmDialog({ title, description, confirmLabel, onConfirm, onCancel }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => { if (element.open) element.close(); };
  }, []);
  return <dialog ref={dialog} className="settings-dialog confirm-dialog" aria-labelledby="confirmation-title"
    aria-describedby="confirmation-description" onClose={onCancel}
    onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
    <div className="confirm-content">
      <button className="confirm-close" type="button" aria-label="Cerrar confirmación" onClick={() => dialog.current.close()}><X size={19} /></button>
      <div className="confirm-emblem" aria-hidden="true"><Crown size={29} /></div>
      <p className="settings-eyebrow">EL GAMBITO DE FAUSTO</p>
      <h2 id="confirmation-title">{title}</h2>
      <p id="confirmation-description">{description}</p>
      <div className="confirm-actions">
        <button type="button" autoFocus onClick={() => dialog.current.close()}>Cancelar</button>
        <button className="confirm-primary" type="button" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </div>
  </dialog>;
}
