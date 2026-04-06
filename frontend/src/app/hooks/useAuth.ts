'use client';

import { useState, useCallback } from 'react'; // added useCallback as a best practice
import { User } from '../lib/types';
import { apiFetch } from '../lib/api'; // using centralized fetch

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginView, setIsLoginView] = useState(true);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const checkAuth = useCallback(async (): Promise<User | null> => {
    const { ok, data } = await apiFetch('/api/me/');
    if (ok) {
      setUser(data);
      return data;
    }
    setUser(null);
    return null;
  }, []);

  const handleAuth = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    setAuthError('');
    const endpoint = isLoginView ? '/api/login/' : '/api/register/';

    const { ok, data } = await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({ username: authUsername, password: authPassword }),
    });

    if (ok) {
      if (!isLoginView) {
        setIsLoginView(true);
        setAuthError('Conta criada! Por favor, faça login.');
        return false;
      }
      setUser(data.user);
      return true;
    } else {
      setAuthError(data.error || 'Erro na autenticação');
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/logout/', {
        method: 'POST',
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
