# MemoBoard Backend

Node.js/Express API — управление событиями и закладками.

## Стек

- Node.js 18+, Express 5.x
- SQLite 3.x + better-sqlite3
- argon2 (пароли), jsonwebtoken (JWT), cookie-parser, express-rate-limit
- nanoid, url-metadata, sharp, dotenv

## Установка и запуск

```bash
npm install
npm run db:init   # инициализация БД с demo-данными
npm start         # порт 4000 (по умолчанию)
```

Полный список команд БД (`db:reset`, `db:reset:demo`, `db:init:noseed` и др.) — в [db/README.md](./db/README.md).

Health check: `GET /health` → `{ status, timestamp, uptime, version, environment }`.

## Управление пользователями

```bash
node scripts/set-role.js <email> <field> <value>
```

## Документация

| Документ | Описание |
|---|---|
| [`docs/api-auth.md`](./docs/api-auth.md) | API аутентификации: register, login, refresh, logout, me |
| [`docs/api-events.md`](./docs/api-events.md) | API событий: CRUD для `/api/events` |
| [`docs/api-bookmarks.md`](./docs/api-bookmarks.md) | API закладок, категорий и тегов |
| [`docs/api-admin.md`](./docs/api-admin.md) | API административного раздела |
| [`docs/architecture.md`](./docs/architecture.md) | Структура проекта, аутентификация, middleware |
| [`docs/env.md`](./docs/env.md) | Переменные окружения и пример `.env` |
| [`docs/utilities.md`](./docs/utilities.md) | Утилиты: preview, jwt, refreshToken, cookieOptions, sessionService, date, uid |
| [`db/README.md`](./db/README.md) | Схема БД, таблицы, миграции |
