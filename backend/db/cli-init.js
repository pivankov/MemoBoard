import { initDb } from './initdb.js';

function parseArgs(argv) {
  const hasNoSeedFlag = argv.includes('--no-seed') || argv.includes('--noseed');
  const seedEnv = process.env.SEED;
  const seedFromEnv = typeof seedEnv === 'string' ? seedEnv.toLowerCase() !== 'false' && seedEnv !== '0' : undefined;
  const seed = hasNoSeedFlag ? false : (seedFromEnv ?? true);
  return { seed };
}

(async () => {
  try {
    const options = parseArgs(process.argv.slice(2));
    await initDb(options);
    console.log(`Database initialized. Seed: ${options.seed ? 'on' : 'off'}`);
  } catch (err) {
    console.error('DB init error:', err);
    process.exitCode = 1;
  }
})();
