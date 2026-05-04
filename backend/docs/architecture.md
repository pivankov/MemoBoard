# Архитектура backend

## 📁 Структура проекта

```
backend/
├── app.js              # Главный файл приложения, настройка Express
├── package.json        # Зависимости и скрипты
├── db/                 # База данных
│   ├── README.md       # Документация по БД
│   ├── initdb.js       # Инициализация и миграции БД
│   ├── cli-init.js     # CLI для инициализации БД
│   ├── data.db         # Файл базы данных SQLite
│   └── seeds/          # Тестовые данные
│       ├── events.js
│       └── bookmarks.js
├── middleware/         # Express middleware
│   ├── auth.js         # requireAuth — проверка JWT-токена
│   └── rateLimit.js    # authLimiter — rate-limiting для /auth/login и /auth/register
├── routes/             # API маршруты
│   ├── index.js        # Корневой роутер
│   ├── auth/           # Аутентификация
│   │   └── index.js
│   ├── events/         # События
│   │   └── index.js
│   └── bookmarks/      # Закладки
│       ├── index.js
│       ├── categories.js
│       └── tags.js
├── uploads/            # Пользовательские данные (не входят в сборку фронтенда)
│   └── previews/       # Превью изображения закладок
└── utils/              # Утилиты
    ├── date.js         # Работа с датами
    ├── jwt.js          # Генерация и верификация JWT-токенов
    ├── preview.js      # Скачивание, обработка и удаление превью закладок
    └── uid.js          # Генерация уникальных ID
```

## 📝 Дополнительная информация

### Middleware

Приложение использует следующие middleware:
- `express.json()` - Парсинг JSON в теле запроса
- `express.urlencoded({ extended: true })` - Парсинг URL-encoded данных
- `cors()` - Включение CORS для всех источников
- `express.static('/previews')` - Раздача превью закладок из папки `uploads/previews/`
- `express.static()` - Раздача статических файлов сборки фронтенда из папки `public`
- `requireAuth` (`middleware/auth.js`) - Проверка JWT-токена из заголовка `Authorization: Bearer <token>`. При успехе добавляет `req.user` со следующими полями: `userId` (internal DB id), `uid`, `email`, `name`. Применяется ко всем маршрутам `/api/events/*` и `/api/bookmarks/*`.
- `authLimiter` (`middleware/rateLimit.js`) - Rate-limiting для `/api/auth/login` и `/api/auth/register`. По умолчанию 10 запросов с одного IP за 15 минут. Защищает от перебора паролей и массовой регистрации. Параметры настраиваются через `AUTH_RATE_LIMIT_WINDOW_MS` и `AUTH_RATE_LIMIT_MAX`. При превышении лимита возвращает 429 Too Many Requests. Не применяется к `/api/auth/me` — там нечего перебирать, и он вызывается при каждой загрузке приложения.

### Обработка ошибок

Все endpoint'ы возвращают ошибки в едином формате:
```json
{
  "error": "Описание ошибки"
}
```

Ошибки также логируются в консоль с помощью `console.error()`.

### Валидация данных

Валидация происходит на уровне route handlers:
- Проверка типов данных
- Проверка обязательных полей
- Проверка допустимых значений (например, recurrence)
- Проверка существования связанных сущностей (типы событий, категории, теги)

---
