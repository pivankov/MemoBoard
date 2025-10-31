import { Router } from 'express';
import { db } from '../../db/initdb.js';
import tagsRouter from './tags.js';
import categoriesRouter from './categories.js';

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

export default router;