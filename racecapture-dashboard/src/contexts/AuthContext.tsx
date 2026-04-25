'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface AuthState {
  token: string | null;
  savedEmail: string;
  login: (token: string) => void;
  saveEmail: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  token: null,
  savedEmail: '',
  login: () => {},
  saveEmail: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [savedEmail, setSavedEmail] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('podium_token');
    const email = localStorage.getItem('podium_email') ?? '';
    if (stored) setToken(stored);
    setSavedEmail(email);
  }, []);

  const login = useCallback((t: string) => {
    localStorage.setItem('podium_token', t);
    setToken(t);
  }, []);

  const saveEmail = useCallback((email: string) => {
    localStorage.setItem('podium_email', email);
    setSavedEmail(email);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('podium_token');
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, savedEmail, login, saveEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
