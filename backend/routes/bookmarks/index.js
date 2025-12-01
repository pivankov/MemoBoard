import { Router } from 'express';
import { db } from '../../db/initdb.js';
import tagsRouter from './tags.js';
import categoriesRouter from './categories.js';
import urlMetadata from 'url-metadata';
import { generateBookmarkUid } from '../../utils/uid.js';

const router = Router();

router.use('/tags', tagsRouter);
router.use('/categories', categoriesRouter);

router.get('/', async (req, res) => {
  try {
    const bookmarksQuery = db.prepare(`
      SELECT b.id, b.uid, b.title, b.url, b.created_at, b.updated_at, b.description, b.preview, b.favorite, b.transition_counter, bc.uid AS category_uid
      FROM bookmarks b
      LEFT JOIN bookmark_categories AS bc ON b.category_id = bc.id
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

export default router;