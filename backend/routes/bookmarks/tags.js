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

export default router;