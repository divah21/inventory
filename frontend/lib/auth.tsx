'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';

export type User = {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  is_active?: boolean;
  last_login_at?: string | null;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  status: 'loading' | 'authenticated' | 'anonymous';
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

function readStored<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');

  useEffect(() => {
    const t = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;
    const u = readStored<User>(USER_KEY);
    if (t && u) {
      setToken(t);
      setUser(u);
      setStatus('authenticated');
    } else {
      setStatus('anonymous');
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY || e.key === USER_KEY) {
        const nt = window.localStorage.getItem(TOKEN_KEY);
        const nu = readStored<User>(USER_KEY);
        setToken(nt);
        setUser(nu);
        setStatus(nt && nu ? 'authenticated' : 'anonymous');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error || `Login failed (${res.status})`);
    }
    window.localStorage.setItem(TOKEN_KEY, body.token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(body.user));
    setToken(body.token);
    setUser(body.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setStatus('anonymous');
  }, []);

  const refresh = useCallback(async () => {
    const t = window.localStorage.getItem(TOKEN_KEY);
    if (!t) return;
    const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } });
    if (res.status === 401) {
      logout();
      return;
    }
    const body = await res.json();
    setUser(body.user);
    window.localStorage.setItem(USER_KEY, JSON.stringify(body.user));
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, status, login, logout, refresh }),
    [user, token, status, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Read the current token outside of React (for the API client). */
export function readToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}
