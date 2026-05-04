# MemoBoard Backend

Backend-часть приложения MemoBoard - система для управления событиями и закладками.

## 🚀 Технологии

- **Node.js** 18+
- **Express** 5.x - веб-фреймворк
- **SQLite** 3.x - база данных
- **better-sqlite3** - синхронный драйвер для SQLite
- **nanoid** - генерация уникальных идентификаторов
- **url-metadata** - парсинг метаданных URL
- **sharp** - обработка и оптимизация изображений (превью закладок)
- **argon2** - хеширование паролей (Argon2id)
- **jsonwebtoken** - генерация и верификация JWT access-токенов
- **cookie-parser** - парсинг cookies (refresh-токен, CSRF)
- **express-rate-limit** - ограничение частоты запросов на чувствительных auth-маршрутах
- **dotenv** - загрузка переменных окружения из `.env`

## 📦 Установка и запуск

### Требования

- Node.js версии 18 или выше
- npm

### Установка зависимостей

```bash
npm install
```

### Инициализация базы данных

```bash
# С тестовыми данными (рекомендуется для разработки)
npm run db:init

# Без тестовых данных
npm run db:init:noseed

# Полный сброс БД с тестовыми данными
npm run db:reset
```

### Запуск сервера

```bash
npm start
```

Сервер запустится на порту `4000` (по умолчанию).

### Health Check

Проверка работоспособности сервера:

```bash
curl http://localhost:4000/health
```

Ответ:
```json
{
  "status": "ok",
  "timestamp": "2024-12-05T10:30:00.000Z",
  "uptime": 123.456,
  "version": "1.0.0",
  "environment": "development"
}
```

## 💾 База данных

Подробная документация по структуре базы данных, таблицам, миграциям и командам находится в [`/backend/db/README.md`](./db/README.md).

**Основные команды:**
- `npm run db:init` - Инициализация БД с тестовыми данными
- `npm run db:init:noseed` - Инициализация БД без тестовых данных
- `npm run db:reset` - Полный сброс БД с тестовыми данными
- `npm run db:reset:noseed` - Полный сброс БД без тестовых данных

### Изменение роли и статуса пользователя

```bash
node scripts/set-role.js <email> <field> <value>
```

[`/scripts/set-role.js`](./scripts/set-role.js)

---

## 📚 Документация

| Документ | Описание |
|---|---|
| [`docs/api-auth.md`](./docs/api-auth.md) | API аутентификации: register, login, refresh, logout, me |
| [`docs/api-events.md`](./docs/api-events.md) | API событий: CRUD для `/api/events` |
| [`docs/api-bookmarks.md`](./docs/api-bookmarks.md) | API закладок, категорий и тегов |
| [`docs/architecture.md`](./docs/architecture.md) | Структура проекта, система аутентификации, middleware |
| [`docs/env.md`](./docs/env.md) | Переменные окружения и пример `.env` |
| [`docs/utilities.md`](./docs/utilities.md) | Утилиты: preview, jwt, refreshToken, cookieOptions, sessionService, csrf, date, uid |
| [`db/README.md`](./db/README.md) | Схема БД, таблицы, миграции |
