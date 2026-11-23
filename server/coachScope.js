const clockQuestion = /^(?:(?:hola )?(?:(?:me )?(?:puedes |podrias )?(?:decir(?:me)?|dime|sabes) )?)?(?:que hora es|la hora|hora actual|hora es)(?: ahora| ahora mismo| hoy)?$/u;

export function isClearlyOffTopic(question) {
  const normalized = question.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
    .replace(/[^a-z0-9 ]/gu, ' ').replace(/\s+/gu, ' ').trim();
  return clockQuestion.test(normalized);
}

export function offTopicAnswer(mentor) {
  const replies = {
    fausto: 'Mi magia solo alcanza el tablero. Pregúntame por una jugada y te ayudaré.',
    selene: 'Las estrellas me guían en el ajedrez. Pregúntame por el tablero y lo exploraremos juntas.',
    broin: 'En mi taller solo forjo consejos de ajedrez. ¡Pregúntame por una jugada!',
  };
  return { verdict: 'out_of_scope', explanation: replies[mentor] ?? replies.fausto,
    hint: '', verifiedLineIds: [], followUpQuestion: '' };
}
