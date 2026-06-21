// Central error handler. Never leak internals (SQL, stack traces) to clients.
// Throw an error with `.status` and `.expose = true` to surface a safe message.
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);
  const status = err.status || 500;
  const message = err.expose ? err.message : 'Server error';
  res.status(status).json({ error: message });
}
