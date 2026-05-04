/**
 * Маршруты аутентификации
 *
 * POST /api/auth/register — регистрация нового пользователя
 * POST /api/auth/login    — вход в систему
 * POST /api/auth/refresh  — ротация пары токенов
 * POST /api/auth/logout   — выход (отзыв refresh-сессии на сервере)
 * GET  /api/auth/me       — получение данных текущего пользователя
 */

import { Router } from 'express';
import { randomUUID } from 'crypto';
import argon2 from 'argon2';
import { db } from '../../db/initdb.js';
import { generateAccessToken } from '../../utils/jwt.js';
import { requireAuth } from '../../middleware/auth.js';
import { authLimiter, refreshLimiter } from '../../middleware/rateLimit.js';
import { createSession, rotateSession, revokeSessionByToken } from '../../services/sessionService.js';
import {
  REFRESH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  refreshCookieOptions,
  csrfCookieOptions,
  clearAuthCookieOptions,
  clearCsrfCookieOptions,
  generateCsrfToken,
} from '../../utils/cookieOptions.js';
import { requireCsrf } from '../../middleware/csrf.js';

/**
 * Ставит на response обе auth-cookie: refresh_token (httpOnly) и csrf_token.
 * Используется после login/register/refresh — то есть везде, где
 * выдаётся новая refresh-сессия.
 *
 * @param {import('express').Response} res
 * @param {string} refreshToken - сырой refresh-токен (hex, 96 символов)
 * @returns {string} сгенерированный CSRF-токен (для логирования/отладки; фронт берёт из cookie)
 */
function issueAuthCookies(res, refreshToken) {
  const csrfToken = generateCsrfToken();
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  res.cookie(CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions());
  return csrfToken;
}

/**
 * Удаляет обе auth-cookie. Используется в logout и при 401 на refresh.
 */
function clearAuthCookies(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, clearAuthCookieOptions());
  res.clearCookie(CSRF_COOKIE_NAME, clearCsrfCookieOptions());
}

const router = Router();

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  timeCost: 3,
  memoryCost: 65536,
  parallelism: 1,
};

/**
 * Регистрация нового пользователя
 *
 * Создаёт нового пользователя в БД с хешированным паролем (Argon2id).
 * Создаёт серверную сессию и возвращает пару токенов для немедленного входа после регистрации.
 *
 * @route POST /api/auth/register
 * @param {Object} req.body
 * @param {string} req.body.email - Email пользователя (уникальный)
 * @param {string} req.body.password - Пароль (минимум 6 символов)
 * @param {string} [req.body.name] - Имя пользователя
 * @returns {Object} 201 - { accessToken, user: { uid, email, name } } + выставляет httpOnly cookie `refresh_token` и cookie `csrf_token`
 * @returns {Object} 400 - Некорректные данные
 * @returns {Object} 409 - Email уже зарегистрирован
 * @returns {Object} 500 - Ошибка сервера
 */
router.post('/register', authLimiter, async (req, res) => {
  const { email, password, name } = req.body ?? {};

  try {
    // Валидация email
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return res.status(400).json({ error: 'Email обязателен для заполнения' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Некорректный формат email' });
    }

    // Валидация пароля
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
    }

    // Проверка уникальности email
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ? LIMIT 1').get(email.trim().toLowerCase());
    if (existingUser) {
      return res.status(409).json({ error: 'Пользователь с таким email уже зарегистрирован' });
    }

    // Хеширование пароля
    const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);

    // Создание пользователя
    const uid = randomUUID();
    const insertUser = db.prepare(`
      INSERT INTO users (uid, email, name, password_hash, password_algo)
      VALUES (@uid, @email, @name, @password_hash, @password_algo)
    `);

    const result = insertUser.run({
      uid,
      email: email.trim().toLowerCase(),
      name: name ? name.trim() : null,
      password_hash: passwordHash,
      password_algo: 'argon2id',
    });

    // Генерация пары токенов и создание серверной сессии
    const accessToken = generateAccessToken({
      id: result.lastInsertRowid,
      uid,
      email: email.trim().toLowerCase(),
    });

    const { refreshToken } = createSession({
      userId: result.lastInsertRowid,
      userAgent: req.get('user-agent') ?? null,
      ipAddress: req.ip,
    });

    issueAuthCookies(res, refreshToken);

    return res.status(201).json({
      accessToken,
      user: {
        uid,
        email: email.trim().toLowerCase(),
        name: name ? name.trim() : null,
      },
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    return res.status(500).json({ error: 'Не удалось зарегистрировать пользователя' });
  }
});

/**
 * Вход в систему
 *
 * Проверяет email и пароль, создаёт серверную сессию и возвращает пару токенов при успехе.
 * Пароль проверяется через Argon2id (сравнение хешей).
 * Сообщение об ошибке не раскрывает, существует ли пользователь с таким email.
 *
 * @route POST /api/auth/login
 * @param {Object} req.body
 * @param {string} req.body.email - Email пользователя
 * @param {string} req.body.password - Пароль пользователя
 * @returns {Object} 200 - { accessToken, user: { uid, email, name } } + выставляет httpOnly cookie `refresh_token` и cookie `csrf_token`
 * @returns {Object} 400 - Некорректные данные
 * @returns {Object} 401 - Неверный email или пароль
 * @returns {Object} 500 - Ошибка сервера
 */
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body ?? {};

  try {
    // Валидация
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return res.status(400).json({ error: 'Email обязателен для заполнения' });
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ error: 'Пароль обязателен для заполнения' });
    }

    // Поиск пользователя
    const user = db.prepare('SELECT id, uid, email, name, password_hash FROM users WHERE email = ? LIMIT 1')
      .get(email.trim().toLowerCase());

    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Проверка пароля
    const isPasswordValid = await argon2.verify(user.password_hash, password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Генерация пары токенов и создание серверной сессии
    const accessToken = generateAccessToken({ id: user.id, uid: user.uid, email: user.email });

    const { refreshToken } = createSession({
      userId: user.id,
      userAgent: req.get('user-agent') ?? null,
      ipAddress: req.ip,
    });

    issueAuthCookies(res, refreshToken);

    return res.status(200).json({
      accessToken,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Ошибка входа:', error);
    return res.status(500).json({ error: 'Не удалось выполнить вход' });
  }
});

