import { Router } from 'express';
import tagsRouter from './tags.js';
import { db } from '../../db/initdb.js';

const router = Router();

router.use('/tags', tagsRouter);

router.get('/', async (req, res) => {
  try {
    const eventsQuery = db.prepare('SELECT * FROM events');
    const events = eventsQuery.all();

    res.status(200).json({ data: events });
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
  
  res.status(200).json({ message: `DELETE event by ID ${id}` });
});

export default router;