import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setAuthToken, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);
const STORAGE_KEY = 'buggy_tracking_session';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAuthToken(session?.token || null);
  }, [session]);

  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    // Re-validate the session on load in case the token expired or the
    // account/permissions changed while offline.
    if (!session?.token) {
      setReady(true);
      return;
    }
    setAuthToken(session.token);
    api
      .get('/auth/me')
      .then(({ user }) => {
        setSession((s) => (s ? { ...s, user } : s));
      })
      .catch(() => logout())
      .finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await api.post('/auth/login', { username, password });
    setSession(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }, []);

  const hasPermission = useCallback(
    (moduleName, action) => {
      if (!session?.user) return false;
      if (session.user.role === 'admin') return true;
      return !!session.user.permissions?.[moduleName]?.[action];
    },
    [session]
  );

  const value = {
    user: session?.user || null,
    isAdmin: session?.user?.role === 'admin',
    ready,
    login,
    logout,
    hasPermission,
    refreshUser: async () => {
      const { user } = await api.get('/auth/me');
      setSession((s) => {
        const next = s ? { ...s, user } : s;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
