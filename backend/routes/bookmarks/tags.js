import { Router } from 'express';
import { db } from '../../db/initdb.js';
import { generateTagUid } from '../../utils/uid.js';

const router = Router();

/**
 * Получает список всех тегов с подсчетом количества закладок
 * 
 * Теги возвращаются отсортированными по названию (ASC).
 * Для каждого тега подсчитывается количество связанных закладок (amount).
 * 
 * @route GET /api/bookmarks/tags
 * @returns {Object} 200 - JSON объект с массивом тегов в поле data
 * @returns {Object} 500 - JSON объект с описанием ошибки
 * 
 * @example
 * // Успешный ответ:
 * {
 *   "data": [
 *     {
 *       "id": "tag1",
 *       "title": "JavaScript",
 *       "amount": 10
 *     }
 *   ]
 * }
 */
router.get('/', async (req, res) => {
  try {
    const tagsQuery = db.prepare(`
      SELECT bt.uid, bt.title, COUNT(btr.bookmark_id) AS amount
      FROM bookmark_tags bt
      LEFT JOIN bookmark_tag_relations btr ON bt.id = btr.tag_id
      GROUP BY bt.id, bt.uid, bt.title
      ORDER BY bt.title ASC
    `);
    const rows = tagsQuery.all();

    const data = rows.map((row) => ({
      id: String(row.uid),
      title: String(row.title ?? ''),
      amount: Number(row.amount ?? 0),
    }));

    res.status(200).json({ data });
  } catch (error) {
    console.error('Ошибка получения тегов:', error);

    res.status(500).json({ error: 'Не удалось получить список тегов' });
  }
});

/**
 * Получает все закладки с указанным тегом
 * 
 * Возвращает список закладок, связанных с указанным тегом.
 * Для каждой закладки также возвращаются все её теги (не только указанный).
 * 
 * @route GET /api/bookmarks/tags/:id
 * @param {string} req.params.id - UID тега
 * @returns {Object} 200 - JSON объект с массивом закладок в поле data
 * @returns {Object} 400 - Некорректный идентификатор тега
 * @returns {Object} 404 - Тег не найден
 * @returns {Object} 500 - JSON объект с описанием ошибки
 * 
 * @example
 * // Успешный ответ:
 * {
 *   "data": [
 *     {
 *       "id": "abc12345",
 *       "categoryId": "cat1",
 *       "url": "https://example.com",
 *       "title": "Пример сайта",
 *       "preview": "",
 *       "description": "Описание",
 *       "tags": ["tag1", "tag2"],
 *       "createdAt": "2024-12-01T10:00:00Z",
 *       "updatedAt": "2024-12-01T10:00:00Z",
 *       "transitionCounter": 3,
 *       "favorite": false
 *     }
 *   ]
 * }
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор тега' });
    }

    // Проверяем существование тега
    const tagQuery = db.prepare(`
      SELECT id FROM bookmark_tags WHERE uid = ? LIMIT 1
    `);
    const tagRow = tagQuery.get(id);

    if (!tagRow) {
      return res.status(404).json({ error: 'Тег не найден' });
    }

    // Получаем закладки, связанные с этим тегом
    const bookmarksQuery = db.prepare(`
      SELECT b.id, b.uid, b.title, b.url, b.created_at, b.updated_at, b.description, b.preview, b.favorite, b.transition_counter, bc.uid AS category_uid
      FROM bookmarks b
      INNER JOIN bookmark_tag_relations btr ON b.id = btr.bookmark_id
      LEFT JOIN bookmark_categories AS bc ON b.category_id = bc.id
      WHERE btr.tag_id = ?
    `);
    const rows = bookmarksQuery.all(tagRow.id);

    // Получаем все теги для найденных закладок
    const bookmarkIds = rows.map((row) => row.id);
    let tagsMap = new Map();

    if (bookmarkIds.length > 0) {
      const placeholders = bookmarkIds.map(() => '?').join(',');
      const tagsQuery = db.prepare(`
        SELECT btr.bookmark_id, bt.uid AS tag_uid
        FROM bookmark_tag_relations btr
        JOIN bookmark_tags bt ON btr.tag_id = bt.id
        WHERE btr.bookmark_id IN (${placeholders})
      `);
      const tagRows = tagsQuery.all(...bookmarkIds);

      tagRows.forEach((tagRow) => {
        const bookmarkId = tagRow.bookmark_id;
        if (!tagsMap.has(bookmarkId)) {
          tagsMap.set(bookmarkId, []);
        }
        tagsMap.get(bookmarkId).push(String(tagRow.tag_uid));
      });
    }

    const data = rows.map((row) => {
      const tags = tagsMap.get(row.id) || [];

      return {
        id: String(row.uid),
        categoryId: row.category_uid ? String(row.category_uid) : '',
        url: String(row.url ?? ''),
        title: String(row.title ?? ''),
        preview: String(row.preview ?? ''),
        description: String(row.description ?? ''),
        tags,
        createdAt: String(row.created_at ?? ''),
        updatedAt: row.updated_at ? String(row.updated_at) : null,
        transitionCounter: row.transition_counter !== null ? Number(row.transition_counter) : null,
        favorite: Boolean(row.favorite ?? false),
      };
    });

    return res.status(200).json({ data });
  } catch (error) {
    console.error(`Ошибка получения закладок для тега ${id}:`, error);

    return res.status(500).json({ error: 'Не удалось получить закладки для тега' });
  }
});

/**
 * Создает новый тег
 * 
 * Принимает название тега и создает новую запись в базе данных.
 * Автоматически генерирует уникальный UID и устанавливает временные метки.
 * 
 * @route POST /api/bookmarks/tags
 * @param {string} req.body.title - Название тега (обязательное поле)
 * @returns {Object} 201 - JSON объект с полем success
 * @returns {Object} 400 - Некорректное или отсутствующее название тега
 * @returns {Object} 500 - JSON объект с описанием ошибки
 * 
 * @example
 * // Тело запроса:
 * {
 *   "title": "JavaScript"
 * }
 * 
 * @example
 * // Успешный ответ:
 * {
 *   "success": true
 * }
 */
