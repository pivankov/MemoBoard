import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { User } from 'types/auth';

import { AuthContext, type AuthContextValue } from 'contexts/AuthContext';
import { bookmarksApiClient, eventsApiClient } from 'services/apiClients';
import * as authService from 'services/authService';

// COOKIE-MIGRATION: этот ключ удалить, когда refresh переедет в httpOnly-cookie.
const REFRESH_TOKEN_KEY = 'memoboard_refresh_token';

/**
 * Устанавливает access-токен на всех API-клиентах.
 * Access-токен живёт ТОЛЬКО в памяти (не в localStorage) —
 * это защита от XSS-кражи.
 */
function setAccessTokenOnClients(accessToken: string) {
  eventsApiClient.setHeader('Authorization', `Bearer ${accessToken}`);
  bookmarksApiClient.setHeader('Authorization', `Bearer ${accessToken}`);
}

function clearAccessTokenOnClients() {
  eventsApiClient.removeHeader('Authorization');
  bookmarksApiClient.removeHeader('Authorization');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Access-токен НЕ храним в state — useRef, потому что его изменение не должно триггерить ре-рендер.
  // Доступ — только изнутри провайдера, наружу не отдаётся.
  const accessTokenRef = useRef<string | null>(null);

  // 🔴 SECURITY-CRITICAL: общий promise для дедупликации одновременных refresh-вызовов.
  // Если 5 параллельных запросов получили 401 — все пять вызовут refresh(),
  // но ФАКТИЧЕСКИЙ /auth/refresh выполнится ОДИН раз, остальные дождутся результата.
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  /**
   * Обновляет пару токенов. Дедуплицирует одновременные вызовы.
   * @returns true если обновление успешно (access-токен обновлён в клиентах),
   *          false если refresh-токен отсутствует/невалиден.
   */
  const refresh = useCallback(async (): Promise<boolean> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const doRefresh = async (): Promise<boolean> => {
      // COOKIE-MIGRATION: когда refresh переедет в cookie, читать его из localStorage не нужно.
      const savedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!savedRefresh) return false;

      try {
        const result = await authService.refreshTokens(savedRefresh);
        accessTokenRef.current = result.accessToken;
        setAccessTokenOnClients(result.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
        return true;
      } catch {
        // Refresh невалиден — чистим всё, компонент ProtectedRoute перенаправит на /login.
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        accessTokenRef.current = null;
        clearAccessTokenOnClients();
        setUser(null);
        return false;
      }
    };

    refreshPromiseRef.current = doRefresh().finally(() => {
      refreshPromiseRef.current = null;
    });
    return refreshPromiseRef.current;
  }, []);

  // Регистрация колбэка на ApiClient'ах: при 401 они будут звать refresh().
  useEffect(() => {
    eventsApiClient.setOnAuthRefreshNeeded(refresh);
    bookmarksApiClient.setOnAuthRefreshNeeded(refresh);
    return () => {
      eventsApiClient.setOnAuthRefreshNeeded(null);
      bookmarksApiClient.setOnAuthRefreshNeeded(null);
    };
  }, [refresh]);

  // Начальная загрузка: если есть refresh — пробуем получить новый access и профиль.
  useEffect(() => {
    const init = async () => {
      const savedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!savedRefresh) {
        setIsLoading(false);
        return;
      }

      const refreshed = await refresh();
      if (!refreshed) {
        setIsLoading(false);
        return;
      }

      try {
        const token = accessTokenRef.current;
        if (!token) {
          setIsLoading(false);
          return;
        }
        const userData = await authService.fetchCurrentUser(token);
        setUser(userData);
      } catch {
        // профиль не загрузился — считаем пользователя разлогиненным
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        accessTokenRef.current = null;
        clearAccessTokenOnClients();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    init();
    // refresh стабилен (useCallback без зависимостей), eslint может требовать его в deps — добавить.
  }, [refresh]);

  const login = useCallback(async (credentials: Parameters<AuthContextValue['login']>[0]) => {
    const result = await authService.login(credentials);
    accessTokenRef.current = result.accessToken;
    setAccessTokenOnClients(result.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
    setUser(result.user);
  }, []);

  const register = useCallback(async (credentials: Parameters<AuthContextValue['register']>[0]) => {
    const result = await authService.register(credentials);
    accessTokenRef.current = result.accessToken;
    setAccessTokenOnClients(result.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    // Сначала чистим клиент (мгновенный UX), потом best-effort на сервер.
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    accessTokenRef.current = null;
    clearAccessTokenOnClients();
    setUser(null);
    // Серверный logout не ждём — ошибки сети игнорируются сервисом.
    void authService.logoutServer(refreshToken);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  }), [user, isLoading, login, register, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
