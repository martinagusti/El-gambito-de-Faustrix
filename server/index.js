import { createApp } from './app.js';
import { createCoach } from './coach.js';
const port = Number(process.env.PORT) || 3001;
createApp({ coach: createCoach(process.env) }).listen(port, '127.0.0.1', () => {
  console.log('Academia API en http://127.0.0.1:' + port);
});
