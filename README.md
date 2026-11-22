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

- En **Controles de partida → Fuerza del rival**, selecciona Práctica, uno de los niveles clásicos o un Elo objetivo de 1400 a 2200. El Elo es una configuración de Stockfish y sirve como referencia de práctica.
- El **Perfil del Oráculo** es independiente y se guarda en el navegador. Primeros pasos muestra una sola idea, sin puntuaciones, y usa explicaciones breves. Los demás perfiles muestran más variantes y ajustan el detalle de las respuestas. El análisis local mantiene su fuerza en todos los perfiles.

- En **Opciones**, elegí uno de los doce diseños del tablero con vista previa. La elección se aplica sin reiniciar la partida y se guarda en el navegador.
- En **Opciones → Vista del tablero**, alterná entre **Clásica** (predeterminada) y **Perspectiva**. La vista se guarda junto con tus preferencias.

- **Jugar** usa Stockfish WASM. Abre Controles e historial para elegir color y dificultad, reiniciar o deshacer.
- **Estudio libre** permite mover ambos bandos, importar FEN o PGN y exportar la posición visible. Si mueves desde una jugada anterior, creas una rama a partir de esa posición.
- **Preparar jugada** dibuja una flecha. Puedes preguntar al profesor, comparar con otra opción o ejecutar la candidata.
- **Análisis** calcula líneas de Stockfish localmente. Al abrir una variante, puedes avanzar y retroceder en un tablero de análisis.
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


