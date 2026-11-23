# El Gambito de Fausto

Estudia una posición, juega contra Stockfish y consulta al profesor antes de decidir una jugada. Tema Biblioteca Dorada, sprites WebP originales y tablero React.

## Arranque local

Requiere Node.js 22.9+ y npm. Desde la raíz del proyecto en Windows, Linux o macOS:

```sh
npm install
npm run setup:engine
npm run dev
```

Abre http://127.0.0.1:5173.

## Profesor con Azure OpenAI

En Microsoft Foundry, despliega `gpt-5-mini`. Copia `.env.example` a `.env` si todavía no lo tienes (PowerShell: `Copy-Item .env.example .env`, Bash: `cp .env.example .env`). Configura estas variables en el servidor y reinicia.

| Variable | Valor |
| --- | --- |
| `AZURE_OPENAI_ENDPOINT` | Endpoint del recurso, como `https://mi-recurso.openai.azure.com`. También acepta el sufijo `/openai/v1/`. |
| `AZURE_OPENAI_API_KEY` | Clave del mismo recurso de Azure, visible en «Keys and Endpoint» del portal. |
| `AZURE_OPENAI_DEPLOYMENT` | Nombre exacto del despliegue en Foundry, por ejemplo `profesor-ajedrez`. |
| `AZURE_OPENAI_REASONING_EFFORT` | Opcional. Usa `minimal` con GPT-5 mini o nano para priorizar latencia. Déjalo vacío si el modelo elegido no admite ese valor. |

El cliente usa Azure OpenAI Responses API v1 con salida estructurada. En `http://127.0.0.1:3001/api/health`, `coachConfigured: true` confirma que el servidor ha cargado la configuración. La primera consulta desde el juego comprueba la credencial y el despliegue.

Con `npm run build` y `npm start`, Express sirve la aplicación compilada en http://127.0.0.1:3001. El servicio se enlaza al loopback para uso personal. Antes de exponerlo públicamente hace falta autenticación y control de cuota por usuario.

## Uso

- En **Opciones → Sonido** puedes activar o desactivar todos los efectos. Se guarda la elección en el navegador; no hay música. Los sonidos acompañan movimientos, capturas, enroques, jaques, fin de partida, botones, consultas y análisis.
- Cuando se agota el presupuesto del mentor, puedes usar la pestaña **Análisis** para consultar las recomendaciones locales sin consumir tokens.
- Al terminar una partida aparece el resultado tras dos segundos, con opciones para volver al tablero o comenzar otra partida. En partida contra el ordenador y dos jugadores, las flechas permiten revisar el historial; en estudio libre también puedes continuar desde una posición anterior, sustituyendo las jugadas posteriores.

- En **Controles de partida → Fuerza del rival**, selecciona Práctica, uno de los niveles clásicos o un Elo objetivo de 1400 a 2200. El Elo es una configuración de Stockfish y sirve como referencia de práctica.
- El **Perfil del Oráculo** es independiente y se guarda en el navegador. Primeros pasos muestra una sola idea, sin puntuaciones, y usa explicaciones breves. Los demás perfiles muestran más variantes y ajustan el detalle de las respuestas. El análisis local mantiene su fuerza en todos los perfiles.

- En **Opciones**, elegí uno de los doce diseños del tablero con vista previa. La elección se aplica sin reiniciar la partida y se guarda en el navegador.
- En **Opciones → Vista del tablero**, alterná entre **Clásica** (predeterminada) y **Perspectiva**. La vista se guarda junto con tus preferencias.

- **Jugar** usa Stockfish WASM. Abre Controles e historial para elegir color y dificultad, reiniciar o deshacer.
- **Estudio libre** permite mover ambos bandos, importar FEN o PGN y exportar la posición visible. Si mueves desde una jugada anterior, creas una rama a partir de esa posición.
- **Preparar jugada** dibuja una flecha. Puedes preguntar al profesor, comparar con otra opción o ejecutar la candidata.
- **Análisis** calcula líneas de Stockfish localmente. Es manual por defecto; «Actualizar automáticamente» analiza cada nueva posición y guarda la preferencia en el navegador. En una partida contra el ordenador espera la respuesta del rival. Al abrir una variante, puedes avanzar y retroceder en un tablero de análisis.
- Azure OpenAI se usa al enviar una pregunta y factura en la suscripción de Azure. Juego, estudio y evaluación de Stockfish son locales.

## Verificación

