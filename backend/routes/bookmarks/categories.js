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

/**
 * Batch-обновляет позиции и/или коллекцию у категорий/коллекций
 *
 * Все изменения выполняются в одной транзакции SQLite.
 * Если хотя бы одна из переданных категорий не найдена — вся операция откатывается.
 * Поле `parentId` передаётся только для категории, у которой меняется коллекция.
 *
 * @route PATCH /api/bookmarks/categories/reorder
 * @param {Object} req.body
 * @param {Array<{id: string, position: number, parentId?: string}>} req.body.items - Массив обновляемых элементов
 * @returns {Object} 200 - { success: true }
 * @returns {Object} 400 - Некорректные данные (items не массив / некорректные поля элементов)
 * @returns {Object} 404 - Категория или коллекция не найдена
 * @returns {Object} 500 - Ошибка сервера
 *
 * @example
 * // Тело запроса:
 * {
 *   "items": [
 *     { "id": "uuid-1", "position": 0 },
 *     { "id": "uuid-2", "position": 1 },
 *     { "id": "uuid-3", "position": 2, "parentId": "uuid-collection" }
 *   ]
 * }
 *
 * @example
 * // Успешный ответ:
 * { "success": true }
 */
router.patch('/reorder', (req, res) => {
  const { items } = req.body ?? {};

  try {
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items должен быть непустым массивом' });
    }

    // Валидация каждого элемента до обращения к БД
    for (const item of items) {
      if (!item.id || typeof item.id !== 'string' || item.id.trim().length === 0) {
        return res.status(400).json({ error: 'Каждый элемент должен содержать корректный id' });
      }

      if (typeof item.position !== 'number' || !Number.isInteger(item.position) || item.position < 0) {
        return res.status(400).json({ error: `Некорректная позиция для элемента с id "${item.id}"` });
      }

      if (item.parentId !== undefined && (typeof item.parentId !== 'string' || item.parentId.trim().length === 0)) {
        return res.status(400).json({ error: `Некорректный parentId для элемента с id "${item.id}"` });
      }
    }

    const findByUid = db.prepare('SELECT id FROM bookmark_categories WHERE uid = ? LIMIT 1');
    const updatePositionOnly = db.prepare(`
      UPDATE bookmark_categories
      SET position = @position, updated_at = datetime('now')
      WHERE id = @id
    `);
    const updatePositionAndParent = db.prepare(`
      UPDATE bookmark_categories
      SET position = @position, parent_id = @parentId, updated_at = datetime('now')
      WHERE id = @id
    `);

    // Резолвим UIDs во внутренние ID до транзакции, чтобы вернуть 404 при необходимости
    const resolvedItems = [];

    for (const item of items) {
      const categoryRow = findByUid.get(item.id.trim());

      if (!categoryRow) {
        return res.status(404).json({ error: `Категория с id "${item.id}" не найдена` });
      }

      const resolved = {
        id: categoryRow.id,
        position: item.position,
        hasParentChange: item.parentId !== undefined,
        parentId: null,
      };

      if (resolved.hasParentChange) {
        const parentRow = findByUid.get(item.parentId.trim());

        if (!parentRow) {
          return res.status(404).json({ error: `Коллекция с id "${item.parentId}" не найдена` });
        }

        resolved.parentId = parentRow.id;
      }

      resolvedItems.push(resolved);
    }

    // Все UPDATE-запросы в одной транзакции
    const reorderInTransaction = db.transaction(() => {
      for (const resolved of resolvedItems) {
        if (resolved.hasParentChange) {
          updatePositionAndParent.run({
            id: resolved.id,
            position: resolved.position,
            parentId: resolved.parentId,
          });
        } else {
          updatePositionOnly.run({
            id: resolved.id,
            position: resolved.position,
          });
        }
      }
    });

    reorderInTransaction();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Ошибка обновления порядка категорий:', error);

    return res.status(500).json({ error: 'Не удалось обновить порядок категорий' });
  }
});

