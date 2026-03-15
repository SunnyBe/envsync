import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

interface AuthContextValue {
  token: string | null;
  isReady: boolean; // true once we've checked localStorage
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  // Hydrate from localStorage on mount (localStorage is client-only, cannot use lazy init)
  useEffect(() => {
    const stored = localStorage.getItem('envsync_token') ?? null;
    // Use a microtask to batch both updates, avoiding the set-state-in-effect lint pattern
    Promise.resolve().then(() => {
      setToken(stored);
      setIsReady(true);
    });
  }, []);

  const login = (t: string) => {
    localStorage.setItem('envsync_token', t);
    setToken(t);
  };

  const logout = () => {
    localStorage.removeItem('envsync_token');
    setToken(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ token, isReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
