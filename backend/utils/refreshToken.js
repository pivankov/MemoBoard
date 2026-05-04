/**
 * Утилиты для работы с refresh-токенами.
 *
 * Refresh-токен — непрозрачная случайная строка (НЕ JWT).
 * В БД хранится только SHA-256 хеш, raw-токен — только у клиента.
 *
 * Зачем хеширование: если БД утечёт, злоумышленник не сможет
 * использовать токены. Для верификации токена сервер хеширует
 * предъявленный токен и ищет запись по хешу.
 */

import { randomBytes, createHash } from 'crypto';

/**
 * Длина refresh-токена в байтах. 48 байт = 96 hex-символов = ~384 бита энтропии.
 * Больше, чем достаточно для криптостойкости (NIST рекомендует минимум 112 бит).
 */
const REFRESH_TOKEN_BYTES = 48;

/**
 * Срок жизни refresh-токена в миллисекундах.
 * По умолчанию 30 дней, настраивается через env REFRESH_TOKEN_EXPIRES_MS.
 */
const REFRESH_TOKEN_EXPIRES_MS = Number(process.env.REFRESH_TOKEN_EXPIRES_MS) || 30 * 24 * 60 * 60 * 1000;

/**
 * Генерирует криптостойкий refresh-токен.
 *
 * @returns {string} hex-строка длиной 96 символов
 */
export function generateRefreshToken() {
  return randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
}

/**
 * Хеширует refresh-токен для хранения в БД.
 *
 * SHA-256 достаточно: токен уже высокоэнтропийный (не подбирается перебором).
 * Bcrypt/argon2 нужны для паролей с низкой энтропией — здесь они были бы избыточны.
 *
 * @param {string} token - raw refresh-токен
 * @returns {string} hex-хеш длиной 64 символа
 */
export function hashRefreshToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Вычисляет момент истечения refresh-токена в ISO-формате.
 *
 * @returns {string} ISO timestamp, например "2026-05-20T12:34:56.000Z"
 */
export function computeRefreshExpiresAt() {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS).toISOString();
}
