// Apply SQL migrations to Neon. Run with: npm run db:migrate
// Reads each .sql file in migrations/ in order and executes its statements.
// The Neon HTTP driver runs one statement per call, so we split on ';'.
import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { sql } from './db.js';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, 'migrations');

function statements(text) {
  // Strip line comments, then split on semicolons. (Our migrations contain no
  // semicolons inside string literals, so this simple split is safe.)
  return text
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function run() {
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    console.log(`\n[migrate] ${file}`);
    const stmts = statements(readFileSync(join(dir, file), 'utf8'));
    for (const stmt of stmts) {
      await sql.query(stmt);
      console.log('  ✓', stmt.split('\n')[0].slice(0, 70));
    }
  }
  console.log('\n[migrate] done.');
}

run().catch((err) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
