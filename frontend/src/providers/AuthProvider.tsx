import { useCallback, useEffect, useMemo,useState } from 'react';

import type { User } from 'types/auth';

import { AuthContext, type AuthContextValue } from 'contexts/AuthContext';
import { bookmarksApiClient,eventsApiClient } from 'services/apiClients';
import * as authService from 'services/authService';

const TOKEN_KEY = 'memoboard_token';

function setAuthHeader(token: string) {
  eventsApiClient.setHeader('Authorization', `Bearer ${token}`);
  bookmarksApiClient.setHeader('Authorization', `Bearer ${token}`);
}

function removeAuthHeader() {
  eventsApiClient.removeHeader('Authorization');
  bookmarksApiClient.removeHeader('Authorization');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Регистрация обработчика 401 на API-клиентах при монтировании.
  // При получении 401 (истёкший/невалидный токен) — автоматически разлогиниваем пользователя.
  // ProtectedRoute увидит isAuthenticated=false и перенаправит на /login.
  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem(TOKEN_KEY);
      removeAuthHeader();
      setToken(null);
      setUser(null);
    };

    eventsApiClient.setOnUnauthorized(handleUnauthorized);
    bookmarksApiClient.setOnUnauthorized(handleUnauthorized);

    return () => {
      eventsApiClient.setOnUnauthorized(null);
      bookmarksApiClient.setOnUnauthorized(null);
    };
  }, []);

  // Проверка сохранённого токена при монтировании
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);

    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    authService.fetchCurrentUser(savedToken)
      .then((userData) => {
        setUser(userData);
        setToken(savedToken);
        setAuthHeader(savedToken);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (credentials: Parameters<AuthContextValue['login']>[0]) => {
    const result = await authService.login(credentials);
    localStorage.setItem(TOKEN_KEY, result.token);
    setAuthHeader(result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const register = useCallback(async (credentials: Parameters<AuthContextValue['register']>[0]) => {
    const result = await authService.register(credentials);
    localStorage.setItem(TOKEN_KEY, result.token);
    setAuthHeader(result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    removeAuthHeader();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  }), [user, token, isLoading, login, register, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
