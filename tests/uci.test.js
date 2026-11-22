import { expect, it } from 'vitest';
import { parseInfo } from '../src/engine/uci.js';

it('lee MultiPV, límites y mate conservando sus unidades', () => {
  expect(parseInfo('info depth 13 seldepth 18 multipv 2 score mate -3 lowerbound nodes 40 pv e2e4 d7d5'))
    .toEqual({ depth: 13, index: 2, score: { type: 'mate', value: -3, bound: 'lowerbound' }, pvUci: ['e2e4', 'd7d5'] });
  expect(parseInfo('info string NNUE enabled')).toBeNull();
});
