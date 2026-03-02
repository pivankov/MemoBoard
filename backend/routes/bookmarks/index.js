import { Router } from 'express';
import { db } from '../../db/initdb.js';
import tagsRouter from './tags.js';
import categoriesRouter from './categories.js';
import urlMetadata from 'url-metadata';
import { generateBookmarkUid, generateTagUid } from '../../utils/uid.js';

const router = Router();

router.use('/tags', tagsRouter);
router.use('/categories', categoriesRouter);

/**
 * Получает список всех закладок с тегами
 * 
 * @route GET /api/bookmarks
 * @returns {Object} 200 - JSON объект с массивом закладок в поле data
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
 *       "description": "Описание сайта",
 *       "tags": ["tag1", "tag2"],
 *       "createdAt": "2024-12-01T10:00:00Z",
 *       "updatedAt": "2024-12-01T10:00:00Z",
 *       "transitionCounter": 5,
 *       "favorite": false
 *     }
 *   ]
 * }
 */
router.get('/', async (req, res) => {
  try {
    const bookmarksQuery = db.prepare(`
      SELECT b.id, b.uid, b.title, b.url, b.created_at, b.updated_at, b.description, b.preview, b.favorite, b.transition_counter, bc.uid AS category_uid
      FROM bookmarks b
      LEFT JOIN bookmark_categories AS bc ON b.category_id = bc.id
      ORDER BY b.updated_at DESC
    `);
    const rows = bookmarksQuery.all();

    const tagsQuery = db.prepare(`
      SELECT btr.bookmark_id, bt.uid AS tag_uid
      FROM bookmark_tag_relations btr
      JOIN bookmark_tags bt ON btr.tag_id = bt.id
    `);
    const tagRows = tagsQuery.all();

    const tagsMap = new Map();
    tagRows.forEach((tagRow) => {
      const bookmarkId = tagRow.bookmark_id;
      if (!tagsMap.has(bookmarkId)) {
        tagsMap.set(bookmarkId, []);
      }
      tagsMap.get(bookmarkId).push(String(tagRow.tag_uid));
    });

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

    res.status(200).json({ data });
  } catch (error) {
    console.error('Ошибка получения закладок:', error);

    res.status(500).json({ error: 'Не удалось получить список закладок' });
  }
});

/**
 * Получает закладку по уникальному идентификатору
 * 
 * @route GET /api/bookmarks/:id
 * @param {string} req.params.id - UID закладки
 * @returns {Object} 200 - JSON объект с закладкой в поле data
 * @returns {Object} 400 - Некорректный идентификатор закладки
 * @returns {Object} 404 - Закладка не найдена
 * @returns {Object} 500 - JSON объект с описанием ошибки
 * 
 * @example
 * // Успешный ответ:
 * {
 *   "data": {
 *     "id": "abc12345",
 *     "categoryId": "cat1",
 *     "url": "https://example.com",
 *     "title": "Пример сайта",
 *     "preview": "",
 *     "description": "Описание сайта",
 *     "tags": ["tag1", "tag2"],
 *     "createdAt": "2024-12-01T10:00:00Z",
 *     "updatedAt": "2024-12-01T10:00:00Z",
 *     "transitionCounter": 5,
 *     "favorite": false
 *   }
 * }
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор закладки' });
    }

    const bookmarkQuery = db.prepare(`
      SELECT b.id, b.uid, b.title, b.url, b.created_at, b.updated_at, b.description, b.preview, b.favorite, b.transition_counter, bc.uid AS category_uid
      FROM bookmarks b
      LEFT JOIN bookmark_categories bc ON b.category_id = bc.id
      WHERE b.uid = ?
      LIMIT 1
    `);

    const row = bookmarkQuery.get(id);

    if (!row) {
      return res.status(404).json({ error: 'Закладка не найдена' });
    }

    const tagsQuery = db.prepare(`
      SELECT bt.uid AS tag_uid
      FROM bookmark_tag_relations btr
      JOIN bookmark_tags bt ON btr.tag_id = bt.id
      WHERE btr.bookmark_id = ?
    `);
    const tagRows = tagsQuery.all(row.id);
    const tags = tagRows.map((tagRow) => String(tagRow.tag_uid));
    
    const data = {
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

    return res.status(200).json({ data });
  } catch (error) {
    console.error(`Ошибка получения закладки ${id}:`, error);

    return res.status(500).json({ error: 'Не удалось получить закладку' });
  }
});

/**
 * Создает новую закладку с автоматическим парсингом метаданных URL
 * 
 * При создании закладки сервер автоматически пытается получить метаданные страницы
 * (title, description) через парсинг Open Graph, Twitter Cards и стандартных meta-тегов.
 * Если парсинг не удается, используется URL в качестве заголовка.
 * 
 * @route POST /api/bookmarks
 * @param {Object} req.body - Данные новой закладки
 * @param {string} req.body.url - URL закладки
 * @param {string} req.body.categoryId - UID категории
 * @returns {Object} 201 - JSON объект с результатом создания
 * @returns {Object} 400 - URL или категория не указаны / категория не найдена
 * @returns {Object} 500 - JSON объект с описанием ошибки
 * 
 * @example
 * // Тело запроса:
 * {
 *   "url": "https://example.com",
 *   "categoryId": "cat1"
 * }
 * 
 * @example
 * // Успешный ответ:
 * {
 *   "success": true
 * }
 */
