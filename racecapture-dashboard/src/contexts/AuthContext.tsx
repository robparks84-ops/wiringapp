'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface AuthState {
  token: string | null;
  clientId: string;
  clientSecret: string;
  login: (token: string, clientId: string, clientSecret: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  token: null,
  clientId: '',
  clientSecret: '',
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('podium_token');
    const storedId = localStorage.getItem('podium_client_id') ?? '';
    const storedSecret = localStorage.getItem('podium_client_secret') ?? '';
    if (stored) setToken(stored);
    setClientId(storedId);
    setClientSecret(storedSecret);
  }, []);

  const login = useCallback((t: string, id: string, secret: string) => {
    localStorage.setItem('podium_token', t);
    localStorage.setItem('podium_client_id', id);
    localStorage.setItem('podium_client_secret', secret);
    setToken(t);
    setClientId(id);
    setClientSecret(secret);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('podium_token');
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, clientId, clientSecret, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
