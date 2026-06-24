// Auth state for the React app. Calls GET /api/auth/me on load to learn who is
// signed in, and exposes helpers to refresh/log out. The server cookie is the
// real source of truth — this is just a client-side mirror for the UI.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setUnauthorizedHandler } from './api.js';

const AuthContext = createContext(null);

// Paths where a "your session expired" redirect would be pointless or looping.
const AUTH_PATHS = ['/login', '/signup', '/forgot-password'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    try {
      const { user } = await api('/auth/me');
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // The cookie is httpOnly, so the UI can't see when it expires — our `user`
  // mirror goes stale and the app looks signed-in until a hard refresh. When any
  // protected call 401s, treat the session as gone: clear the mirror and send
  // the user to login with a clear explanation (unless we're already there).
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      if (!AUTH_PATHS.includes(window.location.pathname)) {
        navigate('/login', { replace: true, state: { expired: true } });
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  const logout = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST' }); } finally { setUser(null); }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