```sh
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

`src/game` contiene tablero, controles y sesión. `src/engine` ejecuta UCI y valida las líneas. `src/coach` contiene el chat. `server` valida la petición y llama a OpenAI. `shared/chess.js` reproduce jugadas y verifica SAN.

`npm run setup:engine` descarga a `public/engine` solo Stockfish 18 Lite Single y su licencia. Puedes repetirlo si se interrumpe la conexión. Stockfish usa GPLv3; fuentes de la compilación y licencias en [Stockfish.js](https://github.com/nmrugg/stockfish.js) y [Stockfish](https://github.com/official-stockfish/Stockfish). Si redistribuyes el binario, conserva los avisos y facilita el código fuente correspondiente de esa compilación.

El MVP termina la partida según las tablas reportadas por chess.js, incluidas triple repetición y 50 movimientos como final inmediato. No implementa el protocolo arbitral FIDE de reclamación ni relojes. Las respuestas del profesor se muestran al terminar su validación JSON. Un error WASM permite reintentar o pasar a estudio.




### Respuestas del mentor y niveles

El nivel de aprendizaje adapta el lenguaje de las respuestas mediante instrucciones. No se descartan respuestas por ser largas o contener tecnicismos. En las pistas se mantienen comprobaciones para evitar revelar la jugada; si no las supera, se solicita una corrección. Este reintento puede aumentar el tiempo de espera y el consumo de tokens. El análisis de jugadas sigue calculándose localmente.

Los hechos de ataques y movimientos enviados al mentor se calculan con chess.js; un ataque geométrico no demuestra que una captura sea legal o rentable. Las explicaciones generadas pueden contener errores o afirmaciones no demostradas y deben contrastarse con el tablero y las variantes. El historial enviado al mentor se limita a mensajes de la misma posición y nivel.

Si una respuesta está vacía o una pista revela demasiado, el servidor reintenta incluyendo la respuesta anterior como datos y registra en la consola el motivo, el nivel y el número de intento, sin registrar la pregunta ni el texto de la respuesta. Referencias comunes al motor se reformulan sin descartar la respuesta. Si ambos intentos fallan en una consulta explícita sobre una jugada candidata analizada, se ofrece una explicación limitada a hechos legales comprobados y, si está disponible, una posible respuesta del rival. El texto indica que no se ha podido valorar la jugada. Las comprobaciones de formato no garantizan la exactitud de las respuestas generadas.

El mentor prioriza la pregunta actual. Las preguntas ajenas al ajedrez reciben una respuesta del personaje, y las preguntas generales sobre reglas o conceptos no necesitan mostrar variantes de la partida. La detección de temas se apoya en el modelo y puede equivocarse ante frases ambiguas.


### Magia y presupuesto del asistente

El indicador muestra una estimación del gasto de las consultas realizadas desde su activación en este servidor. Por defecto reparte un límite de 2 EUR entre los días restantes del mes, con horario de Madrid. El presupuesto no gastado se reparte entre los días restantes. Cada llamada al modelo, incluidos los reintentos, reserva primero presupuesto y después registra los tokens de entrada, caché y salida. Una llamada interrumpida o sin datos de consumo conserva una estimación prudente, que puede ser mayor que el coste real. El análisis local sigue disponible cuando se agota la magia.

Los datos locales se guardan en `data/magic.sqlite`, excluidos de Git y del paquete de código. No recoge el uso anterior a su activación, el de otras aplicaciones ni otros servicios de Azure. **No es una factura ni una garantía del importe facturado**: comprueba el consumo en Azure y revisa región, modalidad y tarifas. El cálculo predeterminado no incluye impuestos. Elimina o perder esta base de datos reinicia el contador local; consérvala entre reinicios y despliegues.

En `.env` puedes configurar `MAGIC_MONTHLY_LIMIT_EUR`, `MAGIC_INPUT_USD_PER_MILLION`, `MAGIC_CACHED_INPUT_USD_PER_MILLION`, `MAGIC_OUTPUT_USD_PER_MILLION`, `MAGIC_USD_PER_EUR`, `MAGIC_COST_MULTIPLIER`, `MAGIC_TIMEZONE` y `MAGIC_DB_PATH`. Los valores de ejemplo son orientativos para GPT-5 mini Global Standard; el nombre del despliegue no garantiza que coincida con el modelo, modalidad o precio real. El contador utiliza SQLite incorporado a Node y necesita una versión de Node con `node:sqlite` disponible (Node 22.13 o superior).
