/**
 * Middleware аутентификации
 *
 * Проверяет JWT-токен из заголовка Authorization и добавляет
 * данные пользователя в req.user. Если токен отсутствует
 * или невалиден — возвращает 401 Unauthorized.
 *
 * Формат заголовка: Authorization: Bearer <token>
 *
 * После успешной проверки в req.user доступны:
 * - req.user.userId — внутренний ID пользователя (для SQL-запросов)
 * - req.user.uid — публичный UID пользователя
 * - req.user.email — email пользователя
 * - req.user.name — имя пользователя
 * - req.user.role — роль пользователя ('user' | 'admin'), из БД
 * - req.user.status — статус учётной записи ('active' | 'blocked'), из БД
 */

import { verifyAccessToken } from '../utils/jwt.js';
import { db } from '../db/initdb.js';

/**
 * Данные аутентифицированного пользователя, которые middleware `requireAuth`
 * добавляет в `req.user` после успешной проверки JWT-токена.
 *
 * Единый источник правды о форме `req.user` для всех защищённых роутов.
 * В JSDoc защищённых роутов ссылаться на этот typedef через
 * `{import('../../middleware/auth.js').AuthenticatedUser}`
 * (путь подставить относительно файла роута).
 *
 * @typedef {Object} AuthenticatedUser
 * @property {number} userId - Внутренний числовой ID пользователя (users.id). Используется в SQL-запросах для фильтрации данных по владельцу.
 * @property {string} uid - Публичный UID пользователя.
 * @property {string} email - Email пользователя.
 * @property {string} name - Имя пользователя.
 * @property {'user'|'admin'} role - Роль пользователя. Источник правды — БД (НЕ JWT-payload), подтягивается на каждый запрос.
 * @property {'active'|'blocked'} status - Статус учётной записи.
 */

/**
 * Middleware для проверки JWT-токена
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Токен авторизации не предоставлен' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);

    // Проверяем, что пользователь всё ещё существует в БД
    const user = db.prepare('SELECT id, uid, email, name, role, status FROM users WHERE id = ? LIMIT 1').get(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    // Добавляем данные пользователя в объект запроса
    req.user = {
      userId: user.id,
      uid: user.uid,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Токен авторизации истёк' });
    }
    return res.status(401).json({ error: 'Невалидный токен авторизации' });
  }
}
