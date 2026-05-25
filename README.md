# MemoBoard

> Персональный веб-ассистент для повышения продуктивности

MemoBoard — веб-сервис для управления событиями и закладками. REST API на Node.js/Express + React SPA.

---

## 📋 Возможности

### 🎉 События (Календарь)
- Типы: праздники, дни рождения, церковные события, прочее
- Повторения: разовые, ежемесячные, ежегодные
- Умная группировка по месяцам
- Отображение недавно прошедших событий (окно 1–7 дней)
- Отслеживание просроченных разовых событий

### 🔖 Закладки
- Создание, редактирование, удаление
- Категории и теги для организации
- Корзина с возможностью восстановления
- Превью изображений

### 🔐 Аутентификация
- Регистрация и вход по email + пароль
- Access + Refresh токены: JWT (15 мин) в памяти + refresh-токен (30 дней) в httpOnly-cookie
- CSRF-защита через double-submit cookie pattern
- Серверная ротация refresh-токенов с reuse detection
- Хеширование паролей через Argon2id

---

## 🛠 Стек

**Frontend:** React 19, TypeScript 4.9, Ant Design 5, React Router 7, Jest

**Backend:** Node.js 18+, Express 5, SQLite 3, better-sqlite3, nanoid, sharp, jsonwebtoken, cookie-parser, argon2

---

## 🚀 Быстрый старт

```bash
# 1. Зависимости
cd backend && npm install
cd ../frontend && npm install

# 2. Окружение (затем отредактировать JWT_SECRET)
cp backend/.env.example backend/.env

# 3. База данных
cd backend && npm run db:init   # с demo-данными; другие команды — в backend/db/README.md

# 4. Разработка (два терминала)
cd backend && npm start          # http://localhost:4000
cd frontend && npm start         # http://localhost:3000

# 5. Production-сборка
cd frontend && npm run build && cd ../backend && npm start  # :4000 раздаёт и API, и статику
```

Переменные окружения — [`backend/docs/env.md`](backend/docs/env.md). Команды БД — [`backend/db/README.md`](backend/db/README.md).

---

## 📚 Документация

| Документ | Описание |
|---|---|
| [`frontend/README.md`](frontend/README.md) | Архитектура фронтенда, роутинг, API-интеграция, команды, AI Task Context |
| [`backend/README.md`](backend/README.md) | Стек, установка, запуск, ссылки на backend-документацию |
| [`backend/docs/api-auth.md`](backend/docs/api-auth.md) | API аутентификации: register, login, refresh, logout, me |
| [`backend/docs/api-events.md`](backend/docs/api-events.md) | API событий: CRUD для `/api/events` |
| [`backend/docs/api-bookmarks.md`](backend/docs/api-bookmarks.md) | API закладок, категорий и тегов |
| [`backend/docs/api-admin.md`](backend/docs/api-admin.md) | API административного раздела |
| [`backend/docs/architecture.md`](backend/docs/architecture.md) | Структура backend, система аутентификации, middleware |
| [`backend/docs/env.md`](backend/docs/env.md) | Переменные окружения и пример `.env` |
| [`backend/docs/utilities.md`](backend/docs/utilities.md) | Утилиты: preview, jwt, refreshToken, cookieOptions, sessionService, date, uid |
| [`backend/db/README.md`](backend/db/README.md) | Схема БД, таблицы, инициализация, миграции |
| [`frontend/docs/useGroupedEvents.md`](frontend/docs/useGroupedEvents.md) | Алгоритм группировки и классификации событий |

---

## 📄 Лицензия

MIT
