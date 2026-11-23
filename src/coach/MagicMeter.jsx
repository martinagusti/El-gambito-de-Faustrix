import { useEffect, useRef, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import './magic-meter.css';

const euro = value => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value);
const count = value => new Intl.NumberFormat('es-ES').format(value);

function MagicDialog({ data, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => { if (element.open) element.close(); };
  }, []);
  return <dialog ref={dialog} className="settings-dialog magic-dialog" aria-labelledby="magic-title" onClose={onClose}
    onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
    <div className="magic-detail">
      <header className="settings-header"><div><p className="settings-eyebrow">EL GAMBITO DE FAUSTO</p><h2 id="magic-title">Tu energía mágica</h2></div>
        <button className="settings-close" type="button" aria-label="Cerrar consumo" onClick={() => dialog.current.close()}><X size={21} /></button></header>
      <div className="magic-detail-content">
        <p>Tu magia se recupera cada día y se ajusta al presupuesto que queda para el mes.</p>
        <div className="magic-stat-grid">
          <div><small>Disponible hoy</small><strong>{euro(data.dailyRemaining)}</strong><span>de {euro(data.dailyLimit)}</span></div>
          <div><small>Gastado este mes</small><strong>{euro(data.monthSpent)}</strong><span>de {euro(data.monthlyLimit)}</span></div>
        </div>
        <h3>Consumo del mes</h3>
        <dl className="magic-tokens"><div><dt>Tokens de entrada</dt><dd>{count(data.inputTokens)}</dd></div>
          <div><dt>De entrada, en caché</dt><dd>{count(data.cachedTokens)}</dd></div>
          <div><dt>Tokens de salida</dt><dd>{count(data.outputTokens)}</dd></div>
          <div><dt>Llamadas registradas</dt><dd>{count(data.calls)}</dd></div>
          <div><dt>Consumos pendientes o estimados</dt><dd>{count(data.uncertainCalls)}</dd></div></dl>
        <p className="magic-footnote">Estimación desde la activación, calculada por el servidor; puede diferir de tu factura de Azure. Las llamadas interrumpidas o sin datos de consumo conservan una reserva estimada.</p>
        <p className="magic-footnote">Despliegue: {data.model}. Tarifas configuradas por millón de tokens: entrada ${data.rates.input}, caché ${data.rates.cached}, salida ${data.rates.output}; cambio {data.rates.usdPerEur} USD/€ y multiplicador {data.rates.multiplier}.</p>
      </div>
    </div>
  </dialog>;
}
export function MagicMeter({ phase, onStatusChange }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let alive = true;
    async function refresh() {
      try { const response = await fetch('/api/magic', { cache: 'no-store' }); if (!response.ok) throw new Error(); const value = await response.json(); if (alive) { setData(value); setError(false); onStatusChange(value); } }
      catch { if (alive) setError(true); }
    }
    refresh(); const timer = setInterval(refresh, 20000);
    return () => { alive = false; clearInterval(timer); };
  }, [phase, onStatusChange]);
  return <>
    <button className="magic-meter" type="button" onClick={() => data && setOpen(true)} disabled={!data} aria-haspopup="dialog"
      aria-label={data ? 'Magia de hoy: ' + Math.floor(data.dailyPercent) + '% disponible. Ver consumo' : 'Contador de magia no disponible'}>
      <Sparkles size={19} className="magic-icon" /><span className="magic-meter-body"><span className="magic-meter-label"><strong>Magia de hoy</strong><span>{error ? 'Sin conexión' : data ? Math.floor(data.dailyPercent) + '% disponible' : 'Cargando…'}</span></span>
        <span className="magic-track" role="progressbar" aria-label="Magia disponible" aria-valuemin={0} aria-valuemax={100} aria-valuenow={data ? Math.floor(data.dailyPercent) : 0}><span style={{ width: (data?.dailyPercent ?? 0) + '%' }} /></span></span>
    </button>
    {open && data && <MagicDialog data={data} onClose={() => setOpen(false)} />}
  </>;
}
