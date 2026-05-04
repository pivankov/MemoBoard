/**
 * Опции cookie для refresh-токена и CSRF-токена.
 *
 * Архитектурные решения (см. Refresh_tokens_cookies_plan.md):
 * - SameSite=Lax: достаточно, т.к. deploy same-origin; блокирует cross-origin POST CSRF.
 * - Secure: только в production (в dev HTTP-cookies с Secure не выставятся).
 * - path='/api/auth': cookie не улетает в /api/events, /api/bookmarks, статику.
 * - domain НЕ задан: host-only cookie, без расшаривания на субдомены.
 */

import { randomBytes } from 'crypto';

const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Срок жизни refresh cookie в миллисекундах.
 * Должен совпадать с REFRESH_TOKEN_EXPIRES_MS (см. backend/utils/refreshToken.js).
 */
const REFRESH_COOKIE_MAX_AGE = Number(process.env.REFRESH_TOKEN_EXPIRES_MS) || 30 * 24 * 60 * 60 * 1000;

/**
 * Имена cookie. Не меняй без согласования с фронтом.
 */
export const REFRESH_COOKIE_NAME = 'refresh_token';
export const CSRF_COOKIE_NAME = 'csrf_token';

/**
 * Путь refresh-cookie (httpOnly). Сужаем до /api/auth, чтобы cookie
 * не улетала на /api/events, /api/bookmarks и статику.
 */
export const AUTH_COOKIE_PATH = '/api/auth';

/**
 * Путь CSRF-cookie. ОБЯЗАТЕЛЬНО '/', потому что фронт читает её из
 * document.cookie на страницах приложения (например, '/' или '/login').
 * Cookie с Path=/api/auth не видна из document.cookie на '/', и тогда
 * заголовок X-CSRF-Token не отправится → сервер вернёт 403.
 *
 * Безопасность от этого не страдает: CSRF-cookie не секрет сама по себе —
 * её ценность в double-submit (совпадение cookie == заголовок), а прочитать
 * её из чужого origin атакующий не может благодаря Same-Origin Policy.
 */
export const CSRF_COOKIE_PATH = '/';

/**
 * Опции для refresh-токена (httpOnly, недоступен JS).
 */
export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: AUTH_COOKIE_PATH,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  };
}

/**
 * Опции для CSRF-токена (читаемый фронтом через document.cookie).
 *
 * httpOnly НЕ ставим: фронт читает значение, чтобы положить его
 * в заголовок X-CSRF-Token (double-submit cookie pattern).
 */
export function csrfCookieOptions() {
  return {
    httpOnly: false,
    secure: IS_PROD,
    sameSite: 'lax',
    path: CSRF_COOKIE_PATH,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  };
}

/**
 * Опции для очистки cookie (res.clearCookie).
 * Браузер сверяет path/domain при удалении — должны совпадать с теми,
 * которыми cookie была выставлена.
 */
export function clearAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: AUTH_COOKIE_PATH,
  };
}

export function clearCsrfCookieOptions() {
  return {
    httpOnly: false,
    secure: IS_PROD,
    sameSite: 'lax',
    path: CSRF_COOKIE_PATH,
  };
}

/**
 * Генерирует CSRF-токен (32 байта hex = 256 бит энтропии).
 * Ротируется вместе с refresh-токеном.
 */
export function generateCsrfToken() {
  return randomBytes(32).toString('hex');
}
