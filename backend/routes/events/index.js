import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../../db/initdb.js';
import { normalizeInputDate } from "../../utils/date.js"

/**
 * @fileoverview Роутер событий (`/api/events`).
 *
 * Все маршруты этого роутера монтируются в `backend/routes/index.js` под
 * префиксом `/api/events` и ЗАЩИЩЕНЫ middleware `requireAuth`:
 *
 *     router.use('/events', requireAuth, events)
 *
 * Поэтому в каждом обработчике гарантированно доступен `req.user`
 * (typedef `AuthenticatedUser` определён в `backend/middleware/auth.js`),
 * а все SQL-запросы фильтруют данные по `req.user.userId`, обеспечивая
 * изоляцию данных между пользователями.
 *
 * Любой из роутов может вернуть 401 Unauthorized, если токен отсутствует,
 * невалиден, истёк или пользователь удалён из БД. Это указано в JSDoc
 * каждого роута через `@returns 401`.
 */

const router = Router();

/**
 * Получает список событий текущего пользователя
 *
 * Выборка ограничена событиями текущего пользователя (`req.user.userId`).
 *
 * **Требуется авторизация** (Bearer token). См. `requireAuth` и typedef
 * `AuthenticatedUser` в `backend/middleware/auth.js`.
 *
 * @route GET /api/events
 * @security BearerAuth
 * @param {import('../../middleware/auth.js').AuthenticatedUser} req.user - Данные текущего пользователя (добавляются middleware `requireAuth`)
 * @returns {Object} 200 - JSON объект с массивом событий в поле data
 * @returns {Object} 401 - Токен авторизации отсутствует / невалиден / истёк
 * @returns {Object} 500 - JSON объект с описанием ошибки
 * 
 * @example
 * // Успешный ответ:
 * {
 *   "data": [
 *     {
 *       "id": "550e8400-e29b",
 *       "title": "День рождения",
 *       "originalDate": "2024-06-13T00:00:00Z",
 *       "nextDate": "",
 *       "type": "birthday",
 *       "description": "Важное событие",
 *       "recurrence": "yearly"
 *     }
 *   ]
 * }
 */
router.get('/', async (req, res) => {
  try {
    const eventsQuery = db.prepare(`
      SELECT e.uid, e.title, e.start_at, e.description, e.recurrence, t.slug as type
      FROM events e
      JOIN event_types t ON t.id = e.type_id
      WHERE e.user_id = ?
    `);
    const rows = eventsQuery.all(req.user.userId);

    const data = rows.map((row) => ({
      id: String(row.uid),
      title: String(row.title ?? ''),
      originalDate: String(row.start_at ?? ''),
      nextDate: '',
      type: String(row.type ?? ''),
      description: String(row.description ?? ''),
      recurrence: String(row.recurrence ?? 'none'),
    }));

    res.status(200).json({ data });
  } catch (error) {
    console.error('Ошибка получения событий:', error);

    res.status(500).json({ error: 'Не удалось получить список событий' });
  }
});

