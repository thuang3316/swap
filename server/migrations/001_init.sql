-- Swap Board — initial schema (v1). See .claude/skills/neon-postgres-schema.
-- Case-insensitive text for emails/usernames so duplicates can't sneak in by case.
CREATE EXTENSION IF NOT EXISTS citext;

-- Users -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username       CITEXT NOT NULL UNIQUE,
  email          CITEXT NOT NULL UNIQUE,
  password_hash  TEXT   NOT NULL,
  phone          TEXT,                                   -- optional seller contact
  email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Listings (items for sale) ---------------------------------------------------
CREATE TABLE IF NOT EXISTS items (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seller_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,                                       -- optional
  price       NUMERIC(10,2),                              -- NULL = "Negotiable"
  category    TEXT NOT NULL CHECK (category IN (
                'furniture','electronics','bikes','photo','music',
                'clothing','books','home','sports','toys','other')),
  image_urls  TEXT[] NOT NULL DEFAULT '{}',               -- URLs (Vercel Blob), not files
  status      TEXT NOT NULL DEFAULT 'available'
              CHECK (status IN ('available','sold')),
  due_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS items_category_idx   ON items (category);
CREATE INDEX IF NOT EXISTS items_seller_idx     ON items (seller_id);
CREATE INDEX IF NOT EXISTS items_created_at_idx ON items (created_at DESC);

-- Buyer requests ("I'm looking for X") ----------------------------------------
CREATE TABLE IF NOT EXISTS requests (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  buyer_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  category   TEXT NOT NULL CHECK (category IN (
               'furniture','electronics','bikes','photo','music',
               'clothing','books','home','sports','toys','other')),
  price_min  NUMERIC(10,2),
  price_max  NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS requests_category_idx ON requests (category);

-- Email verification codes (short-lived) --------------------------------------
CREATE TABLE IF NOT EXISTS email_verifications (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email      CITEXT NOT NULL,
  code       TEXT NOT NULL,                               -- store a HASH of the code
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_verifications_email_idx ON email_verifications (email);
