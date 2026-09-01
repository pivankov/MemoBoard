/**
 * Утилиты для Personal Access Token (PAT) расширения.
 *
 * PAT — непрозрачная случайная строка с префиксом `mb_pat_`.
 * В БД хранится только SHA-256-хеш (по аналогии с sessions.token_hash);
 * raw-токен показывается пользователю один раз при создании.
 */

import { randomBytes, createHash } from 'crypto';

/** Префикс всех PAT. По нему requireAuth отличает PAT от JWT. */
export const PAT_PREFIX = 'mb_pat_';

/**
 * Генерирует новый PAT: `mb_pat_<hex>`, где hex = 32 случайных байта (256 бит энтропии).
 * @returns {string}
 */
export function generatePat() {
  return `${PAT_PREFIX}${randomBytes(32).toString('hex')}`;
}

/**
 * Хеширует PAT для хранения/поиска в БД. SHA-256 достаточно: токен высокоэнтропийный.
 * @param {string} token - raw-токен
 * @returns {string} hex-хеш длиной 64 символа
 */
export function hashPat(token) {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Проверяет, является ли предъявленное Bearer-значение PAT (по префиксу).
 * @param {string} value
 * @returns {boolean}
 */
export function isPatToken(value) {
  return typeof value === 'string' && value.startsWith(PAT_PREFIX);
}
