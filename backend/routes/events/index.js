import { Router } from 'express';
import tagsRouter from './tags.js';
import { db } from '../../db/initdb.js';

const router = Router();

router.use('/tags', tagsRouter);

router.get('/', async (req, res) => {
  try {
    const eventsQuery = db.prepare(`
      SELECT e.uid, e.title, e.start_at, e.description, e.is_yearly, t.slug as type
      FROM events e
      JOIN event_types t ON t.id = e.type_id
      ORDER BY e.start_at ASC
    `);
    const rows = eventsQuery.all();

    const data = rows.map((row) => ({
      id: String(row.uid),
      title: String(row.title ?? ''),
      date: String(row.start_at ?? ''),
      type: String(row.type ?? ''),
      description: row.description ? String(row.description) : '',
      isYearly: Boolean(Number(row.is_yearly ?? 0)),
    }));

    res.status(200).json({ data });
  } catch (error) {
    console.error('Ошибка получения событий:', error);

    res.status(500).json({ error: 'Не удалось получить список событий' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  res.status(200).json({ message: `GET event by ID ${id}` });
});

router.post('/', async (req, res) => {
  res.status(200).json({ message: 'POST event' });
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор события' });
    }

    const deleteQuery = db.prepare('DELETE FROM events WHERE uid = ?');
    const result = deleteQuery.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(`Ошибка удаления события ${id}:`, error);
    return res.status(500).json({ error: 'Не удалось удалить событие' });
  }
});

export default router;