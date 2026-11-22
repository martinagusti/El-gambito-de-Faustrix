import './board-options.css';

export const boardDesigns = {
  'biblioteca-dorada': 'Biblioteca Dorada',
  'marmol-imperial': 'Mármol Imperial',
  'nogal-clasico': 'Nogal Clásico',
  'esmeralda-antigua': 'Esmeralda Antigua',
  'reino-encantado': 'Reino Encantado',
  'aventura-en-el-bosque': 'Aventura en el Bosque',
  'bosque-encantado': 'Bosque Encantado',
  'forja-del-dragon': 'Forja del Dragón',
  'observatorio-celestial': 'Observatorio Celestial',
  'reino-elfico': 'Reino Élfico',
  'santuario-del-mago': 'Santuario del Mago',
  'templo-perdido': 'Templo Perdido',
};

export const boardPreference = 'fausto.board-design';
export const boardViewPreference = 'fausto.board-view';

export function BoardOptions({ selected, onChange, view, onViewChange }) {
  return <section className="board-options">
    <div className="options-section-heading">
      <div><h3>Elegí tu tablero</h3><p>La selección se aplica al instante.</p></div>
      <label className="board-view-choice">Vista
        <select value={view} onChange={event => onViewChange(event.target.value)}>
          <option value="classic">Clásica</option>
          <option value="perspective">Perspectiva</option>
        </select>
      </label>
    </div>
    <div className="board-options-grid">
      {Object.entries(boardDesigns).map(([id, name]) => <label key={id} className="board-option">
        <input type="radio" name="board-design" value={id} checked={selected === id} onChange={() => onChange(id)} />
        <img src={'/themes/boards/' + id + '-preview.webp'} alt="" width="240" height="240" />
        <span>{name}</span>
      </label>)}
    </div>
  </section>;
}
