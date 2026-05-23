# API: Административный раздел (Admin)

Базовый URL: `/api/admin`

> **Аутентификация:** все маршруты `/api/admin/*` требуют передачи access-токена в заголовке:
> ```
> Authorization: Bearer <accessToken>
> ```
> При отсутствии или невалидности токена возвращается `401 Unauthorized`.

> **Авторизация:** дополнительно к `requireAuth` применяется `requireAdmin` — запрос разрешён только если `req.user.role === 'admin'`. Роль подтягивается из БД при каждом запросе (не из JWT-payload), что исключает использование отозванных прав до истечения access-токена. При недостаточных правах возвращается `403 Forbidden`.

---

### Пользователи (Users)

#### GET /api/admin/users

Возвращает список всех зарегистрированных пользователей. Сортировка — по дате регистрации (ASC).

**Ответ (200):**
```json
{
  "users": [
    {
      "uid": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@example.com",
      "name": "Администратор",
      "role": "admin",
      "status": "active",
      "created_at": "2025-01-15T10:00:00.000Z"
    },
    {
      "uid": "661f9511-f30c-52e5-b827-557766551111",
      "email": "user@example.com",
      "name": "Пользователь",
      "role": "user",
      "status": "blocked",
      "created_at": "2025-02-20T14:30:00.000Z"
    }
  ]
}
```

**Ошибки:**
- `401` — Токен отсутствует, невалиден или истёк
- `403` — Пользователь не является администратором

**Пример curl:**
```bash
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/admin/users | jq .
```

---

#### DELETE /api/admin/users/:uid

Удаляет пользователя по его публичному `uid`.

**Порядок операций:**
1. Поиск пользователя по `uid` — если не найден, возвращает `404`.
2. Сбор в память путей к превью из `bookmarks.preview` (до удаления записи).
3. `DELETE FROM users WHERE id = ?` — каскад БД (`ON DELETE CASCADE`) автоматически удаляет все связанные данные: `events`, `bookmarks`, `bookmark_categories`, `bookmark_tags`, `sessions`, `bookmark_tag_relations`.
4. Удаление файлов превью с диска. Ошибки удаления файлов логируются в консоль, но не влияют на HTTP-ответ — запись в БД уже удалена.

**Ограничений нет:** можно удалить самого себя или последнего администратора.

**Ответ (204):** пустое тело

**Ошибки:**
- `401` — Токен отсутствует, невалиден или истёк
- `403` — Пользователь не является администратором
- `404` — Пользователь с таким `uid` не найден

**Примеры curl:**
```bash
# Удаление пользователя
curl -i -X DELETE \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/admin/users/<uid>
# → HTTP/1.1 204 No Content

# Повторный запрос — 404
curl -i -X DELETE \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/admin/users/<uid>
# → HTTP/1.1 404 Not Found
# {"error":"Пользователь не найден"}
```

---

### Изменение роли и статуса пользователя

Роль и статус пользователя изменяются только через CLI-скрипт `backend/scripts/set-role.js` — API-метода для этого не предусмотрено.

```bash
# Назначить роль admin
node scripts/set-role.js admin@example.com role admin

# Заблокировать пользователя
node scripts/set-role.js user@example.com status blocked
```
