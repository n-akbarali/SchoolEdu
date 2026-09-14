'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { getSession, setSession, clearSession, onSessionChange, authenticate } from '@/lib/db';
import type { User, Language } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getSession());
    setLoading(false);
    const off = onSessionChange(() => setUser(getSession()));
    return off;
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const u = await authenticate(username, password);
    if (u) {
      setSession(u);
      setUser(u);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Language context
interface LangContextValue {
  lang: Language;
  setLang: (l: Language) => void;
}

const LangContext = createContext<LangContextValue>({
  lang: 'uz',
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('uz');

  useEffect(() => {
    const stored = localStorage.getItem('a7school_lang') as Language | null;
    if (stored) setLangState(stored);
  }, []);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem('a7school_lang', l);
  }, []);

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <LangProvider>{children}</LangProvider>
    </AuthProvider>
  );
}
