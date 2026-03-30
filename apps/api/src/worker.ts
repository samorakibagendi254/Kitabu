import { db, redis } from './db.js';

async function run() {
  await db.query('SELECT 1');
  await redis.ping();
  setInterval(async () => {
    await redis.ping();
  }, 30_000);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
