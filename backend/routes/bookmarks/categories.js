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

export default router;