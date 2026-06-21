// Neon Postgres access. Uses the HTTP driver (no WebSocket/ws needed), which
// is a good fit for Vercel serverless. Tagged-template queries are
// automatically parameterized — always pass user input as ${values}, never by
// string concatenation. See .claude/skills/neon-postgres-schema.
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  // Surfaced loudly in dev; on Vercel the env var is injected from project settings.
  console.warn('[db] DATABASE_URL is not set — database queries will fail.');
}

export const sql = neon(process.env.DATABASE_URL);