router.post('/', async (req, res) => {
  const { url, categoryId } = req.body ?? {};
  
  try {
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return res.status(400).json({ error: 'URL обязателен для заполнения' });
    }
    
    if (!categoryId || typeof categoryId !== 'string' || categoryId.trim().length === 0) {
      return res.status(400).json({ error: 'Категория обязательна для заполнения' });
    }

    const userRow = db.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1').get();

    if (!userRow?.id) {
      return res.status(500).json({ error: 'Не найден пользователь по умолчанию для привязки события' });
    }    
    
    const categoryRow = db.prepare('SELECT id FROM bookmark_categories WHERE uid = ? LIMIT 1').get(categoryId);
    
    if (!categoryRow) {
      return res.status(400).json({ error: 'Категория не найдена' });
    }
    
    const categoryIdInternal = categoryRow.id;
    
    let title = url;
    let description = '';
    
    try {
      const metadata = await urlMetadata(url, {
        timeout: 5000,
        ensureSecureImageRequest: false,
      });
      
      // Приоритет: Open Graph > Twitter Cards > обычные meta теги
      title = metadata['og:title'] || metadata['twitter:title'] || metadata.title || url;
      description = metadata['og:description'] || metadata['twitter:description'] || metadata.description || '';
      
      if (title.length > 500) {
        title = title.substring(0, 500);
      }

      if (description.length > 1000) {
        description = description.substring(0, 1000);
      }
      
    } catch (parseError) {
      console.warn('Не удалось распарсить URL:', url, parseError.message);
    }
    
    const uid = generateBookmarkUid();
    
    const insertBookmark = db.prepare(`
      INSERT INTO bookmarks (
        uid, user_id, category_id, url, title, description, 
        preview, transition_counter, favorite, created_at, updated_at
      )
      VALUES (
        @uid, @user_id, @category_id, @url, @title, @description,
        @preview, @transition_counter, @favorite, datetime('now'), datetime('now')
      )
    `);
    
    insertBookmark.run({
      uid,
      user_id: Number(userRow.id),
      category_id: categoryIdInternal,
      url: url.trim(),
      title: title.trim(),
      description: description.trim(),
      preview: '',
      transition_counter: 0,
      favorite: 0,
    });
    
    return res.status(201).json({ success: true });
    
  } catch (error) {
    console.error('Ошибка создания закладки:', error);
    return res.status(500).json({ error: 'Не удалось создать закладку' });
  }
});

