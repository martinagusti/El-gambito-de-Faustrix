const pieces = { p: 'peón', n: 'caballo', b: 'alfil', r: 'torre', q: 'dama', k: 'rey' };

// Solo se usa para una consulta explícita sobre la candidata validada por el servidor.
export function candidateFallback(data) {
  const candidate = data.candidateUci;
  if (!candidate || !/(?:jugada|candidata|jugar|comp[aá]ra)/iu.test(data.question || '')) return null;
  const lines = [data.analysis?.candidateLine, ...(data.analysis?.bestLines || [])].filter(Boolean);
  const line = lines.find(item => item.moveUci === candidate);
  const facts = line?.facts;
  if (!line?.moveSan || !facts || !pieces[facts.piece]) return null;
  if (!/candidata/iu.test(data.question || '') && !(data.question || '').toLowerCase().includes(line.moveSan.toLowerCase())) return null;
  const piece = pieces[facts.piece];
  const label = facts.piece === 'q' || facts.piece === 'r' ? 'La' : 'El';
  const capture = facts.captured && pieces[facts.captured] ? ` captura ${facts.captured === 'n' ? 'un' : facts.captured === 'p' ? 'un' : facts.captured === 'r' ? 'una' : facts.captured === 'b' ? 'un' : 'la'} ${pieces[facts.captured]}` : '';
  if (data.level === 'firstSteps') {
    const action = capture ? `${label} ${piece}${capture}` : `Mueves ${label.toLowerCase()} ${piece}`;
    return { verdict: 'uncertain', explanation: action + (facts.givesCheck ? ' y pones al rey rival en peligro.' : '.') +
      (facts.givesCheck ? ' El rival debe proteger a su rey.' : ''), hint: '', verifiedLineIds: [], followUpQuestion: '' };
  }
  const action = capture ? `${label} ${piece}${capture}` : `${label} ${piece} se mueve a ${facts.to}`;
  const response = facts.verifiedNextMove ? ` Una posible respuesta del rival es ${facts.verifiedNextMove}.` : '';
  return { verdict: 'uncertain', explanation: `${line.moveSan}: ${action}${facts.givesCheck ? ' y da jaque' : ''}.${response} No puedo precisar ahora si la jugada es buena o arriesgada.`,
    hint: '', verifiedLineIds: [line.id], followUpQuestion: '' };
}
