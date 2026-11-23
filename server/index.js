import { createApp } from './app.js';
import { createCoach } from './coach.js';
import { createMagicBudget } from './magicBudget.js';
const port = Number(process.env.PORT) || 3001;
const budget = createMagicBudget(process.env);
createApp({ coach: createCoach(process.env, budget), budget }).listen(port, '127.0.0.1', () => {
  console.log('Academia API en http://127.0.0.1:' + port);
});