/**
 * Обновляет данные категории
 * 
 * Поддерживает частичное обновление — обновляются только переданные поля.
 * Поле `icon` может быть строкой для установки иконки или `null` для её удаления.
 * Поле `title` должно быть непустой строкой.
 * 
 * @route PATCH /api/bookmarks/categories/:id
 * @param {string} req.params.id - UID категории
 * @param {Object} req.body - Обновляемые поля категории
 * @param {string} [req.body.title] - Название категории
 * @param {string|null} [req.body.icon] - Иконка категории (null — удаляет иконку)
 * @returns {Object} 200 - JSON объект с результатом обновления
 * @returns {Object} 400 - Некорректные данные
 * @returns {Object} 404 - Категория не найдена
 * @returns {Object} 500 - JSON объект с описанием ошибки
 * 
 * @example
 * // Обновление названия:
 * { "title": "Frontend" }
 * 
 * @example
 * // Установка иконки:
 * { "icon": "react" }
 * 
 * @example
 * // Удаление иконки:
 * { "icon": null }
 * 
 * @example
 * // Успешный ответ:
 * { "success": true }
 */
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, icon } = req.body ?? {};

  try {
    // Валидация UID
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор категории' });
    }

    // Валидация title: если передан — должен быть непустой строкой (null недопустим)
    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      return res.status(400).json({ error: 'Название не может быть пустым' });
    }

    // Валидация icon: допускается строка или null
    if (icon !== undefined && icon !== null && (typeof icon !== 'string' || icon.trim().length === 0)) {
      return res.status(400).json({ error: 'Некорректное значение иконки' });
    }

    // Получение записи из БД
    const categoryRow = db.prepare(`
      SELECT id
      FROM bookmark_categories
      WHERE uid = ?
      LIMIT 1
    `).get(id);

    if (!categoryRow) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    // Формирование SET-полей для обновления
    const fields = [];
    const values = {};

    if (title !== undefined) {
      fields.push('title = @title');
      values.title = title.trim();
    }

    if (icon !== undefined) {
      fields.push('icon = @icon');
      values.icon = icon !== null ? icon.trim() : null;
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Не переданы поля для обновления' });
    }

    fields.push('updated_at = datetime(\'now\')');
    values.id = categoryRow.id;

    db.prepare(`
      UPDATE bookmark_categories
      SET ${fields.join(', ')}
      WHERE id = @id
    `).run(values);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Ошибка обновления категории ${id}:`, error);

    return res.status(500).json({ error: 'Не удалось обновить категорию' });
  }
});

/**
 * Удаляет категорию или коллекцию
 * 
 * Универсальный метод для удаления как коллекций, так и категорий.
 * Перед удалением выполняются проверки:
 * - Для коллекции (parent_id = null): нельзя удалить, если есть дочерние категории
 * - Для категории (parent_id != null): нельзя удалить, если есть прикрепленные закладки
 * 
 * @route DELETE /api/bookmarks/categories/:id
 * @param {string} req.params.id - UID категории/коллекции для удаления
 * @returns {Object} 200 - JSON объект с результатом удаления
 * @returns {Object} 400 - Некорректный ID / есть связанные данные
 * @returns {Object} 404 - Категория/коллекция не найдена
 * @returns {Object} 500 - JSON объект с описанием ошибки
 * 
 * @example
 * // Успешный ответ:
 * {
 *   "success": true
 * }
 * 
 * @example
 * // Ошибка при удалении коллекции с категориями:
 * {
 *   "error": "Невозможно удалить коллекцию. Сначала удалите все категории внутри неё"
 * }
 * 
 * @example
 * // Ошибка при удалении категории с закладками:
 * {
 *   "error": "Невозможно удалить категорию. Сначала удалите все закладки из неё"
 * }
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Валидация UID
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор категории' });
    }

    // Получение записи из БД
    const categoryQuery = db.prepare(`
      SELECT id, parent_id
      FROM bookmark_categories
      WHERE uid = ?
      LIMIT 1
    `);
    const categoryRow = categoryQuery.get(id);

    if (!categoryRow) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    const isCollection = categoryRow.parent_id === null;

    if (isCollection) {
      // Проверка: есть ли дочерние категории у коллекции
      const childCategoriesQuery = db.prepare(`
        SELECT COUNT(*) as count
        FROM bookmark_categories
        WHERE parent_id = ?
      `);
      const childCount = childCategoriesQuery.get(categoryRow.id);

      if (childCount && childCount.count > 0) {
        return res.status(400).json({ 
          error: 'Невозможно удалить коллекцию. Сначала удалите все категории внутри неё' 
        });
      }
    } else {
      // Проверка: есть ли закладки в категории
      const bookmarksQuery = db.prepare(`
        SELECT COUNT(*) as count
        FROM bookmarks
        WHERE category_id = ?
      `);
      const bookmarksCount = bookmarksQuery.get(categoryRow.id);

      if (bookmarksCount && bookmarksCount.count > 0) {
        return res.status(400).json({ 
          error: 'Невозможно удалить категорию. Сначала удалите все закладки из неё' 
        });
      }
    }

    // Удаление записи
    const deleteQuery = db.prepare(`
      DELETE FROM bookmark_categories
      WHERE id = ?
    `);
    deleteQuery.run(categoryRow.id);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Ошибка удаления категории ${id}:`, error);

    return res.status(500).json({ error: 'Не удалось удалить категорию' });
  }
});

export default router;