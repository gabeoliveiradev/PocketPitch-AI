'use client';

import { useState } from 'react';
import { User } from '../lib/types';
import { API_URL } from '../lib/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginView, setIsLoginView] = useState(true);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const checkAuth = async (): Promise<User | null> => {
    try {
      const res = await fetch(`${API_URL}/api/me/`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return data;
      } else {
        setUser(null);
        return null;
      }
    } catch {
      setUser(null);
      return null;
    }
  };

  const handleAuth = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    setAuthError('');
    const endpoint = isLoginView ? '/api/login/' : '/api/register/';

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
        credentials: 'include',
      });

      if (res.ok) {
        if (!isLoginView) {
          setIsLoginView(true);
          setAuthError('Conta criada! Por favor, faça login.');
          return false;
        }
        const data = await res.json();
        setUser(data.user);
        return true;
      } else {
        const err = await res.json();
        setAuthError(err.error || 'Erro na autenticação');
        return false;
      }
    } catch {
      setAuthError('Erro ao conectar ao servidor');
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/logout/`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
    }
  };

  return {
    user,
    isLoginView,
    setIsLoginView,
    authUsername,
    setAuthUsername,
    authPassword,
    setAuthPassword,
    authError,
    checkAuth,
    handleAuth,
    handleLogout,
  };
}