/**
 * Получает событие текущего пользователя по уникальному идентификатору
 *
 * Событие должно принадлежать текущему пользователю (`req.user.userId`),
 * иначе будет возвращено 404.
 *
 * **Требуется авторизация** (Bearer token). См. `requireAuth` и typedef
 * `AuthenticatedUser` в `backend/middleware/auth.js`.
 *
 * @route GET /api/events/:id
 * @security BearerAuth
 * @param {import('../../middleware/auth.js').AuthenticatedUser} req.user - Данные текущего пользователя (добавляются middleware `requireAuth`)
 * @param {string} req.params.id - UID события
 * @returns {Object} 200 - JSON объект с событием в поле data
 * @returns {Object} 400 - Некорректный идентификатор события
 * @returns {Object} 401 - Токен авторизации отсутствует / невалиден / истёк
 * @returns {Object} 404 - Событие не найдено (или принадлежит другому пользователю)
 * @returns {Object} 500 - JSON объект с описанием ошибки
 * 
 * @example
 * // Успешный ответ:
 * {
 *   "data": {
 *     "id": "550e8400-e29b",
 *     "title": "День рождения",
 *     "originalDate": "2024-06-13T00:00:00Z",
 *     "nextDate": "",
 *     "type": "birthday",
 *     "description": "Важное событие",
 *     "recurrence": "yearly"
 *   }
 * }
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор события' });
    }

    const eventQuery = db.prepare(`
      SELECT e.uid, e.title, e.start_at, e.description, e.recurrence, t.slug as type
      FROM events e
      JOIN event_types t ON t.id = e.type_id
      WHERE e.uid = ? AND e.user_id = ?
      LIMIT 1
    `);

    const row = eventQuery.get(id, req.user.userId);

    if (!row) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }
    
    const data = {
      id: String(row.uid),
      title: String(row.title ?? ''),
      originalDate: String(row.start_at ?? ''),
      nextDate: '',
      type: String(row.type ?? ''),
      description: String(row.description ?? ''),
      recurrence: String(row.recurrence ?? 'none'),
    };

    return res.status(200).json({ data });
  } catch (error) {
    console.error(`Ошибка получения события ${id}:`, error);

    return res.status(500).json({ error: 'Не удалось получить событие' });
  }
});

/**
 * Создает новое событие у текущего пользователя
 *
 * Событие привязывается к текущему пользователю (`req.user.userId`).
 *
 * **Требуется авторизация** (Bearer token). См. `requireAuth` и typedef
 * `AuthenticatedUser` в `backend/middleware/auth.js`.
 *
 * @route POST /api/events
 * @security BearerAuth
 * @param {import('../../middleware/auth.js').AuthenticatedUser} req.user - Данные текущего пользователя (добавляются middleware `requireAuth`)
 * @param {Object} req.body - Данные нового события
 * @param {string} req.body.title - Название события
 * @param {string} req.body.originalDate - Дата события (ISO 8601 или YYYY-MM-DD)
 * @param {string} req.body.type - Тип события (birthday, holiday, anniversary, other)
 * @param {string} [req.body.description] - Описание события
 * @param {string} [req.body.recurrence=none] - Повторение (none, monthly, yearly)
 * @returns {Object} 201 - JSON объект с созданным событием в поле data
 * @returns {Object} 400 - Некорректные данные (заголовок, дата, тип или recurrence)
 * @returns {Object} 401 - Токен авторизации отсутствует / невалиден / истёк
 * @returns {Object} 500 - JSON объект с описанием ошибки
 * 
 * @example
 * // Тело запроса:
 * {
 *   "title": "День рождения",
 *   "originalDate": "2024-06-13",
 *   "type": "birthday",
 *   "description": "Важное событие",
 *   "recurrence": "yearly"
 * }
 * 
 * @example
 * // Успешный ответ:
 * {
 *   "data": {
 *     "id": "550e8400-e29b",
 *     "title": "День рождения",
 *     "originalDate": "2024-06-13T00:00:00Z",
 *     "type": "birthday",
 *     "description": "Важное событие",
 *     "recurrence": "yearly"
 *   }
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { title, originalDate, type, recurrence, description } = req.body ?? {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный заголовок события' });
    }

    if (!originalDate || typeof originalDate !== 'string' || originalDate.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректная дата события' });
    }

    const normalizedDate = normalizeInputDate(originalDate);
    if (!normalizedDate) {
      return res.status(400).json({ error: 'Некорректный формат даты события' });
    }

    if (!type || typeof type !== 'string' || type.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный тип события' });
    }

    const allowedRecurrences = new Set(['none', 'monthly', 'yearly']);
    const recurrenceValue = typeof recurrence === 'string' ? recurrence : 'none';
    
    if (!allowedRecurrences.has(recurrenceValue)) {
      return res.status(400).json({ error: 'Некорректное значение recurrence' });
    }

    const typeRow = db.prepare('SELECT id FROM event_types WHERE slug = ? LIMIT 1').get(type);

    if (!typeRow?.id) {
      return res.status(400).json({ error: 'Указан неизвестный тип события' });
    }

    const insertQuery = db.prepare(`
      INSERT INTO events (uid, user_id, title, type_id, start_at, description, recurrence)
      VALUES (@uid, @user_id, @title, @type_id, @start_at, @description, @recurrence)
    `);

    const uid = randomUUID();

    const payload = {
      uid,
      user_id: req.user.userId,
      title: String(title),
      type_id: Number(typeRow.id),
      start_at: String(normalizedDate),
      description: description ? String(description) : null,
      recurrence: recurrenceValue,
    };

    insertQuery.run(payload);

    const result = {
      id: String(uid),
      title: String(title),
      originalDate: String(normalizedDate),
      type: String(type),
      description: description ? String(description) : '',
      recurrence: recurrenceValue,
    };

    return res.status(201).json({ data: result });
  } catch (error) {
    console.error('Ошибка создания события:', error);

    return res.status(500).json({ error: 'Не удалось создать событие' });
  }
});

/**
 * Обновляет существующее событие текущего пользователя
 *
 * Событие должно принадлежать текущему пользователю (`req.user.userId`),
 * иначе будет возвращено 404.
 *
 * **Требуется авторизация** (Bearer token). См. `requireAuth` и typedef
 * `AuthenticatedUser` в `backend/middleware/auth.js`.
 *
 * @route PUT /api/events/:id
 * @security BearerAuth
 * @param {import('../../middleware/auth.js').AuthenticatedUser} req.user - Данные текущего пользователя (добавляются middleware `requireAuth`)
 * @param {string} req.params.id - UID события
 * @param {Object} req.body - Данные для обновления события
 * @param {string} req.body.title - Название события
 * @param {string} req.body.originalDate - Дата события (ISO 8601 или YYYY-MM-DD)
 * @param {string} req.body.type - Тип события (birthday, holiday, anniversary, other)
 * @param {string} [req.body.description] - Описание события
 * @param {string} req.body.recurrence - Повторение (none, monthly, yearly)
 * @returns {Object} 200 - JSON объект с обновленным событием в поле data
 * @returns {Object} 400 - Некорректные данные
 * @returns {Object} 401 - Токен авторизации отсутствует / невалиден / истёк
 * @returns {Object} 404 - Событие не найдено (или принадлежит другому пользователю)
 * @returns {Object} 500 - JSON объект с описанием ошибки
 * 
 * @example
 * // Тело запроса:
 * {
 *   "title": "День рождения (обновлено)",
 *   "originalDate": "2024-06-13",
 *   "type": "birthday",
 *   "description": "Обновленное описание",
 *   "recurrence": "yearly"
 * }
 * 
 * @example
 * // Успешный ответ:
 * {
 *   "data": {
 *     "id": "550e8400-e29b",
 *     "title": "День рождения (обновлено)",
 *     "originalDate": "2024-06-13T00:00:00Z",
 *     "type": "birthday",
 *     "description": "Обновленное описание",
 *     "recurrence": "yearly"
 *   }
 * }
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор события' });
    }

    const { title, originalDate, type, recurrence, description } = req.body ?? {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный заголовок события' });
    }

    if (!originalDate || typeof originalDate !== 'string' || originalDate.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректная дата события' });
    }

    const normalizedDate = normalizeInputDate(originalDate);
    if (!normalizedDate) {
      return res.status(400).json({ error: 'Некорректный формат даты события' });
    }

    if (!type || typeof type !== 'string' || type.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный тип события' });
    }

    const existed = db.prepare('SELECT id FROM events WHERE uid = ? AND user_id = ? LIMIT 1').get(id, req.user.userId);
    if (!existed?.id) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    const allowedRecurrences = new Set(['none', 'monthly', 'yearly']);
    const recurrenceValue = typeof recurrence === 'string' ? recurrence : 'none';
    if (!allowedRecurrences.has(recurrenceValue)) {
      return res.status(400).json({ error: 'Некорректное значение recurrence' });
    }

    const typeRow = db.prepare('SELECT id FROM event_types WHERE slug = ? LIMIT 1').get(type);
    if (!typeRow?.id) {
      return res.status(400).json({ error: 'Указан неизвестный тип события' });
    }

    const updateQuery = db.prepare(`
      UPDATE events
      SET title = @title,
          type_id = @type_id,
          start_at = @start_at,
          description = @description,
          recurrence = @recurrence
      WHERE uid = @uid
    `);

    const payload = {
      uid: String(id),
      title: String(title),
      type_id: Number(typeRow.id),
      start_at: String(normalizedDate),
      description: description ? String(description) : null,
      recurrence: recurrenceValue,
    };

    const resultUpdate = updateQuery.run(payload);
    if (resultUpdate.changes === 0) {
      return res.status(500).json({ error: 'Не удалось обновить событие' });
    }

    const result = {
      id: String(id),
      title: String(title),
      originalDate: String(normalizedDate),
      type: String(type),
      description: description ? String(description) : '',
      recurrence: recurrenceValue,
    };

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error(`Ошибка обновления события ${id}:`, error);

    return res.status(500).json({ error: 'Не удалось обновить событие' });
  }
});

/**
 * Удаляет событие текущего пользователя по идентификатору
 *
 * Событие должно принадлежать текущему пользователю (`req.user.userId`),
 * иначе будет возвращено 404.
 *
 * **Требуется авторизация** (Bearer token). См. `requireAuth` и typedef
 * `AuthenticatedUser` в `backend/middleware/auth.js`.
 *
 * @route DELETE /api/events/:id
 * @security BearerAuth
 * @param {import('../../middleware/auth.js').AuthenticatedUser} req.user - Данные текущего пользователя (добавляются middleware `requireAuth`)
 * @param {string} req.params.id - UID события
 * @returns {void} 204 - Успешное удаление (пустой ответ)
 * @returns {Object} 400 - Некорректный идентификатор события
 * @returns {Object} 401 - Токен авторизации отсутствует / невалиден / истёк
 * @returns {Object} 404 - Событие не найдено (или принадлежит другому пользователю)
 * @returns {Object} 500 - JSON объект с описанием ошибки
 * 
 * @example
 * // Успешный ответ: 204 No Content (пустой ответ)
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор события' });
    }

    const deleteQuery = db.prepare('DELETE FROM events WHERE uid = ? AND user_id = ?');
    const result = deleteQuery.run(id, req.user.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(`Ошибка удаления события ${id}:`, error);

    return res.status(500).json({ error: 'Не удалось удалить событие' });
  }
});

export default router;