/**
 * Ротация access + refresh токенов.
 *
 * Принимает refresh-токен из cookie `refresh_token` (httpOnly) и
 * CSRF-заголовок `X-CSRF-Token` (значение должно совпадать с cookie `csrf_token`).
 *
 * Выставляет новую пару cookies: refresh_token и csrf_token.
 * Старый refresh-токен становится невалидным.
 *
 * 🔴 SECURITY-CRITICAL: при обнаружении повторного использования
 * уже отротированного refresh-токена возвращает 401 И аннулирует
 * всё семейство сессий (см. sessionService.rotateSession).
 *
 * @route POST /api/auth/refresh
 * @returns {Object} 200 - { accessToken } + новые cookies
 * @returns {Object} 401 - refresh отсутствует, истёк, отозван или обнаружено повторное использование
 * @returns {Object} 403 - CSRF-токен отсутствует или неверен
 * @returns {Object} 500 - ошибка сервера
 */
router.post('/refresh', refreshLimiter, requireCsrf, async (req, res) => {
  const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
    return res.status(401).json({ error: 'Refresh-токен не предоставлен' });
  }

  try {
    const result = rotateSession(rawRefreshToken, {
      userAgent: req.get('user-agent') ?? null,
      ipAddress: req.ip,
    });

    if (result.status === 'not_found' || result.status === 'expired' || result.status === 'revoked') {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Refresh-токен недействителен' });
    }

    if (result.status === 'reuse_detected') {
      console.warn(`[SECURITY] Обнаружено повторное использование refresh-токена для user_id=${result.userId}. Всё семейство сессий отозвано.`);
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Сессия скомпрометирована, авторизуйтесь заново' });
    }

    // result.status === 'ok'
    const user = db.prepare('SELECT id, uid, email FROM users WHERE id = ? LIMIT 1').get(result.newSession.user_id);
    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    const accessToken = generateAccessToken(user);
    issueAuthCookies(res, result.refreshToken);

    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error('Ошибка ротации токена:', error);
    return res.status(500).json({ error: 'Не удалось обновить токен' });
  }
});

/**
 * Logout: отзывает refresh-сессию на сервере.
 *
 * Принимает refresh-токен из cookie `refresh_token` (httpOnly) и
 * CSRF-заголовок `X-CSRF-Token`. Сам endpoint публичный (не требует requireAuth),
 * потому что access-токен может уже истечь, но refresh — ещё валиден.
 *
 * Отзывает ТОЛЬКО предъявленную сессию, не всё семейство.
 * Всегда очищает обе auth-cookie в ответе.
 *
 * @route POST /api/auth/logout
 * @returns {void} 204 - Всегда, даже если токен не найден
 * @returns {Object} 403 - CSRF-токен отсутствует или неверен
 */
router.post('/logout', requireCsrf, (req, res) => {
  const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (rawRefreshToken && typeof rawRefreshToken === 'string') {
    try {
      revokeSessionByToken(rawRefreshToken);
    } catch (error) {
      console.error('Ошибка отзыва сессии при logout:', error);
      // Не возвращаем 500: logout должен быть идемпотентным и всегда «успешным» для клиента.
    }
  }

  clearAuthCookies(res);
  return res.status(204).end();
});

/**
 * Получение данных текущего пользователя
 *
 * Требует авторизации (JWT-токен в заголовке).
 * Используется frontend-ом при загрузке приложения для проверки
 * валидности сохранённого токена.
 *
 * @route GET /api/auth/me
 * @returns {Object} 200 - { user: { uid, email, name } }
 * @returns {Object} 401 - Не авторизован
 */
router.get('/me', requireAuth, (req, res) => {
  return res.status(200).json({
    user: {
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name,
    },
  });
});

export default router;
