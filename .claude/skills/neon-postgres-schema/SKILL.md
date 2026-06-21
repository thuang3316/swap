---
name: neon-postgres-schema
description: Use when designing or changing the database schema, writing SQL/queries, or wiring the Neon Postgres connection for this used-items marketplace. Covers the users/items/requests/email-verification tables, parameterized queries, connection setup for serverless, and keeping schema details off the client.
---

# Neon Postgres — schema & data access

Database is **Neon (serverless Postgres)**, free tier, accessed from Express-on-Vercel. Keep the schema simple for v1 (4 tables) and never expose schema/SQL to the client.

## Connection (serverless-friendly)

Use the Neon serverless driver (`@neondatabase/serverless`) or `pg` with a module-scoped pool so warm invocations reuse it. Connection string from `process.env.DATABASE_URL` (Vercel env var; `.env` locally, gitignored).

```js
// server/db.js
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

// Tagged-template = automatically parameterized (safe from injection)
export async function getItem(id) {
  const [item] = await sql`SELECT * FROM items WHERE id = ${id}`;
  return item ?? null;
}
export { sql };
```

If using node-`pg` instead, ALWAYS use parameterized queries (`$1, $2`), never string interpolation.

## v1 schema (4 tables)

```sql
-- users
CREATE TABLE users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  email         CITEXT NOT NULL UNIQUE,        -- CITEXT = case-insensitive; or store lowercased TEXT
  password_hash TEXT NOT NULL,
  phone         TEXT,                            -- optional seller contact
  email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- items (listings) — one row per used item
CREATE TABLE items (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seller_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,                               -- optional
  price       NUMERIC(10,2),                      -- NULL = "price negotiable"
  category    TEXT NOT NULL,                       -- constrain to a fixed list (CHECK or enum)
  image_urls  TEXT[] NOT NULL DEFAULT '{}',        -- URLs to object storage, NOT the files
  status      TEXT NOT NULL DEFAULT 'available'    -- available | sold
              CHECK (status IN ('available','sold')),
  due_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON items (category);
CREATE INDEX ON items (seller_id);
CREATE INDEX ON items (created_at DESC);

-- requests (buyer demand: "I want to buy X")
CREATE TABLE requests (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  buyer_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  category   TEXT NOT NULL,
  price_min  NUMERIC(10,2),
  price_max  NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- email verification codes (short-lived)
CREATE TABLE email_verifications (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email      CITEXT NOT NULL,
  code       TEXT NOT NULL,                        -- store a HASH of the code, not plaintext, ideally
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON email_verifications (email);
```

Notes:
- `CITEXT` needs `CREATE EXTENSION IF NOT EXISTS citext;` — or just store emails lowercased in plain `TEXT` and enforce uniqueness. Either prevents the same email being used twice (project requirement).
- **Categories**: hardcode a fixed list and enforce with a `CHECK (category IN (...))` constraint rather than a separate table for v1.
- **Images** live in object storage (Vercel Blob / Supabase / S3); the DB stores only `image_urls`. Postgres should not hold binary image data.
- Chat (v2) would add `conversations` + `messages` — defer.

## Migrations

Keep ordered `.sql` files in `server/migrations/` (e.g. `001_init.sql`). Apply manually against Neon for now (Neon SQL editor or a small `node` script). Commit the SQL so the schema is versioned.

## Security (project requirement)

- Never send SQL text, table/column layout, or DB errors to the client — return generic `{ error }` messages; log details server-side.
- All queries parameterized — no string concatenation with user input.
- A user can only read/modify **their own** profile, items, and requests: enforce with `WHERE seller_id = ${req.user.id}` (or `buyer_id`) in update/delete queries, not just in the UI.
- Seller contact info (email/phone) is only returned on item responses when the requester is authenticated — see `auth-jwt-cookies`.

Related: [[express-vercel-api]], [[auth-jwt-cookies]], [[email-verification]].
