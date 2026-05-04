import { initDb, resetDemoData } from './initdb.js';

(async () => {
  try {
    await initDb({ seed: true });
    const result = await resetDemoData();
    if (result.reset) {
      console.log(`Demo data reset. Deleted preview files: ${result.deletedPreviews}.`);
    } else {
      console.log('Demo user not found — nothing to reset.');
    }
  } catch (err) {
    console.error('Demo reset error:', err);
    process.exitCode = 1;
  }
})();
