/**
 * Сервис аутентификации
 *
 * Выполняет HTTP-запросы к /api/auth эндпоинтам.
 * Не использует ApiClient, так как auth-запросы имеют особую логику
 * (не требуют токена для login/register, обрабатывают токен из ответа).
 */

import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from 'types/auth';

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

export async function fetchCurrentUser(token: string): Promise<User> {
  const response = await fetch(`${API_AUTH_BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Токен недействителен');
  }

  const data = await response.json();
  return data.user;
}
