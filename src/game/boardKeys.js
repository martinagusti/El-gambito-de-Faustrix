const offsets = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1],
};
const files = 'abcdefgh';

export function nextSquare(square, key, orientation) {
  const offset = offsets[key];
  if (!offset) return null;
  const direction = orientation === 'b' ? -1 : 1;
  const file = Math.min(7, Math.max(0, files.indexOf(square[0]) + offset[0] * direction));
  const rank = Math.min(8, Math.max(1, Number(square[1]) + offset[1] * direction));
  return files[file] + rank;
}
