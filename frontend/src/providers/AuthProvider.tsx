import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { User } from 'types/auth';
import { ApiError } from 'types/errors';

import { AuthContext, type AuthContextValue } from 'contexts/AuthContext';
import { bookmarksApiClient, eventsApiClient } from 'services/apiClients';
import * as authService from 'services/authService';

/**
 * Устанавливает access-токен во всех ApiClient-ах.
 *
 * Access-токен живёт ТОЛЬКО в памяти (useRef) — это защита от XSS.
 * Refresh-токен фронту недоступен вовсе: он в httpOnly-cookie.
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

  // Access-токен — только в памяти, наружу не отдаётся.
  const accessTokenRef = useRef<string | null>(null);

  // 🔴 SECURITY-CRITICAL: общий promise для дедупликации одновременных refresh-вызовов.
  // При параллельных 401 все должны ждать один общий /auth/refresh, иначе
  // получим гонку: первый ротирует токен, остальные предъявят уже отозванный
  // → reuse detection → семейство отозвано → ложное разлогинивание.
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  /**
   * Пробует обновить access-токен.
   * Refresh-токен берётся браузером из httpOnly-cookie автоматически;
   * CSRF-токен подставляется внутри authService из document.cookie.
   *
   * @returns true — удалось обновить (access-токен живой, клиенты настроены).
   *          false — cookie отсутствует/невалидна, пользователь не залогинен.
   */
  const refresh = useCallback(async (): Promise<boolean> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const doRefresh = async (): Promise<boolean> => {
      try {
        const result = await authService.refreshTokens();
        accessTokenRef.current = result.accessToken;
        setAccessTokenOnClients(result.accessToken);
        return true;
      } catch {
        // Любая ошибка refresh (401/403/network) трактуется как "не залогинен".
        // Cookies чистит сервер (при 401) либо они и так отсутствуют.
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

  // При 401 в любом ApiClient — зовём refresh().
  useEffect(() => {
    eventsApiClient.setOnAuthRefreshNeeded(refresh);
    bookmarksApiClient.setOnAuthRefreshNeeded(refresh);
    return () => {
      eventsApiClient.setOnAuthRefreshNeeded(null);
      bookmarksApiClient.setOnAuthRefreshNeeded(null);
    };
  }, [refresh]);

  // Начальная загрузка: всегда пробуем /auth/refresh.
  // Если cookie есть и валидна → получаем access + загружаем профиль.
  // Если нет → isLoading=false, user=null, ProtectedRoute отправит на /login.
  useEffect(() => {
    const init = async () => {
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
      } catch (error) {
        // Чистим сессию только при явном 401 (сервер сказал "токен невалиден").
        // При транзиентных ошибках (сеть/500) не трогаем — следующий рендер
        // или действие пользователя может успешно повторить /me.
        const isUnauthorized = error instanceof ApiError && error.statusCode === 401;
        if (isUnauthorized) {
          accessTokenRef.current = null;
          clearAccessTokenOnClients();
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [refresh]);

  const login = useCallback(async (credentials: Parameters<AuthContextValue['login']>[0]) => {
    const result = await authService.login(credentials);
    accessTokenRef.current = result.accessToken;
    setAccessTokenOnClients(result.accessToken);
    setUser(result.user);
  }, []);

  const register = useCallback(async (credentials: Parameters<AuthContextValue['register']>[0]) => {
    const result = await authService.register(credentials);
    accessTokenRef.current = result.accessToken;
    setAccessTokenOnClients(result.accessToken);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    // Сначала чистим клиент (мгновенный UX), потом — серверный logout.
    // Серверный logout очистит cookies; если он упадёт (сеть), cookies
    // останутся до истечения срока — access-токен всё равно мёртв, угрозы нет.
    accessTokenRef.current = null;
    clearAccessTokenOnClients();
    setUser(null);
    void authService.logoutServer();
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
