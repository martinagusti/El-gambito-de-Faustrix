export const rivals = {
  practice: { label: 'Práctica · Primeros pasos', skill: 0, depth: 1 },
  beginner: { label: 'Principiante', skill: 1 },
  intermediate: { label: 'Intermedio', skill: 8 },
  advanced: { label: 'Avanzado', skill: 17 },
  ...Object.fromEntries([1400, 1600, 1800, 2000, 2200].map(elo => ['elo-' + elo, { label: 'Elo objetivo ' + elo, elo }])),
};
