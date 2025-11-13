import { Router } from 'express';
import { db } from '../../db/initdb.js';

const router = Router();

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

export default router;