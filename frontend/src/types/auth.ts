/**
 * Типы для системы аутентификации
 */

/** Данные пользователя, возвращаемые API */
export interface User {
  uid: string;
  email: string;
  name: string | null;
}

/** Публичное состояние аутентификации */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/** Данные для входа */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Данные для регистрации */
export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}

/** Ответ API при логине / регистрации / refresh */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/** Ответ API при refresh (без user) */
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}
