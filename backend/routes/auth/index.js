/**
 * Маршруты аутентификации
 *
 * POST /api/auth/register — регистрация нового пользователя
 * POST /api/auth/login    — вход в систему
 * GET  /api/auth/me       — получение данных текущего пользователя
 */

import { Router } from 'express';
import { randomUUID } from 'crypto';
import argon2 from 'argon2';
import { db } from '../../db/initdb.js';
import { generateToken } from '../../utils/jwt.js';
import { requireAuth } from '../../middleware/auth.js';

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
 * Возвращает JWT-токен для немедленного входа после регистрации.
 *
 * @route POST /api/auth/register
 * @param {Object} req.body
 * @param {string} req.body.email - Email пользователя (уникальный)
 * @param {string} req.body.password - Пароль (минимум 6 символов)
 * @param {string} [req.body.name] - Имя пользователя
 * @returns {Object} 201 - { token, user: { uid, email, name } }
 * @returns {Object} 400 - Некорректные данные
 * @returns {Object} 409 - Email уже зарегистрирован
 * @returns {Object} 500 - Ошибка сервера
 */
router.post('/register', async (req, res) => {
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

    // Генерация токена
    const token = generateToken({
      id: result.lastInsertRowid,
      uid,
      email: email.trim().toLowerCase(),
    });

    return res.status(201).json({
      token,
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
 * Проверяет email и пароль, возвращает JWT-токен при успехе.
 * Пароль проверяется через Argon2id (сравнение хешей).
 * Сообщение об ошибке не раскрывает, существует ли пользователь с таким email.
 *
 * @route POST /api/auth/login
 * @param {Object} req.body
 * @param {string} req.body.email - Email пользователя
 * @param {string} req.body.password - Пароль пользователя
 * @returns {Object} 200 - { token, user: { uid, email, name } }
 * @returns {Object} 400 - Некорректные данные
 * @returns {Object} 401 - Неверный email или пароль
 * @returns {Object} 500 - Ошибка сервера
 */
router.post('/login', async (req, res) => {
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

    // Генерация токена
    const token = generateToken({
      id: user.id,
      uid: user.uid,
      email: user.email,
    });

    return res.status(200).json({
      token,
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
