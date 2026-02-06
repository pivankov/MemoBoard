import { Router } from 'express';
import { db } from '../../db/initdb.js';
import { generateCategoryUid } from '../../utils/uid.js';

const router = Router();

/**
 * Получает список всех категорий с подсчетом количества закладок
 * 
 * Категории возвращаются отсортированными по позиции (position) и названию.
 * Для каждой категории подсчитывается количество закладок (amount).
 * 
 * @route GET /api/bookmarks/categories
 * @returns {Object} 200 - JSON объект с массивом категорий в поле data
 * @returns {Object} 500 - JSON объект с описанием ошибки
 * 
 * @example
 * // Успешный ответ:
 * {
 *   "data": [
 *     {
 *       "id": "cat1",
 *       "parentId": null,
 *       "title": "Разработка",
 *       "icon": "code",
 *       "position": 0,
 *       "amount": 5,
 *       "createdAt": "2024-12-01T10:00:00Z",
 *       "updatedAt": "2024-12-01T10:00:00Z"
 *     }
 *   ]
 * }
 */
router.get('/', async (req, res) => {
  try {
    const categoriesQuery = db.prepare(`
      SELECT bc.uid, bc.title, bc.icon, bc.position, bc.created_at, bc.updated_at, parent.uid AS parent_uid, COUNT(b.id) AS amount
      FROM bookmark_categories bc
      LEFT JOIN bookmark_categories parent ON bc.parent_id = parent.id
      LEFT JOIN bookmarks b ON bc.id = b.category_id
      GROUP BY bc.id, bc.uid, bc.title, bc.icon, bc.position, bc.created_at, bc.updated_at, parent.uid
      ORDER BY bc.position ASC, bc.title ASC
    `);
    const rows = categoriesQuery.all();

    const data = rows.map((row) => ({
      id: String(row.uid),
      parentId: row.parent_uid ? String(row.parent_uid) : null,
      title: String(row.title ?? ''),
      icon: row.icon ? String(row.icon) : null,
      position: Number(row.position ?? 0),
      amount: Number(row.amount ?? 0),
      createdAt: String(row.created_at ?? ''),
      updatedAt: row.updated_at ? String(row.updated_at) : null,
    }));

    res.status(200).json({ data });
  } catch (error) {
    console.error('Ошибка получения категорий:', error);

    res.status(500).json({ error: 'Не удалось получить список категорий' });
  }
});

/**
 * Получает все закладки в указанной категории
 * 
 * Возвращает список закладок, отсортированных по дате обновления (DESC).
 * Для каждой закладки также возвращаются связанные теги.
 * 
 * @route GET /api/bookmarks/categories/:id
 * @param {string} req.params.id - UID категории
 * @returns {Object} 200 - JSON объект с массивом закладок в поле data
 * @returns {Object} 400 - Некорректный идентификатор категории
 * @returns {Object} 404 - Категория не найдена
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
 *       "tags": ["tag1"],
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
      return res.status(400).json({ error: 'Некорректный идентификатор категории' });
    }

    const categoryQuery = db.prepare(`
      SELECT id
      FROM bookmark_categories
      WHERE uid = ?
      LIMIT 1
    `);
    const categoryRow = categoryQuery.get(id);

    if (!categoryRow) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    const bookmarksQuery = db.prepare(`
      SELECT b.id, b.uid, b.title, b.url, b.created_at, b.updated_at, b.description, b.preview, b.favorite, b.transition_counter, bc.uid AS category_uid
      FROM bookmarks b
      LEFT JOIN bookmark_categories bc ON b.category_id = bc.id
      WHERE b.category_id = ?
      ORDER BY b.updated_at DESC
    `);
    const rows = bookmarksQuery.all(categoryRow.id);

    const bookmarkIds = rows.map((row) => row.id);
    const tagsMap = new Map();

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
    console.error(`Ошибка получения закладок для категории ${id}:`, error);

    return res.status(500).json({ error: 'Не удалось получить закладки для категории' });
  }
});

/**
 * Создает новую категорию или коллекцию
 * 
 * Универсальный метод для создания как коллекций (родительских категорий), так и вложенных категорий.
 * Если parentId не передан или null - создается коллекция, иначе создается категория внутри коллекции.
 * Позиция (position) вычисляется автоматически как MAX(position) + 1 среди категорий того же уровня.
 * Иконка может быть установлена только для категорий, для коллекций игнорируется.
 * 
 * @route POST /api/bookmarks/categories
 * @param {Object} req.body - Данные новой категории/коллекции
 * @param {string} req.body.title - Название категории/коллекции
 * @param {string} [req.body.icon] - Иконка (только для категорий)
 * @param {string|null} [req.body.parentId] - UID родительской категории (null для коллекции)
 * @returns {Object} 201 - JSON объект с результатом создания
 * @returns {Object} 400 - Некорректные данные / родительская категория не найдена
 * @returns {Object} 500 - JSON объект с описанием ошибки
 * 
 * @example
 * // Создание коллекции:
 * {
 *   "title": "Разработка"
 * }
 * 
 * @example
 * // Создание категории внутри коллекции:
 * {
 *   "title": "Frontend",
 *   "icon": "react",
 *   "parentId": "abc1"
 * }
 * 
 * @example
 * // Успешный ответ:
 * {
 *   "success": true
 * }
 */
router.post('/', async (req, res) => {
  const { title, icon, parentId } = req.body ?? {};

  try {
    // Валидация title
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Название обязательно для заполнения' });
    }

    let parentIdInternal = null;
    const isCollection = !parentId || parentId === null;

    // Проверка существования родительской категории (если передан parentId)
    if (!isCollection) {
      if (typeof parentId !== 'string' || parentId.trim().length === 0) {
        return res.status(400).json({ error: 'Некорректный идентификатор родительской категории' });
      }

      const parentRow = db.prepare('SELECT id FROM bookmark_categories WHERE uid = ? LIMIT 1').get(parentId);

      if (!parentRow) {
        return res.status(400).json({ error: 'Родительская категория не найдена' });
      }

      parentIdInternal = parentRow.id;
    }

    // Вычисление position: MAX(position) + 1 для категорий того же уровня
    let position = 0;

    if (isCollection) {
      // Для коллекций (parentId = null)
      const maxPositionRow = db.prepare(`
        SELECT MAX(position) as max_position
        FROM bookmark_categories
        WHERE parent_id IS NULL
      `).get();

      if (maxPositionRow?.max_position !== null) {
        position = Number(maxPositionRow.max_position) + 1;
      }
    } else {
      // Для категорий (parentId != null)
      const maxPositionRow = db.prepare(`
        SELECT MAX(position) as max_position
        FROM bookmark_categories
        WHERE parent_id = ?
      `).get(parentIdInternal);

      if (maxPositionRow?.max_position !== null) {
        position = Number(maxPositionRow.max_position) + 1;
      }
    }

    // Генерация уникального UID
    const uid = generateCategoryUid();

    // Иконка только для категорий (не для коллекций)
    const iconValue = !isCollection && icon && typeof icon === 'string' ? icon.trim() : null;

    // Создание категории/коллекции
    const insertCategory = db.prepare(`
      INSERT INTO bookmark_categories (
        uid, parent_id, title, icon, position, created_at, updated_at
      )
      VALUES (
        @uid, @parent_id, @title, @icon, @position, datetime('now'), datetime('now')
      )
    `);

    insertCategory.run({
      uid,
      parent_id: parentIdInternal,
      title: title.trim(),
      icon: iconValue,
      position,
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Ошибка создания категории:', error);

    return res.status(500).json({ error: 'Не удалось создать категорию' });
  }
});

export default router;