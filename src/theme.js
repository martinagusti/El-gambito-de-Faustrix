import { createElement } from 'react';
export const themes = {
  'golden-library': {
    light: '#dba971', dark: '#71452f', frame: '#341e13',
    background: '/themes/golden-library/library-fallback.webp',
    pieces: Object.fromEntries(['w', 'b'].flatMap(color => ['P', 'N', 'B', 'R', 'Q', 'K'].map(type => {
      const code = color + type;
      return [code, ({ squareWidth }) => createElement('span', { className: 'piece-render', 'data-kind': type }, createElement('img', {
        className: 'piece', src: '/themes/golden-library/' + code + '.webp', alt: '',
        width: squareWidth, height: squareWidth, draggable: false,
      }))];
    }))),
  },
};
export const theme = themes['golden-library'];
