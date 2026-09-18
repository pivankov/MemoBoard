# API: Административный раздел

Базовый URL: `/api/admin`. Все запросы требуют `Authorization: Bearer <accessToken>` и роль `admin`.

`requireAdmin` проверяет `role` из БД при каждом запросе (не из JWT-payload) — права нельзя использовать после отзыва до истечения токена. При недостаточных правах — `403`.

## Пользователи

#### GET /api/admin/users → 200

Список всех пользователей, отсортированный по дате регистрации (ASC).

**Response:** `{ users: { uid: string, email: string, name: string | null, role: 'user' | 'admin', status: 'active' | 'blocked', created_at: string }[] }`
**Errors:** `401` · `403`

---

#### DELETE /api/admin/users/:uid → 204

**Response:** 204 No Content
**Errors:** `401` · `403` · `404`
**Notes:** каскадное удаление через `ON DELETE CASCADE` охватывает `events`, `bookmarks`, `bookmark_categories`, `bookmark_tags`, `sessions`, `bookmark_tag_relations`. Файлы превью удаляются с диска отдельно (ошибки файловой системы не влияют на HTTP-ответ). Нет ограничений на удаление себя или последнего администратора.

---

## Управление ролями и статусом

Изменение роли и статуса — только через CLI-скрипт:

```bash
node scripts/set-role.js admin@example.com role admin
node scripts/set-role.js user@example.com status blocked
```
