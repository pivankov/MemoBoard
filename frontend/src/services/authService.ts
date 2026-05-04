/**
 * Сервис аутентификации.
 *
 * Все запросы к /api/auth/* идут с credentials: 'include', потому что
 * аутентификация переведена на cookies (refresh_token httpOnly + csrf_token).
 *
 * Ни одна функция не возвращает и не принимает refresh-токен —
 * он живёт только в httpOnly-cookie и недоступен JS.
 */

import type { AuthResponse, LoginCredentials, RefreshResponse, RegisterCredentials, User } from 'types/auth';

import { API_AUTH_BASE_URL } from 'constants/api';
import { readCsrfToken } from 'services/csrf';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * Формирует заголовки для защищённых CSRF-методов.
 * Если CSRF-cookie отсутствует — пустой объект; backend вернёт 403,
 * фронт интерпретирует это как «не залогинен».
 */
function csrfHeaders(): Record<string, string> {
  const token = readCsrfToken();
  return token ? { 'X-CSRF-Token': token } : {};
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_AUTH_BASE_URL}/login`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
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
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Не удалось зарегистрироваться');
  }
  return response.json();
}

/**
 * Обновление access-токена.
 *
 * Refresh-токен берётся браузером из httpOnly-cookie автоматически.
 * Заголовок X-CSRF-Token — обязателен, без него backend вернёт 403.
 *
 * @throws Error если refresh-cookie отсутствует/невалидна
 *              или CSRF-проверка не прошла.
 */
export async function refreshTokens(): Promise<RefreshResponse> {
  const response = await fetch(`${API_AUTH_BASE_URL}/refresh`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, ...csrfHeaders() },
    credentials: 'include',
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Не удалось обновить токен');
  }
  return response.json();
}

/**
 * Logout: просит сервер отозвать сессию и очистить cookies.
 * Best-effort: сетевые/CSRF ошибки игнорируются, клиент всё равно
 * должен залогаут-нуть пользователя.
 */
export async function logoutServer(): Promise<void> {
  try {
    await fetch(`${API_AUTH_BASE_URL}/logout`, {
      method: 'POST',
      headers: csrfHeaders(),
      credentials: 'include',
    });
  } catch {
    // сеть недоступна / CSRF отсутствует — игнорируем, фронт всё равно разлогинит
  }
}

/**
 * Получение текущего пользователя. Использует access-токен в заголовке.
 */
export async function fetchCurrentUser(accessToken: string): Promise<User> {
  const response = await fetch(`${API_AUTH_BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Токен недействителен');
  }
  const data = await response.json();
  return data.user;
}
