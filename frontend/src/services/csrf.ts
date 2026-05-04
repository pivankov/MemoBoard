/**
 * Чтение CSRF-токена из cookie.
 *
 * Cookie называется csrf_token, выставляется backend-ом при login/register/refresh.
 * В отличие от refresh_token она НЕ httpOnly — это намеренно: фронт
 * должен прочитать её, чтобы положить в заголовок X-CSRF-Token (double-submit).
 *
 * Ограничения: работает только в браузере. В тестах/SSR вернёт null.
 */

const CSRF_COOKIE_NAME = 'csrf_token';

export function readCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${CSRF_COOKIE_NAME}=`));
  if (!match) return null;
  const value = match.slice(CSRF_COOKIE_NAME.length + 1);
  return value.length > 0 ? value : null;
}
