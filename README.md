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
- JWT-токены (Bearer) для защиты всех API-маршрутов
- Хеширование паролей через Argon2id
- Каждый пользователь видит только свои данные

---

## 🛠 Технологический стек

**Frontend:** React 19, TypeScript 4.9, Ant Design 5, React Router 7, Jest

**Backend:** Node.js 18+, Express 5, SQLite 3, better-sqlite3, nanoid, sharp, jsonwebtoken, argon2

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
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

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
| [`backend/README.md`](backend/README.md) | API reference, структура backend, переменные окружения |
| [`backend/db/README.md`](backend/db/README.md) | Схема БД, таблицы, инициализация |
| [`frontend/docs/useGroupedEvents.md`](frontend/docs/useGroupedEvents.md) | Алгоритм группировки и классификации событий |

---

## 📄 Лицензия

MIT

---

*Последнее обновление: Апрель 2026*
