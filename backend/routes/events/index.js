import { Router } from 'express';
import { randomUUID } from 'crypto';
import tagsRouter from './tags.js';
import { db } from '../../db/initdb.js';
import { normalizeInputDate } from "../../utils/date.js"

const router = Router();

router.use('/tags', tagsRouter);

router.get('/', async (req, res) => {
  try {
    // const eventsQuery = db.prepare(`
    //   SELECT e.uid, e.title, e.start_at, e.description, e.is_yearly, t.slug as type
    //   FROM events e
    //   JOIN event_types t ON t.id = e.type_id
    //   ORDER BY
    //     CASE WHEN julianday(e.start_at) >= julianday(datetime('now','-3 days')) THEN 0 ELSE 1 END,
    //     e.start_at ASC
    // `);    
    const eventsQuery = db.prepare(`
      WITH pivot AS (
        SELECT date('now', '-3 days') AS p
      ),
      events_with AS (
        SELECT
          e.uid,
          e.title,
          e.start_at,
          e.description,
          e.is_yearly,
          t.slug AS type,
          CASE
            WHEN e.is_yearly = 1 THEN
              CASE
                WHEN date(strftime('%Y', p.p) || '-' || strftime('%m', e.start_at) || '-' || strftime('%d', e.start_at)) < p.p
                  THEN date(strftime('%Y', p.p) || '-' || strftime('%m', e.start_at) || '-' || strftime('%d', e.start_at), '+1 year')
                ELSE
                  date(strftime('%Y', p.p) || '-' || strftime('%m', e.start_at) || '-' || strftime('%d', e.start_at))
              END
            ELSE
              date(e.start_at)
          END AS next_at
        FROM events e
        JOIN event_types t ON t.id = e.type_id
        CROSS JOIN pivot p
      )
      SELECT
        uid, title, start_at, description, is_yearly, type
      FROM events_with
      WHERE is_yearly = 1
         OR next_at >= (SELECT p FROM pivot)
      ORDER BY next_at ASC
    `);
    const rows = eventsQuery.all();

    const data = rows.map((row) => ({
      date: String(row.start_at ?? ''),
      isYearly: Boolean(Number(row.is_yearly ?? 0)),
      title: String(row.title ?? ''),
      id: String(row.uid),
      type: String(row.type ?? ''),
      description: row.description ? String(row.description) : '',
    }));

    res.status(200).json({ data });
  } catch (error) {
    console.error('Ошибка получения событий:', error);

    res.status(500).json({ error: 'Не удалось получить список событий' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, date, type, isYearly, description } = req.body ?? {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный заголовок события' });
    }

    if (!date || typeof date !== 'string' || date.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректная дата события' });
    }

    const normalizedDate = normalizeInputDate(date);
    if (!normalizedDate) {
      return res.status(400).json({ error: 'Некорректный формат даты события' });
    }

    if (!type || typeof type !== 'string' || type.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный тип события' });
    }

    const typeRow = db.prepare('SELECT id FROM event_types WHERE slug = ? LIMIT 1').get(type);

    if (!typeRow?.id) {
      return res.status(400).json({ error: 'Указан неизвестный тип события' });
    }

    const insertQuery = db.prepare(`
      INSERT INTO events (uid, user_id, title, type_id, start_at, description, is_yearly)
      VALUES (@uid, @user_id, @title, @type_id, @start_at, @description, @is_yearly)
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
      is_yearly: isYearly ? 1 : 0,
    };

    insertQuery.run(payload);

    const result = {
      id: String(uid),
      title: String(title),
      date: String(normalizedDate),
      type: String(type),
      description: description ? String(description) : '',
      isYearly: Boolean(isYearly),
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

    const { title, date, type, isYearly, description } = req.body ?? {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректный заголовок события' });
    }

    if (!date || typeof date !== 'string' || date.trim().length === 0) {
      return res.status(400).json({ error: 'Некорректная дата события' });
    }

    const normalizedDate = normalizeInputDate(date);
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
          is_yearly = @is_yearly
      WHERE uid = @uid
    `);

    const payload = {
      uid: String(id),
      title: String(title),
      type_id: Number(typeRow.id),
      start_at: String(normalizedDate),
      description: description ? String(description) : null,
      is_yearly: isYearly ? 1 : 0,
    };

    const resultUpdate = updateQuery.run(payload);
    if (resultUpdate.changes === 0) {
      return res.status(500).json({ error: 'Не удалось обновить событие' });
    }

    const result = {
      id: String(id),
      title: String(title),
      date: String(normalizedDate),
      type: String(type),
      description: description ? String(description) : '',
      isYearly: Boolean(isYearly),
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