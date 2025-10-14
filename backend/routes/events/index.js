import { Router } from 'express';
import { randomUUID } from 'crypto';
import tagsRouter from './tags.js';
import { db } from '../../db/initdb.js';
import { normalizeInputDate } from "../../utils/date.js"

const router = Router();

router.use('/tags', tagsRouter);

router.get('/', async (req, res) => {
  try {
    const eventsQuery = db.prepare(`
      SELECT e.uid, e.title, e.start_at, e.description, e.recurrence, t.slug as type
      FROM events e
      JOIN event_types t ON t.id = e.type_id
    `);
    const rows = eventsQuery.all();

    const data = rows.map((row) => ({
      id: String(row.uid),
      title: String(row.title ?? ''),
      originalDate: String(row.start_at ?? ''),
      nextDate: '',
      type: String(row.type ?? ''),
      description: row.description ? String(row.description) : '',
      recurrence: String(row.recurrence ?? 'none'),
    }));

    res.status(200).json({ data });
  } catch (error) {
    console.error('Ошибка получения событий:', error);

    res.status(500).json({ error: 'Не удалось получить список событий' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор события' });
    }

    const eventQuery = db.prepare(`
      SELECT e.uid, e.title, e.start_at, e.description, e.recurrence, t.slug as type
      FROM events e
      JOIN event_types t ON t.id = e.type_id
      WHERE e.uid = ?
      LIMIT 1
    `);

    const row = eventQuery.get(id);

    if (!row) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }
    
    const data = {
      id: String(row.uid),
      title: String(row.title ?? ''),
      originalDate: String(row.start_at ?? ''),
      nextDate: '',
      type: String(row.type ?? ''),
      description: row.description ? String(row.description) : '',
      recurrence: String(row.recurrence ?? 'none'),
    };

    return res.status(200).json({ data });
  } catch (error) {
    console.error(`Ошибка получения события ${id}:`, error);

    return res.status(500).json({ error: 'Не удалось получить событие' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, originalDate, type, recurrence, description } = req.body ?? {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный заголовок события' });
    }

    if (!originalDate || typeof originalDate !== 'string' || originalDate.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректная дата события' });
    }

    const normalizedDate = normalizeInputDate(originalDate);
    if (!normalizedDate) {
      return res.status(400).json({ error: 'Некорректный формат даты события' });
    }

    if (!type || typeof type !== 'string' || type.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный тип события' });
    }

    const allowedRecurrences = new Set(['none', 'monthly', 'yearly']);
    const recurrenceValue = typeof recurrence === 'string' ? recurrence : 'none';
    
    if (!allowedRecurrences.has(recurrenceValue)) {
      return res.status(400).json({ error: 'Некорректное значение recurrence' });
    }

    const typeRow = db.prepare('SELECT id FROM event_types WHERE slug = ? LIMIT 1').get(type);

    if (!typeRow?.id) {
      return res.status(400).json({ error: 'Указан неизвестный тип события' });
    }

    const insertQuery = db.prepare(`
      INSERT INTO events (uid, user_id, title, type_id, start_at, description, recurrence)
      VALUES (@uid, @user_id, @title, @type_id, @start_at, @description, @recurrence)
    `);

    const userRow = db.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1').get();
    if (!userRow?.id) {
      return res.status(500).json({ error: 'Не найден пользователь по умолчанию для привязки события' });
    }

    const uid = randomUUID();

    const payload = {
      uid,
      user_id: Number(userRow.id),
      title: String(title),
      type_id: Number(typeRow.id),
      start_at: String(normalizedDate),
      description: description ? String(description) : null,
      recurrence: recurrenceValue,
    };

    insertQuery.run(payload);

    const result = {
      id: String(uid),
      title: String(title),
      originalDate: String(normalizedDate),
      type: String(type),
      description: description ? String(description) : '',
      recurrence: recurrenceValue,
    };

    return res.status(201).json({ data: result });
  } catch (error) {
    console.error('Ошибка создания события:', error);

    return res.status(500).json({ error: 'Не удалось создать событие' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор события' });
    }

    const { title, originalDate, type, recurrence, description } = req.body ?? {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный заголовок события' });
    }

    if (!originalDate || typeof originalDate !== 'string' || originalDate.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректная дата события' });
    }

    const normalizedDate = normalizeInputDate(originalDate);
    if (!normalizedDate) {
      return res.status(400).json({ error: 'Некорректный формат даты события' });
    }

    if (!type || typeof type !== 'string' || type.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный тип события' });
    }

    const existed = db.prepare('SELECT id FROM events WHERE uid = ? LIMIT 1').get(id);
    if (!existed?.id) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    const allowedRecurrences = new Set(['none', 'monthly', 'yearly']);
    const recurrenceValue = typeof recurrence === 'string' ? recurrence : 'none';
    if (!allowedRecurrences.has(recurrenceValue)) {
      return res.status(400).json({ error: 'Некорректное значение recurrence' });
    }

    const typeRow = db.prepare('SELECT id FROM event_types WHERE slug = ? LIMIT 1').get(type);
    if (!typeRow?.id) {
      return res.status(400).json({ error: 'Указан неизвестный тип события' });
    }

    const updateQuery = db.prepare(`
      UPDATE events
      SET title = @title,
          type_id = @type_id,
          start_at = @start_at,
          description = @description,
          recurrence = @recurrence
      WHERE uid = @uid
    `);

    const payload = {
      uid: String(id),
      title: String(title),
      type_id: Number(typeRow.id),
      start_at: String(normalizedDate),
      description: description ? String(description) : null,
      recurrence: recurrenceValue,
    };

    const resultUpdate = updateQuery.run(payload);
    if (resultUpdate.changes === 0) {
      return res.status(500).json({ error: 'Не удалось обновить событие' });
    }

    const result = {
      id: String(id),
      title: String(title),
      originalDate: String(normalizedDate),
      type: String(type),
      description: description ? String(description) : '',
      recurrence: recurrenceValue,
    };

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error(`Ошибка обновления события ${id}:`, error);

    return res.status(500).json({ error: 'Не удалось обновить событие' });
  }
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