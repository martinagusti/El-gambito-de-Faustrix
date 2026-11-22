export function parseInfo(text) {
  const depth = text.match(/\bdepth (\d+)/);
  const score = text.match(/\bscore (cp|mate) (-?\d+)(?: (lowerbound|upperbound))?/);
  const pv = text.match(/\bpv (.+)$/);
  if (!text.startsWith('info ') || !depth || !score || !pv) return null;
  return {
    depth: Number(depth[1]),
    index: Number(text.match(/\bmultipv (\d+)/)?.[1] ?? 1),
    score: { type: score[1], value: Number(score[2]), bound: score[3] ?? null },
    pvUci: pv[1].trim().split(/\s+/).slice(0, 16),
  };
}
