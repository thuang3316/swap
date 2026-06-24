import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

// Route guard for pages that require a signed-in user. It re-checks the server
// session on every entry (the httpOnly cookie can't be read in JS, so asking the
// server is the only way to know it's still valid), which catches an expired
// cookie on navigation — even on pages that don't otherwise call the API until
// you submit. Rendering is optimistic: a user we already know about sees the page
// immediately with no loading flash; if the recheck comes back signed-out, `user`
// flips to null and we redirect. A still-valid 401 from any action is the other
// safety net (see api.js + auth.jsx).
export function RequireAuth({ children }) {
  const { user, loading, refresh } = useAuth();
  // Whether a session existed when we entered — distinguishes "expired" (had a
  // user, now gone) from "never signed in" (typed a protected URL directly).
  const hadUser = useRef(Boolean(user));

  useEffect(() => {
    if (user) hadUser.current = true;
    refresh(); // revalidate on entering the protected route
    // Intentionally only on mount: refresh is stable and adding `user` would
    // re-fire it every time the recheck updates the user (an infinite loop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  if (loading) return <p className="eyebrow text-center py-24">Loading…</p>;
  if (!user) return <Navigate to="/login" replace state={{ expired: hadUser.current }} />;
  return children;
}
