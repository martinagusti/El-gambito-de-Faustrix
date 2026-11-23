// Las posiciones adicionales se mantienen separadas del ejemplo de la guía.
const extraExercises = {
  promocion: [{ fen: 'k7/7P/8/8/8/8/8/7K w - - 0 1', moves: ['h7h8q'],
    intro: 'Ahora promociona el peón del otro lado del tablero.', explanations: ['El peón llega a h8 y promociona a dama.'],
    hints: ['Lleva el peón hasta la última fila.', 'Avanza el peón de h7 a h8.'], finish: 'El peón ha llegado a h8 y se ha convertido en dama.' }],
  doble: [{ fen: '3k3r/8/8/6N1/8/8/8/4K3 w - - 0 1', moves: ['g5f7'],
    intro: 'Encuentra otro ataque doble del caballo contra el rey y la torre.', explanations: ['El caballo salta a f7 y ataca al rey y a la torre.'],
    hints: ['Busca un salto que dé jaque y ataque a la torre.', 'El caballo puede ir a f7.'], finish: 'El caballo en f7 amenaza al rey de d8 y a la torre de h8.' }],
  clavada: [{ fen: '3k4/3q4/8/8/8/8/8/K6R w - - 0 1', moves: ['h1d1'],
    intro: 'Esta vez clava la dama negra contra su rey en otra columna.', explanations: ['La torre va a d1 y clava la dama contra el rey.'],
    hints: ['Alinea la torre con la dama y el rey.', 'Mueve la torre de h1 a d1.'], finish: 'La dama está clavada en la columna d.' },
  { fen: '8/3k4/2q5/8/8/1B6/7K/8 w - - 0 1', moves: ['b3a4'],
    intro: 'Clava la dama contra el rey usando la diagonal del alfil.', explanations: ['El alfil se mueve a a4 y clava la dama de c6 contra el rey de d7.'],
    hints: ['Busca una diagonal que pase por la dama y el rey.', 'Mueve el alfil de b3 a a4.'], finish: 'El alfil en a4 clava la dama contra el rey por la diagonal.' }],
  'mate-octava': [{ fen: '1k6/ppp5/8/8/8/8/8/5K1R w - - 0 1', moves: ['h1h8'],
    intro: 'Encuentra el mate de última fila desde el otro lado del tablero.', explanations: ['La torre llega a h8 y da mate.'],
    hints: ['Controla la última fila con la torre.', 'Mueve la torre de h1 a h8.'], finish: 'La torre da mate en la última fila.' }],
  descubierta: [{ fen: '3k4/6q1/8/8/3B4/8/8/K2R4 w - - 0 1', moves: ['d4g7'],
    intro: 'Captura la dama abriendo a la vez la columna de la torre.', explanations: ['El alfil captura la dama y descubre el jaque de la torre.'],
    hints: ['El alfil puede capturar y descubrir un jaque.', 'Mueve el alfil de d4 a g7.'], finish: 'La torre da jaque a la descubierta mientras el alfil captura la dama.' }],
  'peon-pasado': [{ fen: 'k7/8/8/7P/8/8/8/K7 w - - 0 1', moves: ['h5h6'],
    intro: 'Avanza este peón pasado hacia la promoción.', explanations: ['El peón avanza de h5 a h6.'],
    hints: ['Acerca el peón a la última fila.', 'Mueve el peón de h5 a h6.'], finish: 'El peón pasado se acerca a la promoción.' }],
  'columna-abierta': [{ fen: 'k7/3p4/8/8/8/8/8/K6R w - - 0 1', moves: ['h1d1'],
    intro: 'Activa la torre en la columna semiabierta para presionar el peón negro.', explanations: ['La torre se sitúa en d1 y ataca d7.'],
    hints: ['Busca la columna del peón negro.', 'Mueve la torre de h1 a d1.'], finish: 'La torre presiona el peón de d7.' }],
  'puesto-avanzado': [{ fen: 'k7/7p/8/8/5P2/5N2/8/K7 w - - 0 1', moves: ['f3e5'],
    intro: 'Lleva el caballo a la casilla central protegida por el peón f4.', explanations: ['El caballo llega a e5 apoyado por f4.'],
    hints: ['Busca una casilla protegida por el peón.', 'Mueve el caballo de f3 a e5.'], finish: 'El caballo está en e5, defendido por el peón de f4.' }],
};
export function exercisesFor(item) {
  return [item, ...(extraExercises[item.id] || []).map((exercise, index) => ({ ...item, ...exercise, id: item.id + '-ejercicio-' + (index + 2) }))];
}