router.post('/', async (req, res) => {
  const { title } = req.body ?? {};

  try {
    // Валидация title
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Название обязательно для заполнения' });
    }

    // Генерация уникального UID
    const uid = generateTagUid();

    // Создание тега
    const insertTag = db.prepare(`
      INSERT INTO bookmark_tags (
        uid, title, created_at, updated_at
      )
      VALUES (
        @uid, @title, datetime('now'), datetime('now')
      )
    `);

    insertTag.run({
      uid,
      title: title.trim(),
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Ошибка создания тега:', error);

    return res.status(500).json({ error: 'Не удалось создать тег' });
  }
});

/**
 * Обновляет название тега по идентификатору
 * 
 * @route PATCH /api/bookmarks/tags/:id
 * @param {string} req.params.id - UID тега
 * @param {string} req.body.title - Новое название тега (обязательное поле)
 * @returns {Object} 200 - JSON объект с полем success
 * @returns {Object} 400 - Некорректный идентификатор или название тега
 * @returns {Object} 404 - Тег не найден
 * @returns {Object} 500 - JSON объект с описанием ошибки
 * 
 * @example
 * // Тело запроса:
 * {
 *   "title": "TypeScript"
 * }
 * 
 * @example
 * // Успешный ответ:
 * {
 *   "success": true
 * }
 */
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { title } = req.body ?? {};

  try {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор тега' });
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Название обязательно для заполнения' });
    }

    // Проверяем существование тега
    const tagQuery = db.prepare(`
      SELECT id FROM bookmark_tags WHERE uid = ? LIMIT 1
    `);
    const tagRow = tagQuery.get(id);

    if (!tagRow) {
      return res.status(404).json({ error: 'Тег не найден' });
    }

    // Обновляем название тега
    const updateQuery = db.prepare(`
      UPDATE bookmark_tags SET title = ?, updated_at = datetime('now') WHERE id = ?
    `);
    updateQuery.run(title.trim(), tagRow.id);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Ошибка обновления тега ${id}:`, error);

    return res.status(500).json({ error: 'Не удалось обновить тег' });
  }
});

/**
 * Удаляет тег по идентификатору
 * 
 * При удалении тега автоматически удаляются все связи с закладками (CASCADE).
 * Сами закладки остаются нетронутыми, удаляется только тег и его связи.
 * 
 * @route DELETE /api/bookmarks/tags/:id
 * @param {string} req.params.id - UID тега
 * @returns {Object} 200 - JSON объект с полем success
 * @returns {Object} 400 - Некорректный идентификатор тега
 * @returns {Object} 404 - Тег не найден
 * @returns {Object} 500 - JSON объект с описанием ошибки
 * 
 * @example
 * // Успешный ответ:
 * {
 *   "success": true
 * }
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор тега' });
    }

    // Проверяем существование тега
    const tagQuery = db.prepare(`
      SELECT id FROM bookmark_tags WHERE uid = ? LIMIT 1
    `);
    const tagRow = tagQuery.get(id);

    if (!tagRow) {
      return res.status(404).json({ error: 'Тег не найден' });
    }

    // Удаляем тег (связи в bookmark_tag_relations удалятся автоматически благодаря CASCADE)
    const deleteQuery = db.prepare(`
      DELETE FROM bookmark_tags WHERE id = ?
    `);
    deleteQuery.run(tagRow.id);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Ошибка удаления тега ${id}:`, error);

    return res.status(500).json({ error: 'Не удалось удалить тег' });
  }
});

export default router;