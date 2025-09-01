import { Router } from 'express';
import tagsRouter from './tags.js';

const router = Router();

router.use('/tags', tagsRouter);

router.get('/', async (req, res) => {
  res.status(200).json({ message: 'GET events' });
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