/**
 * @fileoverview Роутер административного раздела (`/api/admin`).
 *
 * Все маршруты этого роутера монтируются в `backend/routes/index.js` под
 * префиксом `/api/admin` и ЗАЩИЩЕНЫ middleware `requireAuth` + `requireAdmin`:
 *
 *     router.use('/admin', requireAuth, requireAdmin, admin)
 *
 * В каждом обработчике гарантированно доступен `req.user`
 * (typedef `AuthenticatedUser` из `backend/middleware/auth.js`)
 * с ролью `admin`.
 *
 * Любой из роутов может вернуть:
 * - 401 — если токен отсутствует, невалиден, истёк или пользователь удалён из БД.
 * - 403 — если у пользователя нет роли `admin`.
 */

import { Router } from 'express';
import { db } from '../../db/initdb.js';
import { deletePreview } from '../../utils/preview.js';

const router = Router();

/**
 * Возвращает список всех пользователей
 *
 * Поля: `uid`, `email`, `name`, `role`, `status`, `created_at`.
 * Сортировка — по дате регистрации (ASC).
 *
 * @route GET /api/admin/users
 * @access requireAuth + requireAdmin
 * @returns {200} Массив пользователей
 * @returns {401} Токен отсутствует или невалиден
 * @returns {403} Недостаточно прав (не admin)
 */
router.get('/users', (req, res) => {
  const users = db
    .prepare(
      'SELECT uid, email, name, role, status, created_at FROM users ORDER BY created_at ASC'
    )
    .all();

  res.json({ users });
});

/**
 * Удаляет пользователя по его публичному UID
 *
 * Порядок операций:
 * 1. Находит внутренний `id` пользователя по `uid`.
 * 2. Собирает в память пути к превью закладок (`bookmarks.preview`).
 * 3. Удаляет запись `users` — каскад БД (`ON DELETE CASCADE`) автоматически
 *    удаляет `events`, `bookmarks`, `bookmark_categories`, `bookmark_tags`,
 *    `sessions`, `bookmark_tag_relations`.
 * 4. Удаляет файлы превью с диска. Ошибки удаления файлов логируются,
 *    но не влияют на HTTP-ответ: запись в БД уже удалена.
 *
 * @route DELETE /api/admin/users/:uid
 * @access requireAuth + requireAdmin
 * @returns {204} Пользователь удалён
 * @returns {401} Токен отсутствует или невалиден
 * @returns {403} Недостаточно прав (не admin)
 * @returns {404} Пользователь с таким uid не найден
 */
router.delete('/users/:uid', async (req, res) => {
  const { uid } = req.params;

  // 1. Ищем пользователя
  const user = db
    .prepare('SELECT id FROM users WHERE uid = ? LIMIT 1')
    .get(uid);

  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  // 2. Собираем пути к превью в память до удаления записи из БД
  const previews = db
    .prepare(
      'SELECT preview FROM bookmarks WHERE user_id = ? AND preview IS NOT NULL'
    )
    .all(user.id)
    .map((row) => row.preview);

  // 3. Удаляем пользователя; каскад БД подчищает связанные данные
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id);

  // 4. Удаляем файлы превью с диска (не блокируем ответ на ошибках FS)
  for (const previewPath of previews) {
    try {
      await deletePreview(previewPath);
    } catch (err) {
      console.error('Ошибка удаления превью при удалении пользователя:', previewPath, err.message);
    }
  }

  res.status(204).end();
});

export default router;
