import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Chessboard } from 'react-chessboard';
import { theme } from '../theme.js';
import { nextSquare } from './boardKeys.js';
import './board.css';

const transparentSquare = { backgroundColor: 'transparent' };

export function Board({ design, view, game, orientation, selected, legal = [], last, candidate, onClick, onDrop, disabled, onDismissVariation }) {
  const [keyboardSquare, setKeyboardSquare] = useState(null);
  const [touchPreview, setTouchPreview] = useState(null);
  const touchStart = useRef(null);
  function startTouch(event) {
    if (disabled || event.touches.length !== 1) return;
    const square = event.target.closest('[data-square]');
    const piece = square && game.get(square.dataset.square);
    if (!piece || piece.color !== game.turn()) return;
    const touch = event.touches[0];
    touchStart.current = { id: touch.identifier, x: touch.clientX, y: touch.clientY,
      size: square.getBoundingClientRect().width, piece: piece.color + piece.type.toUpperCase() };
  }
  function moveTouch(event) {
    const start = touchStart.current;
    const touch = start && Array.from(event.touches).find(item => item.identifier === start.id);
    if (touch && Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 8) {
      setTouchPreview({ ...start, x: touch.clientX, y: touch.clientY });
    }
  }
  function endTouch(event) {
    if (touchStart.current && Array.from(event.changedTouches).some(item => item.identifier === touchStart.current.id)) {
      touchStart.current = null;
      setTouchPreview(null);
    }
  }
  const highlights = {};
  for (const square of [last?.slice(0, 2), last?.slice(2, 4)].filter(Boolean)) {
    highlights[square] = { boxShadow: 'inset 0 0 0 100px #efbb4755' };
  }
  if (selected) highlights[selected] = { boxShadow: 'inset 0 0 0 3px #ffe6a0, inset 0 0 0 100px #daab4b66' };
  for (const square of legal) {
    highlights[square] = { ...highlights[square], backgroundImage: 'radial-gradient(circle, #301a0dbb 0 13%, #f9d996b0 14% 16%, transparent 17%)' };
  }
  if (game.isCheck()) {
    const king = game.board().flat().find(piece => piece?.type === 'k' && piece.color === game.turn());
    if (king) highlights[king.square] = { background: 'radial-gradient(#ff6753, #a41412aa, transparent)' };
  }
  if (keyboardSquare) highlights[keyboardSquare] = {
    ...highlights[keyboardSquare], outline: '2px dashed #fff4c8', outlineOffset: -4,
  };
  function handleKey(event) {
    if (onDismissVariation && (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape')) { event.preventDefault(); onDismissVariation(); return; }
    const square = keyboardSquare ?? (orientation === 'b' ? 'e7' : 'e2');
    const next = nextSquare(square, event.key, orientation);
    if (next) {
      event.preventDefault();
      setKeyboardSquare(next);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(square);
    }
  }
  return <div className={'board-frame' + (touchPreview ? ' touch-drag-active' : '')} tabIndex={disabled && !onDismissVariation ? -1 : 0}
    aria-label="Tablero. Usa las flechas para recorrer las casillas y Enter para seleccionar."
    onFocus={event => { if (event.currentTarget === event.target) setKeyboardSquare(orientation === 'b' ? 'e7' : 'e2'); }}
    onTouchStartCapture={startTouch} onTouchMoveCapture={moveTouch} onTouchEndCapture={endTouch} onTouchCancelCapture={endTouch}
    onBlur={() => setKeyboardSquare(null)} onKeyDown={disabled && !onDismissVariation ? undefined : handleKey}
    onClickCapture={onDismissVariation ? event => { event.preventDefault(); event.stopPropagation(); onDismissVariation(); } : undefined}>
    <span className="sr-only" aria-live="polite">{keyboardSquare}</span>
    {touchPreview && createPortal(<div className="touch-piece-preview" aria-hidden="true"
      style={{ left: touchPreview.x, top: touchPreview.y, width: touchPreview.size, height: touchPreview.size }}>
      {theme.pieces[touchPreview.piece]({ squareWidth: touchPreview.size, isDragging: true })}
    </div>, document.body)}
    <div className="board-plinth" data-view={view} data-design={design} style={{ '--board-art': 'url(/themes/boards/' + design + '.webp)' }}>
      <div className="board-ranks" aria-hidden="true">{Array.from(orientation === 'b' ? '12345678' : '87654321', rank => <span key={rank}>{rank}</span>)}</div>
      <div className="board-surface">
        <Chessboard id="academy-board" position={game.fen()} boardOrientation={orientation === 'b' ? 'black' : 'white'}
          customPieces={theme.pieces} customLightSquareStyle={transparentSquare}
          customDarkSquareStyle={transparentSquare} customSquareStyles={highlights} showBoardNotation={false}
          customArrows={candidate ? [[candidate.slice(0, 2), candidate.slice(2, 4), '#ffd470']] : []}
          onSquareClick={onClick} onPieceDrop={onDrop} arePiecesDraggable={!disabled}
          areArrowsAllowed={false} animationDuration={150} />
      </div>
      <div className="board-files" aria-hidden="true">{Array.from(orientation === 'b' ? 'hgfedcba' : 'abcdefgh', file => <span key={file}>{file}</span>)}</div>
    </div>
  </div>;
}
