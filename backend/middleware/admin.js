/**
 * Middleware авторизации: только для администраторов
 *
 * Проверяет, что текущий пользователь имеет роль `admin`.
 * Должно стоять ПОСЛЕ `requireAuth` — опирается на `req.user.role`,
 * который `requireAuth` подтягивает из БД на каждый запрос (не из JWT-payload).
 * Дополнительный SELECT не нужен.
 *
 * Возвращает 403, если пользователь не является администратором.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requireAdmin(req, res, next) {
  // PAT (токен расширения) не имеет доступа к админским роутам, независимо от роли.
  if (req.authMethod === 'pat') {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  next();
}