/**
 * Обновляет существующую закладку
 * 
 * Теги обновляются через два раздельных массива: existingTagIds — UID существующих тегов,
 * newTagTitles — названия новых тегов, которые создаются и привязываются автоматически.
 * Все старые связи с тегами удаляются и пересоздаются. Вся операция выполняется в единой транзакции.
 * 
 * @route PUT /api/bookmarks/:id
 * @param {string} req.params.id - UID закладки
 * @param {Object} req.body - Данные для обновления закладки
 * @param {string} req.body.url - URL закладки
 * @param {string} req.body.title - Заголовок закладки
 * @param {string} [req.body.description] - Описание
 * @param {string} req.body.categoryId - UID категории
 * @param {string[]} [req.body.existingTagIds] - Массив UID существующих тегов для привязки
 * @param {string[]} [req.body.newTagTitles] - Массив названий новых тегов для создания и привязки
 * @param {string} [req.body.preview] - URL превью изображения
 * @param {boolean} [req.body.favorite] - Избранное
 * @returns {Object} 200 - JSON объект с результатом обновления
 * @returns {Object} 400 - Некорректные данные / теги не массивы / категория не найдена
 * @returns {Object} 404 - Закладка не найдена
 * @returns {Object} 500 - JSON объект с описанием ошибки
 * 
 * @example
 * // Тело запроса:
 * {
 *   "url": "https://example.com",
 *   "title": "Обновленный заголовок",
 *   "description": "Обновленное описание",
 *   "categoryId": "cat1",
 *   "existingTagIds": ["abc12", "def34"],
 *   "newTagTitles": ["новый тег"],
 *   "preview": "https://example.com/preview.jpg",
 *   "favorite": true
 * }
 * 
 * @example
 * // Успешный ответ:
 * {
 *   "success": true
 * }
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { url, title, description, categoryId, existingTagIds, newTagTitles, preview, favorite } = req.body ?? {};
  
  try {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор закладки' });
    }
    
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return res.status(400).json({ error: 'URL обязателен для заполнения' });
    }
    
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Заголовок обязателен для заполнения' });
    }
    
    if (!categoryId || typeof categoryId !== 'string' || categoryId.trim().length === 0) {
      return res.status(400).json({ error: 'Категория обязательна для заполнения' });
    }

    if (existingTagIds !== undefined && !Array.isArray(existingTagIds)) {
      return res.status(400).json({ error: 'existingTagIds должен быть массивом' });
    }

    if (newTagTitles !== undefined && !Array.isArray(newTagTitles)) {
      return res.status(400).json({ error: 'newTagTitles должен быть массивом' });
    }

    const bookmarkRow = db.prepare('SELECT id FROM bookmarks WHERE uid = ? LIMIT 1').get(id);
    
    if (!bookmarkRow) {
      return res.status(404).json({ error: 'Закладка не найдена' });
    }

    const categoryRow = db.prepare('SELECT id FROM bookmark_categories WHERE uid = ? LIMIT 1').get(categoryId);
    
    if (!categoryRow) {
      return res.status(400).json({ error: 'Категория не найдена' });
    }

    const hasTags = Array.isArray(existingTagIds) || Array.isArray(newTagTitles);

    const updateOperation = db.transaction(() => {
      db.prepare(`
        UPDATE bookmarks
        SET 
          url = @url,
          title = @title,
          description = @description,
          category_id = @category_id,
          preview = @preview,
          favorite = @favorite
        WHERE id = @id
      `).run({
        id: bookmarkRow.id,
        url: url.trim(),
        title: title.trim(),
        description: description ? description.trim() : '',
        category_id: categoryRow.id,
        preview: preview ? preview.trim() : '',
        favorite: favorite ? 1 : 0,
      });

      if (hasTags) {
        db.prepare('DELETE FROM bookmark_tag_relations WHERE bookmark_id = ?').run(bookmarkRow.id);

        const insertTagRelation = db.prepare(`
          INSERT OR IGNORE INTO bookmark_tag_relations (bookmark_id, tag_id)
          VALUES (@bookmark_id, @tag_id)
        `);

        // Привязываем существующие теги по UID
        if (Array.isArray(existingTagIds)) {
          const findTagByUid = db.prepare('SELECT id FROM bookmark_tags WHERE uid = ? LIMIT 1');

          for (const tagUid of existingTagIds) {
            const tagRow = findTagByUid.get(tagUid);

            if (tagRow) {
              insertTagRelation.run({ bookmark_id: bookmarkRow.id, tag_id: tagRow.id });
            } else {
              console.warn(`Тег с uid "${tagUid}" не найден при обновлении закладки (uid: ${id})`);
            }
          }
        }

        // Создаём новые теги и привязываем
        if (Array.isArray(newTagTitles)) {
          const insertNewTag = db.prepare(`
            INSERT INTO bookmark_tags (uid, title, created_at, updated_at)
            VALUES (@uid, @title, datetime('now'), datetime('now'))
          `);

          for (const tagTitle of newTagTitles) {
            const uid = generateTagUid();
            insertNewTag.run({ uid, title: tagTitle.trim() });
            const newTagRow = db.prepare('SELECT id FROM bookmark_tags WHERE uid = ? LIMIT 1').get(uid);
            insertTagRelation.run({ bookmark_id: bookmarkRow.id, tag_id: newTagRow.id });
          }
        }
      }
    });

    updateOperation();
    
    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error(`Ошибка обновления закладки ${id}:`, error);
    return res.status(500).json({ error: 'Не удалось обновить закладку' });
  }
});

/**
 * Удаляет закладку по идентификатору
 * 
 * При удалении закладки автоматически удаляются все связи с тегами (CASCADE).
 * 
 * @route DELETE /api/bookmarks/:id
 * @param {string} req.params.id - UID закладки
 * @returns {Object} 200 - JSON объект с результатом удаления
 * @returns {Object} 400 - Некорректный идентификатор закладки
 * @returns {Object} 404 - Закладка не найдена
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
      return res.status(400).json({ error: 'Некорректный идентификатор закладки' });
    }
    
    const bookmarkRow = db.prepare('SELECT id FROM bookmarks WHERE uid = ? LIMIT 1').get(id);
    
    if (!bookmarkRow) {
      return res.status(404).json({ error: 'Закладка не найдена' });
    }
    
    const bookmarkIdInternal = bookmarkRow.id;
    
    // Удаляем закладку (связи с тегами удалятся автоматически через CASCADE)
    const deleteBookmark = db.prepare('DELETE FROM bookmarks WHERE id = ?');
    deleteBookmark.run(bookmarkIdInternal);
    
    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error(`Ошибка удаления закладки ${id}:`, error);
    return res.status(500).json({ error: 'Не удалось удалить закладку' });
  }
});

export default router;