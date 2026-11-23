import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { mentors } from '../../shared/mentors.js';
import { learningProfiles } from '../../shared/learningProfiles.js';
import './mentor-dialog.css';

const levelDescriptions = {
  firstSteps: 'Explicaciones breves, con palabras sencillas para quienes empiezan.',
  beginner: 'Explicaciones sencillas para entender las ideas principales.',
  intermediate: 'Compara jugadas, sus ideas y sus riesgos.',
  advanced: 'Explicaciones más detalladas con notación, evaluaciones y planes.',
};

export function MentorDialog({ selected, onSelect, learningLevel, onLevelChange, levelDisabled, onClose }) {
  const dialog = useRef(null);
  const [preview, setPreview] = useState(selected);
  const character = mentors[preview];
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => { if (element.open) element.close(); };
  }, []);
  return <dialog ref={dialog} className="settings-dialog mentor-dialog" aria-labelledby="mentor-dialog-title" onClose={onClose}
    onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
    <div className="settings-shell">
      <header className="settings-header">
        <div><p className="settings-eyebrow">EL GAMBITO DE FAUSTO</p><h2 id="mentor-dialog-title">Conoce a tus mentores</h2></div>
        <button className="settings-close" type="button" aria-label="Cerrar mentores" onClick={() => dialog.current.close()}><X size={21} /></button>
      </header>
      <div className="mentor-dialog-content">
        <p className="mentor-dialog-lead">Elige quién te acompañará en tus partidas. Cada mentor tiene su propia historia y forma de explicar.</p>
        <div className="mentor-choice-list" role="group" aria-label="Elegir mentor para ver su historia">
          {Object.entries(mentors).map(([id, item]) => <button key={id} type="button" className={'mentor-choice' + (preview === id ? ' selected' : '')}
            aria-pressed={preview === id} onClick={() => setPreview(id)}>
            <img src={item.image} alt="" /><span>{item.shortName}</span>{selected === id && <small>Actual</small>}
          </button>)}
        </div>
        <div className="mentor-level-settings">
          <label htmlFor="mentor-learning-level">Nivel de aprendizaje</label>
          <select id="mentor-learning-level" disabled={levelDisabled} value={learningLevel} onChange={event => onLevelChange(event.target.value)}>
            {Object.entries(learningProfiles).map(([id, profile]) => <option key={id} value={id}>{profile.label}</option>)}
          </select>
          <p>{levelDescriptions[learningLevel]} La fuerza del rival se ajusta por separado en Opciones → Partida.</p>
        </div>
        <div className="mentor-detail" aria-live="polite">
          <img className="mentor-detail-image" src={character.image} alt={'Retrato de ' + character.shortName} />
          <div className="mentor-detail-copy"><p className="settings-eyebrow">TU GUÍA EN EL TABLERO</p><h3>{character.shortName}</h3>
            <p className="mentor-detail-title">{character.title}</p><p className="mentor-biography">{character.biography}</p>
            <button className="mentor-select" type="button" disabled={preview === selected} onClick={() => onSelect(preview)}>
              {preview === selected ? <><Check size={17} /> Mentor seleccionado</> : 'Elegir a ' + character.shortName}
            </button>
            {preview !== selected && <p className="mentor-change-note">Al cambiar de mentor comenzará una nueva conversación.</p>}
          </div>
        </div>
      </div>
    </div>
  </dialog>;
}
