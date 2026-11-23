export function gameResult(game, mode, color) {
  if (!game.isGameOver()) return null;
  if (game.isCheckmate()) {
    const winner = game.turn() === 'w' ? 'negras' : 'blancas';
    if (mode !== 'play') return { title: '¡Jaque mate!', description: `La partida ha terminado. Ganan las ${winner}.` };
    return game.turn() === color
      ? { title: 'Jaque mate', description: 'Has perdido la partida. Cada partida es una oportunidad para aprender.' }
      : { title: '¡Has ganado!', description: 'Has dado jaque mate. ¡Enhorabuena por tu partida!' };
  }
  const reason = game.isStalemate() ? 'por ahogado' : game.isThreefoldRepetition() ? 'por repetición' : 'en tablas';
  return { title: 'Partida en tablas', description: `La partida ha terminado ${reason}.` };
}
