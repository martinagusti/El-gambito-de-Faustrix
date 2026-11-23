const technical = /\b(?:centipeones?|evaluaci[oó]n|variante(?:s)?|notaci[oó]n|iniciativa|estructura|desarroll(?:a|ar|o|ando|a[rn]te)|enr[oó]cate|enrocar(?:te)?|enroque|apertura|posicional|t[aá]ctic[oa]s?|sacrificio|diagonal|coordenadas?|pv[0-9]+)\b/iu;
const notation = /\b(?:[a-h][1-8]|[KQRBN][a-h]?[1-8]?x?[a-h][1-8]|O-O(?:-O)?|[+#-]?\d+[.,]\d+|[a-h][1-8][a-h][1-8])\b|\b(?:pe[oó]n|caballo|alfil|torre|dama|rey)\s+de\s+[a-h]\b/iu;

export function childAnswerIssue(answer, isHint) {
  const text = isHint ? answer.hint : [answer.explanation, answer.hint].filter(Boolean).join(' ');
  if (!text?.trim()) return 'Falta una respuesta útil.';
  if (!isHint) return '';
  if (technical.test(text)) return 'La respuesta usa palabras técnicas.';
  if (notation.test(text)) return 'La respuesta usa notación de ajedrez o coordenadas.';
  if (isHint && /\b(?:un|una|dos|1|2)\s+(?:casilla|casillas|paso|pasos)\b|\bpe[oó]n\b.{0,35}\b(?:rey|dama)\b/iu.test(text)) return 'La pista revela demasiado sobre una jugada concreta.';
  return '';
}

export function normalizeChildAnswer(answer, isHint) {
  if (isHint) return { ...answer, explanation: '', followUpQuestion: '', verifiedLineIds: [] };
  return { ...answer, followUpQuestion: '', verifiedLineIds: [] };
}

export function childFallback(isHint, data = {}) {
  const wantsMove = /(?:qu[eé] (?:deber[ií]a|puedo|debo|hago|juego)|recomi[eé]nda|sugiere|mejor jugada)/iu.test(data.question || '');
  const move = wantsMove ? data.analysis?.bestLines?.[0]?.facts?.childMove : undefined;
  const simpleMove = move?.replace('1 paso(s)', 'un paso').replace('2 paso(s)', 'dos pasos');
  const explanation = simpleMove
    ? 'Una posibilidad es ' + simpleMove.charAt(0).toLowerCase() + simpleMove.slice(1) + '.'
    : 'No puedo explicarlo con suficiente claridad. Pide ayuda a un adulto para revisar el tablero.';
  return { verdict: 'uncertain', explanation: isHint ? '' : explanation,
    hint: isHint ? 'Pista general: mira tus piezas y piensa cuál puede ayudar a proteger a tu rey.' : '', verifiedLineIds: [], followUpQuestion: '' };
}

export function generalAnswerIssue(answer, _level, isHint) {
  const text = isHint ? answer.hint : [answer.explanation, answer.hint].filter(Boolean).join(' ');
  if (!text?.trim()) return 'Falta una respuesta útil.';
  if (isHint && /\b(?:[KQRBN][a-h]?[1-8]?x?[a-h][1-8]|[a-h][1-8][a-h][1-8]|[a-h][1-8]|O-O(?:-O)?)\b|\b(?:un|una|dos|1|2)\s+(?:casilla|casillas|paso|pasos)\b/iu.test(text)) return 'La pista revela una jugada concreta.';
  return '';
}
