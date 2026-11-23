import { describe, expect, it } from 'vitest';
import { replay } from '../shared/chess.js';
import { academyContent } from '../src/academy/content.js';
import { exercisesFor } from '../src/academy/exercises.js';
import { lessonOrder, nextLesson } from '../src/academy/sequence.js';
import { readingGuides, readingFor } from '../src/academy/readingContent.js';

describe('contenido de la academia', () => {
  it('contiene líneas legales y una explicación por jugada', () => {
    for (const item of academyContent) {
      expect(item.explanations).toHaveLength(item.moves.length);
      expect(() => replay(item.fen, item.moves)).not.toThrow();
    }
  });
  it('cada ejercicio adicional tiene una secuencia legal y explicaciones completas', () => {
    for (const item of academyContent) for (const exercise of exercisesFor(item)) {
      expect(exercise.explanations).toHaveLength(exercise.moves.length);
      expect(() => replay(exercise.fen, exercise.moves)).not.toThrow();
    }
  });
  it('conserva un recorrido completo y encuentra la siguiente lección', () => {
    expect(new Set(lessonOrder).size).toBe(academyContent.length);
    for (const id of lessonOrder) expect(academyContent.some(item => item.id === id)).toBe(true);
    expect(nextLesson('promocion', academyContent)?.id).toBe('doble');
    expect(nextLesson(lessonOrder.at(-1), academyContent)).toBeNull();
  });
  it('cada apertura incluye jugadas practicables para el color elegido', () => {
    for (const item of academyContent.filter(value => value.section === 'Aperturas y defensas')) {
      const history = replay(item.fen, item.moves).history({ verbose: true });
      expect(history.some(move => move.color === item.side)).toBe(true);
    }
  });
  it('las nuevas familias alcanzan su posición característica', () => {
    const expected = {
      'gambito-dama': ['d2d4', 'd7d5', 'c2c4'], 'caro-kann': ['e2e4', 'c7c6'],
      escandinava: ['e2e4', 'd7d5'], escocesa: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'd2d4'],
      londres: ['d2d4', 'd7d5', 'c1f4'], eslava: ['d2d4', 'd7d5', 'c2c4', 'c7c6'],
      inglesa: ['c2c4'], 'india-rey': ['d2d4', 'g8f6', 'c2c4', 'g7g6', 'b1c3', 'f8g7'],
    };
    for (const [id, moves] of Object.entries(expected)) {
      const item = academyContent.find(value => value.id === id);
      expect(item.moves.slice(0, moves.length)).toEqual(moves);
    }
  });
  it('la biblioteca enlaza sus guías con ejemplos reproducibles y prácticas', () => {
    expect(readingGuides.map(guide => guide.id)).toEqual(lessonOrder);
    expect(new Set(readingGuides.map(guide => guide.id)).size).toBe(academyContent.length);
    for (const guide of readingGuides) {
      const lesson = academyContent.find(item => item.id === guide.id);
      expect(lesson).toBeDefined();
      expect(readingFor(lesson.id)).toBe(guide);
      expect(exercisesFor(lesson).length).toBeGreaterThan(0);
      expect(() => replay(lesson.fen, lesson.moves)).not.toThrow();
      expect(guide.sections.every(section => section.paragraphs.length > 0)).toBe(true);
      expect(guide.sections.some(section => section.boardLink)).toBe(true);
      expect(guide.category && guide.callout && guide.boardTitle).toBeTruthy();
    }
    expect(readingFor('inexistente')).toBeUndefined();
  });
  it('los dos ataques dobles amenazan al rey y a la torre', () => {
    const item = academyContent.find(value => value.id === 'doble');
    const second = exercisesFor(item)[1];
    const game = replay(second.fen, second.moves);
    expect(game.isCheck()).toBe(true);
    expect(game.isAttacked('h8', 'w')).toBe(true);
  });
  it('las dos posiciones de última fila terminan en jaque mate', () => {
    const item = academyContent.find(value => value.id === 'mate-octava');
    for (const exercise of exercisesFor(item)) expect(replay(exercise.fen, exercise.moves).isCheckmate()).toBe(true);
  });
  it('las descubiertas capturan la dama y dan jaque con la torre', () => {
    const item = academyContent.find(value => value.id === 'descubierta');
    for (const exercise of exercisesFor(item)) {
      const game = replay(exercise.fen, exercise.moves);
      expect(game.isCheck()).toBe(true);
      expect(game.history({ verbose: true }).at(-1).captured).toBe('q');
    }
  });
  it('los caballos quedan defendidos por el peón', () => {
    const item = academyContent.find(value => value.id === 'puesto-avanzado');
    for (const exercise of exercisesFor(item)) {
      const game = replay(exercise.fen, exercise.moves);
      const move = game.history({ verbose: true }).at(-1);
      expect(game.isAttacked(move.to, 'w')).toBe(true);
    }
  });
  it('la clavada propone tres ejercicios, incluyendo una clavada diagonal', () => {
    const item = academyContent.find(value => value.id === 'clavada');
    const exercises = exercisesFor(item);
    expect(exercises).toHaveLength(3);
    const game = replay(exercises[2].fen, exercises[2].moves);
    expect(game.get('a4')).toMatchObject({ type: 'b', color: 'w' });
    expect(game.moves({ square: 'c6', verbose: true }).every(move => ['b5', 'a4', 'd7'].includes(move.to))).toBe(true);
  });
  it('la clavada impide que la dama salga de la columna', () => {
    const item = academyContent.find(value => value.id === 'clavada');
    const game = replay(item.fen, item.moves);
    expect(game.moves({ square: 'e7', verbose: true }).every(move => move.to[0] === 'e')).toBe(true);
    expect(game.get('e1')).toMatchObject({ type: 'r', color: 'w' });
  });
  it('la promoción crea una dama blanca', () => {
    const item = academyContent.find(value => value.id === 'promocion');
    expect(replay(item.fen, item.moves).get('a8')).toMatchObject({ type: 'q', color: 'w' });
  });
  it('el ataque doble amenaza al rey y a la torre', () => {
    const item = academyContent.find(value => value.id === 'doble');
    const game = replay(item.fen, item.moves);
    expect(game.isCheck()).toBe(true);
    expect(game.isAttacked('a8', 'w')).toBe(true);
  });
});
