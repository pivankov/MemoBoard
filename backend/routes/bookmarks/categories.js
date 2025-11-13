import { Router } from 'express';
import { db } from '../../db/initdb.js';

const router = Router();

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

router.get('/:id/bookmarks', async (req, res) => {
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

export default router;