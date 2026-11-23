import { useEffect, useRef, useState } from 'react';
import { BookOpen, Palette, Settings2, Volume2, X } from 'lucide-react';
import { BoardOptions } from './BoardOptions.jsx';
import { Controls } from './Controls.jsx';
import './board-options.css';

const tabs = [
  { id: 'design', label: 'Diseño', icon: Palette },
  { id: 'game', label: 'Partida', icon: Settings2 },
  { id: 'history', label: 'Jugadas', icon: BookOpen },
  { id: 'sound', label: 'Sonido', icon: Volume2 },
];

export function SettingsDialog({ initialTab, onClose, game, onReset, selected, onChange, view, onViewChange, soundEnabled, onSoundChange }) {
  const dialog = useRef(null);
  const [tab, setTab] = useState(initialTab);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => { if (element.open) element.close(); };
  }, []);

  function onTabKey(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = tabs.findIndex(item => item.id === tab);
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 :
      (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    setTab(tabs[index].id);
    document.getElementById('settings-tab-' + tabs[index].id)?.focus();
  }
  return <dialog ref={dialog} className="settings-dialog" aria-labelledby="settings-title" onClose={onClose}
    onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
    <div className="settings-shell">
      <header className="settings-header">
        <div><p className="settings-eyebrow">EL GAMBITO DE FAUSTO</p><h2 id="settings-title">Opciones</h2></div>
        <button className="settings-close" type="button" aria-label="Cerrar opciones" onClick={() => dialog.current.close()}><X size={21} /></button>
      </header>
      <div className="settings-tabs" role="tablist" aria-label="Secciones de opciones" onKeyDown={onTabKey}>
        {tabs.map(({ id, label, icon: Icon }) => <button key={id} id={'settings-tab-' + id} type="button" role="tab"
          aria-selected={tab === id} aria-controls={'settings-panel-' + id} tabIndex={tab === id ? 0 : -1}
          className={tab === id ? 'selected' : ''} onClick={() => setTab(id)}><Icon size={17} />{label}</button>)}
      </div>
      <div className="settings-content">
        <div role="tabpanel" id="settings-panel-design" aria-labelledby="settings-tab-design" hidden={tab !== 'design'}>
          <BoardOptions selected={selected} onChange={onChange} view={view} onViewChange={onViewChange} />
        </div>
        <Controls game={game} onReset={onReset} activeTab={tab} />
        <div role="tabpanel" id="settings-panel-sound" aria-labelledby="settings-tab-sound" hidden={tab !== 'sound'}>
          <div className="options-section-heading"><div><h3>Sonidos del juego</h3><p>Escucha los movimientos, el mentor y las acciones de la partida.</p></div></div>
          <label className="sound-setting"><span><strong>Efectos de sonido</strong><small>Incluye tablero, botones, análisis y mentor. Sin música.</small></span>
            <input type="checkbox" role="switch" checked={soundEnabled} onChange={event => onSoundChange(event.target.checked)} aria-label="Efectos de sonido" />
          </label>
        </div>
      </div>
    </div>
  </dialog>;
}
