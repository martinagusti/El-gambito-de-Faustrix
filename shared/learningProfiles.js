export const learningProfiles = {
  firstSteps: {
    label: 'Primeros pasos',
    lines: 1,
    instruction: 'Habla a un niño que está empezando. Usa una idea concreta, palabras cotidianas y como máximo dos frases cortas. Nombra la pieza y describe la casilla en palabras. Evita puntuaciones, notación técnica y cadenas de jugadas. Si pide pista, haz una pregunta corta sin revelar la jugada y devuelve verifiedLineIds vacío.',
  },
  beginner: {
    label: 'Principiante',
    lines: 2,
    instruction: 'Explica con palabras sencillas una recomendación y la primera respuesta rival, si está verificada. Define los términos al introducirlos.',
  },
  intermediate: {
    label: 'Intermedio',
    lines: 3,
    instruction: 'Compara las opciones disponibles por su idea, beneficio y riesgo. Señala la diferencia práctica y la respuesta rival que la provoca.',
  },
  advanced: {
    label: 'Avanzado',
    lines: 3,
    instruction: 'Usa notación algebraica y evaluaciones cuando sean útiles. Explica planes, estructuras o secuencias tácticas concretas con las variantes verificadas disponibles.',
  },
};
