/**
 * Контекст аутентификации
 *
 * Хранит состояние авторизации (текущий пользователь, токен).
 * Предоставляет методы login, register, logout.
 * При монтировании проверяет сохранённый токен через /api/auth/me.
 * Автоматически устанавливает заголовок Authorization для всех ApiClient.
 */

import { createContext } from 'react';

import type { AuthState, LoginCredentials, RegisterCredentials } from 'types/auth';

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
