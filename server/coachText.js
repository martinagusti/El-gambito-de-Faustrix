// Sustituciones acotadas: si no sabemos reformular una frase, conservamos su contenido.
export function cleanCoachText(value) {
  return value
    .replace(/\bStockfish\b/giu, 'mi análisis')
    .replace(/\bsignals\.attackedPieces\b/giu, 'las piezas atacadas')
    .replace(/\bfacts\.pieceAttacks\b/giu, 'las casillas atacadas por esa pieza')
    .replace(/\battackedPieces\b/giu, 'las piezas atacadas')
    .replace(/\bpieceAttacks\b/giu, 'las casillas atacadas por esa pieza')
    .replace(/\bchildMove\b/giu, 'la jugada sugerida')
    .replace(/\b(?:según|de) las variantes (?:verificadas|proporcionadas)\b/giu, 'según el análisis')
    .replace(/\b(?:las|los) líneas? (?:verificadas|provistas|proporcionadas)\b/giu, 'las continuaciones')
    .replace(/\bla línea (?:verificada|provista|proporcionada)\b/giu, 'la continuación')
    .replace(/\s*\(\s*pv[1-3](?:\s*,\s*pv[1-3])*\s*\)/giu, '')
    .replace(/\b([a-h][1-8])[ -]?([a-h][1-8])\b/giu, 'de $1 a $2');
}
