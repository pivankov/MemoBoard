/**
 * Сервис аутентификации
 *
 * Выполняет HTTP-запросы к /api/auth эндпоинтам.
 * Не использует ApiClient, так как auth-запросы имеют особую логику
 * (не требуют токена для login/register, обрабатывают токен из ответа).
 */

import type { AuthResponse, LoginCredentials, RefreshResponse, RegisterCredentials, User } from 'types/auth';

import { API_AUTH_BASE_URL } from 'constants/api';

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_AUTH_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Не удалось выполнить вход');
  }
  return response.json();
}

export async function register(credentials: RegisterCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_AUTH_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Не удалось зарегистрироваться');
  }
  return response.json();
}

/**
 * Обновление пары токенов.
 * COOKIE-MIGRATION: когда refresh переедет в httpOnly-cookie,
 * параметр refreshToken и `body` можно будет удалить — браузер
 * будет слать cookie автоматически. Понадобится `credentials: 'include'`.
 *
 * @throws Error если refresh-токен невалиден или сессия скомпрометирована
 */
export async function refreshTokens(refreshToken: string): Promise<RefreshResponse> {
  const response = await fetch(`${API_AUTH_BASE_URL}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Не удалось обновить токен');
  }
  return response.json();
}

/**
 * Logout: отзывает сессию на сервере. Ошибки игнорируются —
 * клиентский logout должен выполняться в любом случае.
 *
 * COOKIE-MIGRATION: аналогично refresh.
 */
export async function logoutServer(refreshToken: string | null): Promise<void> {
  if (!refreshToken) return;
  try {
    await fetch(`${API_AUTH_BASE_URL}/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // logout должен быть best-effort — сеть может быть недоступна
  }
}

/**
 * Получение текущего пользователя. Использует access-токен.
 */
export async function fetchCurrentUser(accessToken: string): Promise<User> {
  const response = await fetch(`${API_AUTH_BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error('Токен недействителен');
  }
  const data = await response.json();
  return data.user;
}
