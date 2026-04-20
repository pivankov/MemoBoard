/**
 * Утилиты для работы с JWT-токенами
 *
 * JWT (JSON Web Token) — стандарт аутентификации для SPA.
 * Токен создаётся при логине и передаётся с каждым запросом
 * в заголовке Authorization: Bearer <token>
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'memoboard-dev-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Создаёт JWT-токен для пользователя
 *
 * @param {Object} user - объект пользователя из БД
 * @param {number} user.id - внутренний ID пользователя
 * @param {string} user.uid - публичный UID пользователя
 * @param {string} user.email - email пользователя
 * @returns {string} подписанный JWT-токен
 */
export function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      uid: user.uid,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Проверяет и декодирует JWT-токен
 *
 * @param {string} token - JWT-токен для верификации
 * @returns {Object} декодированный payload токена
 * @throws {jwt.JsonWebTokenError} если токен невалидный
 * @throws {jwt.TokenExpiredError} если токен истёк
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
