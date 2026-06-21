---
name: express-vercel-api
description: Use when building or modifying the Express.js backend for this used-items marketplace, especially anything touching API routes, the api/ + server/ layout, deploying to Vercel as serverless functions, or the route-by-route build workflow. The repo owner is new to Express, so favor clear, minimal patterns.
---

# Express on Vercel (serverless) — backend conventions

This project's backend is **Express.js deployed as Vercel serverless functions**, talking to **Neon Postgres**. There is NO long-lived `app.listen()` server in production — Vercel invokes an exported handler per request.

## The one rule that trips people up

On Vercel you do **not** call `app.listen()`. You build the Express app and **export it as the default handler**. You only call `app.listen()` for *local* development, guarded so it never runs on Vercel.

```js
// server/app.js  — build & export the app, no listen here
import express from 'express';
import cookieParser from 'cookie-parser';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/auth', authRouter);
  app.use('/api/items', itemsRouter);
  app.use('/api/requests', requestsRouter);

  app.use(errorHandler); // last
  return app;
}
```

```js
// api/index.js  — Vercel entry point (serverless)
import { createApp } from '../server/app.js';
export default createApp();
```

```js
// server/dev.js  — LOCAL ONLY: `node server/dev.js`
import { createApp } from './app.js';
const port = process.env.PORT || 3001;
createApp().listen(port, () => console.log(`API on :${port}`));
```

`vercel.json` routes `/api/*` to the function; Vite serves the React app. During local dev, run Vite (5173) + `server/dev.js` (3001) and proxy `/api` from Vite to 3001 (configure `server.proxy` in `vite.config.js`) so the frontend calls `/api/...` in both environments.

## Suggested layout

```
api/
  index.js            # Vercel handler: export default createApp()
server/
  app.js              # createApp(): middleware + routers
  dev.js              # local listen, gitignored from prod concerns
  db.js               # Neon pool/client (see neon-postgres-schema)
  middleware/
    requireAuth.js    # see auth-jwt-cookies
    errorHandler.js
  routes/
    auth.js  items.js  requests.js
src/                  # existing React app
```

## Route conventions (keep them boring and consistent)

- Use `express.Router()` per resource; mount under `/api/<resource>`.
- Async handlers: wrap so rejections reach the error handler. Either a tiny `asyncH(fn)` wrapper or try/catch in each handler. Never let a promise reject unhandled.
- Status codes: 200 ok, 201 created, 400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict (e.g. duplicate email), 500 unexpected.
- Always respond JSON: `res.status(400).json({ error: 'message' })`. Never send raw error objects/stack traces to the client (Security requirement).
- Validate input at the route boundary before touching the DB.

```js
const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post('/', requireAuth, asyncH(async (req, res) => {
  const { title, price } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  const item = await createItem({ sellerId: req.user.id, title, price });
  res.status(201).json(item);
}));
```

```js
// errorHandler.js — never leak internals
export function errorHandler(err, req, res, next) {
  console.error(err);                 // server logs only
  res.status(err.status || 500).json({ error: err.expose ? err.message : 'Server error' });
}
```

## Serverless gotchas

- **Cold starts / connections**: don't open a new DB connection per request without pooling — Neon serverless driver or a module-scoped pool is reused across warm invocations. See `neon-postgres-schema`.
- **No filesystem persistence** between invocations — uploads go to object storage, not local disk.
- **Env vars** come from Vercel project settings (and `.env` locally, gitignored). Never hardcode secrets.

## Workflow (per project guide)

Build **one route at a time**: implement → run locally (`run`/`verify` skills) → discuss/test → next. Backend foundation (db.js, error handler, auth middleware) comes before the feature routes since nearly everything depends on it.

Related: [[neon-postgres-schema]], [[auth-jwt-cookies]], [[email-verification]].
