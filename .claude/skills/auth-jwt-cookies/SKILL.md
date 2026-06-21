---
name: auth-jwt-cookies
description: Use when implementing or changing authentication — signup, login, logout, password hashing, JWT issuance, the httpOnly-cookie session, or the requireAuth middleware that protects the profile route and gates seller contact info. Tailored to this Express-on-Vercel + React marketplace.
---

# Auth — JWT in an httpOnly cookie

Stateless auth that works well on Vercel serverless: on login, issue a signed **JWT stored in an httpOnly cookie**. Protected routes verify the cookie via `requireAuth`. No server-side session store needed.

## Why this shape

- **httpOnly cookie** (not localStorage): JS can't read it, so it's not exposed to XSS token theft; the browser sends it automatically with `credentials: 'include'`.
- **Stateless JWT**: no session table to query on every serverless invocation.
- Trade-off: logout/invalidation is best-effort (clear the cookie). Fine for v1. Keep token lifetime modest (e.g. 7d).

## Dependencies

`bcrypt` (or `bcryptjs` for pure-JS/serverless portability) for password hashing, `jsonwebtoken` for JWTs, `cookie-parser` middleware. Secret in `process.env.JWT_SECRET` (Vercel env var; never hardcode).

## Signup / login (sketch)

```js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const COOKIE = 'token';
const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

function issue(res, user) {
  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE, token, cookieOpts);
}

// POST /api/auth/signup  (after email verification — see email-verification)
const hash = await bcrypt.hash(password, 12);
// INSERT user with password_hash = hash; handle 23505 unique violation -> 409 "email/username taken"

// POST /api/auth/login
const user = await getUserByEmail(email);
if (!user || !(await bcrypt.compare(password, user.password_hash)))
  return res.status(401).json({ error: 'Invalid credentials' }); // same message for both — don't leak which
issue(res, user);
res.json({ id: user.id, username: user.username }); // never return password_hash

// POST /api/auth/logout
res.clearCookie(COOKIE, { ...cookieOpts, maxAge: undefined });
res.json({ ok: true });

// GET /api/auth/me  -> who am I (for the React app on load)
```

## requireAuth middleware

```js
// server/middleware/requireAuth.js
import jwt from 'jsonwebtoken';
export function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, username }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}
```

Apply it to protected routes:
- `GET /api/profile/*` and any profile mutation — fully gated.
- Item detail: the **listing is public**, but **seller contact info (email/phone) is only included when `req.user` exists**. Pattern: an optional `attachUser` middleware that sets `req.user` if a valid cookie is present (without 401ing), then the handler conditionally adds `seller.email`/`seller.phone` to the response.

```js
// optionalAuth: like requireAuth but never rejects
export function optionalAuth(req, _res, next) {
  const token = req.cookies?.token;
  if (token) { try { req.user = jwt.verify(token, process.env.JWT_SECRET); } catch {} }
  next();
}
// in GET /api/items/:id handler:
const body = { ...item, seller: { username } };
if (req.user) body.seller = { username, email, phone };
res.json(body);
```

## Ownership checks

`requireAuth` proves *who* the user is; it does NOT prove they own a resource. For edit/delete, scope the query: `... WHERE id = ${itemId} AND seller_id = ${req.user.id}` and 404/403 if no row. Never trust an `ownerId` sent from the client.

## React side

- `fetch('/api/...', { credentials: 'include' })` so the cookie rides along (and configure CORS/credentials if origins differ; with the Vite proxy in dev they're same-origin).
- Track auth state by calling `GET /api/auth/me` on app load; store the user in context. Route guards in react-router redirect to `/login` when `me` is null — but remember the **client guard is UX only; the server is the real gate.**

Related: [[express-vercel-api]], [[email-verification]], [[neon-postgres-schema]].
