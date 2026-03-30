import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import pg from 'pg';

const { Pool } = pg;

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.resolve(currentDir, '..');
const envPath = path.resolve(apiDir, '.env');
const sqlDir = path.resolve(apiDir, 'sql');

loadEnv({ path: envPath });

if (!process.env.KITABU_DATABASE_URL) {
  console.error('KITABU_DATABASE_URL is not set.');
  process.exit(1);
}

const sqlFiles = readdirSync(sqlDir)
  .filter(file => /^\d+.*\.sql$/i.test(file))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

if (sqlFiles.length === 0) {
  console.log('No SQL migrations found.');
  process.exit(0);
}

const pool = new Pool({
  connectionString: process.env.KITABU_DATABASE_URL
});

try {
  for (const file of sqlFiles) {
    const fullPath = path.join(sqlDir, file);
    const sql = readFileSync(fullPath, 'utf8');
    console.log(`Applying ${file}`);
    await pool.query(sql);
  }

  console.log('All migrations applied successfully.');
} catch (error) {
  console.error('Migration failed.');
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end().catch(() => {});
}
