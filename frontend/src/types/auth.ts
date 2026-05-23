/**
 * Типы для системы аутентификации
 */

/** Роль пользователя. Источник правды — БД (не JWT-payload). */
export type UserRole = 'user' | 'admin';

/** Статус учётной записи. */
export type UserStatus = 'active' | 'blocked';

/** Данные пользователя, возвращаемые API */
export interface User {
  uid: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: UserStatus;
}

/** Элемент списка пользователей в административном разделе */
export interface AdminUserListItem extends User {
  created_at: string;
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

/** Ответ API при логине / регистрации */
export interface AuthResponse {
  accessToken: string;
  user: User;
}

/** Ответ API при refresh (без user) */
export interface RefreshResponse {
  accessToken: string;
}
