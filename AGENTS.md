# El Gambito de Fausto
MVP local en JavaScript ESM, React/Vite, chess.js, Stockfish WASM y Express/OpenAI.
La UI vive en src, la API en server y la notacion compartida en shared.
Mantener archivos cortos y modulos cohesionados. chess.js valida reglas y variantes. El FEN base y las jugadas UCI son el historial canonico.
Ejecutar npm run lint, npm test y npm run build antes de entregar.
Mantener claves exclusivamente en servidor y .env fuera del repositorio. Limitar entrada, peticiones y concurrencia. Las consultas son explicitas. No gastar tokens reales durante pruebas.
El tema Biblioteca Dorada usa componentes React y recursos separados. Mantener README y docs/roadmap.md al dia.
