/**
 * Типы для системы аутентификации
 */

/** Данные пользователя, возвращаемые API */
export interface User {
  uid: string;
  email: string;
  name: string | null;
}

/** Состояние аутентификации */
export interface AuthState {
  user: User | null;
  token: string | null;
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

/** Ответ API при аутентификации */
export interface AuthResponse {
  token: string;
  user: User;
}
