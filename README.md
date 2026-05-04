# MemoBoard

> Персональный веб-ассистент для повышения продуктивности

MemoBoard — веб-сервис для управления событиями и закладками. Единое приложение с REST API на backend и React SPA на frontend.

---

## 📋 Возможности

### 🎉 События (Календарь)
- Типы событий: праздники, дни рождения, церковные события, прочее
- Повторения: разовые, ежемесячные, ежегодные
- Умная группировка по месяцам
- Отображение недавно прошедших событий (окно 1-7 дней)
- Отслеживание просроченных разовых событий

### 🔖 Закладки
- Управление закладками: создание, редактирование, удаление
- Категории и теги для организации
- Корзина с возможностью восстановления
- Превью изображений для закладок

### 🔐 Аутентификация
- Регистрация и вход по email + пароль
- Access + Refresh токены: короткоживущий JWT (15 мин) в памяти + долгоживущий refresh-токен (30 дней) в httpOnly-cookie
- CSRF-защита через double-submit cookie pattern
- Серверная ротация refresh-токенов с reuse detection
- Хеширование паролей через Argon2id
- Каждый пользователь видит только свои данные

---

## 🛠 Технологический стек

**Frontend:** React 19, TypeScript 4.9, Ant Design 5, React Router 7, Jest

**Backend:** Node.js 18+, Express 5, SQLite 3, better-sqlite3, nanoid, sharp, jsonwebtoken, cookie-parser, argon2

---

## 📁 Структура проекта

```
MemoBoard/
├── frontend/        # React SPA
│   ├── src/         # Исходный код
│   └── docs/        # Документация фронтенда
└── backend/         # Node.js REST API
    ├── routes/      # API маршруты
    ├── middleware/  # Express middleware (requireAuth и др.)
    ├── db/          # БД и миграции
    ├── utils/       # Утилиты
    └── public/      # Сборка frontend (production)
```

---

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- npm

### Установка

```bash
# Зависимости backend
cd backend && npm install

# Зависимости frontend
cd ../frontend && npm install
```

### Настройка переменных окружения

```bash
# Создать файл backend/.env на основе примера
cp backend/.env.example backend/.env
# Отредактировать JWT_SECRET перед деплоем в production
```

Минимальный `backend/.env`:
```
PORT=4000
NODE_ENV=development
JWT_SECRET=<64-символьная случайная hex-строка>
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_MS=2592000000
```

> **Важно:** `JWT_SECRET` обязателен и должен быть не короче 32 символов — иначе сервер упадёт при старте (fail-fast). Для генерации используйте:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```
> Полный список переменных (включая настройки rate-limiter) — см. `backend/.env.example` и [`backend/docs/env.md`](backend/docs/env.md).

### Инициализация базы данных

```bash
cd backend

# С тестовыми данными (рекомендуется для разработки)
npm run db:init

# Без тестовых данных
npm run db:init:noseed
```

### Режим разработки

Два отдельных процесса в разных терминалах:

```bash
# Терминал 1 — backend (http://localhost:4000)
cd backend && npm start

# Терминал 2 — frontend (http://localhost:3000)
cd frontend && npm start
```

### Production

```bash
# 1. Собрать frontend (результат попадает в backend/public/)
cd frontend && npm run build

# 2. Запустить backend (раздаёт и API, и статику)
cd backend && npm start
# Приложение доступно на http://localhost:4000
```

---

## 📚 Документация

| Документ | Описание |
|---|---|
| [`frontend/README.md`](frontend/README.md) | Архитектура фронтенда, роутинг, API-интеграция, команды, AI Task Context |
| [`backend/README.md`](backend/README.md) | Технологии, установка, запуск, оглавление backend-документации |
| [`backend/docs/api-auth.md`](backend/docs/api-auth.md) | API аутентификации: register, login, refresh, logout, me |
| [`backend/docs/api-events.md`](backend/docs/api-events.md) | API событий: CRUD для `/api/events` |
| [`backend/docs/api-bookmarks.md`](backend/docs/api-bookmarks.md) | API закладок, категорий и тегов |
| [`backend/docs/architecture.md`](backend/docs/architecture.md) | Структура проекта, система аутентификации, middleware |
| [`backend/docs/env.md`](backend/docs/env.md) | Переменные окружения и пример `.env` |
| [`backend/docs/utilities.md`](backend/docs/utilities.md) | Утилиты: preview, jwt, refreshToken, cookieOptions, sessionService, csrf, date, uid |
| [`backend/db/README.md`](backend/db/README.md) | Схема БД, таблицы, инициализация |
| [`frontend/docs/useGroupedEvents.md`](frontend/docs/useGroupedEvents.md) | Алгоритм группировки и классификации событий |

---

## 📄 Лицензия

MIT

---

*Последнее обновление: Май 2026*
