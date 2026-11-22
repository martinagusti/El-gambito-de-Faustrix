# Arquitectura

La sesión conserva el FEN base y la lista de medias jugadas UCI en localStorage. Cada vista se reconstruye con chess.js y el historial completo, incluidas repeticiones. El tablero de variantes reproduce una copia del FEN visible y conserva la sesión original.

Cada Worker de Stockfish procesa una cola FIFO. El rival y el análisis usan instancias independientes. La cancelación en búsqueda envía stop y espera bestmove antes de reutilizar el Worker. Un timeout termina el Worker para que la siguiente petición pueda inicializarlo. Se conserva la evaluación original desde el bando que juega al inicio de la búsqueda, incluidos mates y límites.

El profesor recibe FEN, historial, pregunta, candidata opcional y resultados de Stockfish. Express reconstruye la posición, valida el turno, reproduce las variantes para reconstruir SAN y filtra los identificadores permitidos en la respuesta. El análisis aportado por el navegador es adecuado para una instalación local de confianza. Las evaluaciones requerirían verificación independiente antes de ofrecer la API públicamente.

El tema activo registra colores y piezas en src/theme.js. El fondo y las doce piezas son recursos separados. Los scripts de render solo son necesarios si se quieren volver a generar.

