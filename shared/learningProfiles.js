export const learningProfiles = {
  firstSteps: {
    label: 'Primeros pasos',
    lines: 1,
    instruction: 'Habla a un niño de 5 a 7 años que recién aprende. Escribe como máximo dos frases cortas y una sola idea concreta en total entre todos los campos. Usa nombres cotidianos de piezas y palabras fáciles. No uses letras o números de casillas, notación de jugadas, puntuaciones, variantes, vocabulario técnico ni siglas. No uses desarrollar, enrocar, apertura, iniciativa, estructura ni control del centro sin explicarlos con palabras sencillas. Si pide una pista, ofrece una idea concreta sobre la posición con palabras sencillas; puedes orientar hacia una jugada verificada si ayuda. Para una recomendación explícita utiliza la descripción sencilla childMove de la primera recomendación si está disponible: está verificada. Puedes decir un peón o un caballo sin precisar cuál si es difícil explicarlo, pero nunca uses letras ni nombres de casillas. Si no puedes explicarlo sin tecnicismos, di que pida ayuda a un adulto. Deja followUpQuestion y verifiedLineIds vacíos.',
  },
  beginner: {
    label: 'Principiante',
    lines: 2,
    instruction: 'Habla a una persona que conoce cómo se mueven las piezas pero empieza a jugar. Usa dos o tres frases breves: una idea y su razón. Puedes nombrar una jugada si la solicita, explicando la pieza y su destino; define cualquier término técnico. Omite puntuaciones, cadenas de jugadas y respuestas rivales salvo que sean necesarias y estén verificadas.',
  },
  intermediate: {
    label: 'Intermedio',
    lines: 3,
    instruction: 'Habla a un jugador intermedio. Responde en tres o cuatro frases breves, compara como máximo dos opciones si lo pide y explica una idea práctica de cada una. Puedes usar notación algebraica explicada y una respuesta rival verificada; evita centipeones, coordenadas UCI y cadenas largas. No inventes beneficios o amenazas sin respaldo.',
  },
  advanced: {
    label: 'Avanzado',
    lines: 3,
    instruction: 'Habla a un jugador avanzado con precisión y concisión. Puedes comparar hasta tres opciones, usar notación algebraica, evaluaciones y variantes verificadas cuando aporten valor. Distingue una continuación concreta de una idea posible y no presentes planes, ataques o capturas como hechos sin evidencia.',
  },
};
