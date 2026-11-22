# Hoja de ruta

- MVP local en React y Vite con tema Biblioteca Dorada, estudio y partida persistente, motor rival y análisis en Workers separados, profesor Express y variantes.
- Profesor con respuesta JSON estructurada. Las jugadas de cada línea se reproducen con chess.js en navegador y servidor. El cliente local aporta las evaluaciones del motor.
- El servidor del profesor usa Azure OpenAI Responses API v1. El nombre de despliegue y la clave se configuran por entorno.
- La instalación de Stockfish está separada de npm install. El script setup:engine descarga la compilación Lite Single y su licencia.
- Siguiente fase: lecciones y retos, evaluación posterior sin ayudas en partida, progreso por concepto, modo infantil y temas alternativos.
- Más adelante: MCP sobre el mismo contrato de análisis, sincronización y autorización por partida, cuentas y despliegue cuando se necesiten.
- Pendiente de medir en dispositivos reales: latencia de arranque y análisis WASM, coste por consulta y tiempos del profesor.

