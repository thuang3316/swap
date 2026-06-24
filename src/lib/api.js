// Thin fetch wrapper for the backend. Always sends cookies (credentials:
// 'include') so the httpOnly session cookie rides along. Throws an Error with
// .status and .data on non-2xx so callers can branch on the response.

// The auth layer registers a handler here so that an expired/cleared session,
// surfaced as a 401 by ANY protected call, can clear the client auth state and
// bounce to login — without every caller having to wire that up. Auth endpoints
// (/auth/*) are excluded: their 401s (e.g. a wrong login password) are expected
// and handled inline by their own callers.
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }

export async function api(path, { method = 'GET', body, ...opts } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = Object.assign(new Error(data.error || 'Something went wrong'), { status: res.status, data });
    if (res.status === 401 && !path.startsWith('/auth/')) {
      // Session is gone — let the app react (clear user, redirect). Flag the
      // error so callers can skip their own redundant error message.
      err.sessionExpired = true;
      onUnauthorized?.();
    }
    throw err;
  }
  return data;
}
