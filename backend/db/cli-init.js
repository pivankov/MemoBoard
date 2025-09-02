import { initDb } from './initdb.js';

(async () => {
  try {
    await initDb();
    console.log('Database initialized.');
  } catch (err) {
    console.error('DB init error:', err);
    process.exitCode = 1;
  }
})();
