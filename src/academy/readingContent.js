import { academyContent } from './content.js';
import { lessonOrder } from './sequence.js';
import { readingTopics } from './readingTopics.js';

// Texto original de lectura basado en conceptos generales, no transcripción del libro.
const pinGuide = {
  id: 'clavada', title: 'La clavada', subtitle: 'Cuando una pieza protege algo que está detrás', level: 'Inicial',
  category: 'Táctica', callout: 'Una pieza, otra detrás y una línea de ataque: observa las tres antes de mover.', boardTitle: 'La torre y la dama',
  source: 'Inspirada en el estudio de la clavada del tomo II de Roberto Grau. Texto y posición propios.',
  sections: [
    { title: 'La idea', paragraphs: [
      'Una clavada ocurre cuando una pieza atacada no puede moverse libremente porque detrás de ella hay otra pieza importante. La pieza que ataca, la pieza clavada y su objetivo están alineados.',
      'Las torres, los alfiles y la dama pueden crear clavadas, porque atacan a distancia a lo largo de filas, columnas o diagonales.' ] },
    { title: 'Una clavada contra el rey', paragraphs: [
      'Si al mover la pieza clavada quedara su propio rey en jaque, esa jugada es ilegal. A esto se le llama clavada absoluta.',
      'En nuestro ejemplo, la torre blanca va de a1 a e1. La dama negra de e7 queda entre la torre y su rey en e8. La dama no puede abandonar la columna e dejando al rey expuesto.' ] },
    { title: 'Qué conviene observar', paragraphs: [
      'Busca piezas enemigas alineadas con su rey o con otra pieza de valor. Después comprueba si puedes colocar una torre, un alfil o la dama en esa misma línea.',
      'Una pieza clavada no siempre está perdida: puede moverse a lo largo de la línea si la jugada es legal, capturar al atacante o recibir ayuda. La posición concreta decide qué defensas funcionan.' ] },
    { title: 'Llévalo a la práctica', paragraphs: [
      'Antes de mover, pregúntate qué pieza quedará atacada y qué hay detrás. Después revisa las respuestas del rival: una buena idea necesita funcionar sobre el tablero.' ] },
  ],
};
const topicCategories = { promocion: 'Fundamentos', doble: 'Táctica', 'mate-octava': 'Táctica', descubierta: 'Táctica', 'peon-pasado': 'Peones y estrategia', 'columna-abierta': 'Peones y estrategia', 'puesto-avanzado': 'Peones y estrategia' };
function createGuide(item, text) {
  const [subtitle, idea, example, advice] = text;
  const opening = item.section === 'Aperturas y defensas';
  return { id: item.id, title: item.title, level: item.level, subtitle,
    category: topicCategories[item.id] || 'Aperturas y defensas',
    callout: item.summary, boardTitle: opening ? 'Línea introductoria' : 'Ejemplo en el tablero',
    source: opening ? 'Guía original para la academia. Se presenta una línea introductoria, no todas las variantes.' : 'Guía y posición propias sobre conceptos generales de ajedrez.',
    sections: [ { title: 'La idea', paragraphs: [idea] }, { title: 'Míralo en el tablero', paragraphs: [example], boardLink: true }, { title: 'Qué conviene observar', paragraphs: [advice] } ],
  };
}
pinGuide.sections[1].boardLink = true;
export const readingGuides = lessonOrder.map(id => {
  if (id === pinGuide.id) return pinGuide;
  const item = academyContent.find(value => value.id === id);
  return createGuide(item, readingTopics[id]);
});
export const readingFor = id => readingGuides.find(guide => guide.id === id);
