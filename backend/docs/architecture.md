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
│   ├── auth.js         # requireAuth — проверка access-токена (JWT)
│   ├── admin.js        # requireAdmin — проверка роли admin (после requireAuth)
│   ├── csrf.js         # requireCsrf — double-submit cookie CSRF-защита
│   └── rateLimit.js    # authLimiter, refreshLimiter — rate-limiting
├── routes/             # API маршруты
│   ├── index.js        # Корневой роутер
│   ├── auth/           # Аутентификация
│   │   └── index.js
│   ├── events/         # События
│   │   └── index.js
│   ├── bookmarks/      # Закладки
│   │   ├── index.js
│   │   ├── categories.js
│   │   └── tags.js
│   └── admin/          # Административный раздел (requireAuth + requireAdmin)
│       └── index.js
├── services/           # Бизнес-логика
│   └── sessionService.js  # Управление refresh-сессиями
├── uploads/            # Пользовательские данные (не входят в сборку фронтенда)
│   └── previews/       # Превью изображения закладок
└── utils/              # Утилиты
    ├── cookieOptions.js  # Константы и опции для auth-cookies
    ├── date.js           # Работа с датами
    ├── jwt.js            # Генерация и верификация access-токенов (JWT)
    ├── preview.js        # Скачивание, обработка и удаление превью закладок
    ├── refreshToken.js   # Генерация и хеширование refresh-токенов
    └── uid.js            # Генерация уникальных ID
```

## 🔐 Система аутентификации

### Схема: access + refresh токены с CSRF-защитой

**Два типа токенов:**

| | Access-токен | Refresh-токен |
|---|---|---|
| Тип | JWT (подписан `JWT_SECRET`) | Непрозрачная случайная строка (96 hex) |
| Срок | 15 минут | 30 дней |
| Хранение на клиенте | Только в памяти (`useRef`) | httpOnly-cookie (`refresh_token`, path=/api/auth) |
| Хранение на сервере | Нет | SHA-256 хеш в таблице `sessions` |
| Передача | Заголовок `Authorization: Bearer` | Cookie (автоматически браузером) |

**CSRF-защита (double-submit cookie pattern):**

При выдаче refresh-токена сервер также выставляет читаемую JS cookie `csrf_token`. При вызове `/refresh` и `/logout` клиент обязан передать значение `csrf_token` в заголовке `X-CSRF-Token`. Сервер сравнивает cookie и заголовок через `timingSafeEqual`. Поскольку httpOnly-cookie недоступна JS с других origin, а `SameSite=Lax` ограничивает cross-site отправку, схема надёжно защищает от CSRF-атак.

### Lifecycle токенов

```
Логин/Регистрация
  → createSession()          создаёт запись в sessions (новый family_id)
  → res: { accessToken }     access-токен в теле ответа
  → cookie: refresh_token    refresh-токен в httpOnly-cookie
  → cookie: csrf_token       CSRF-токен в читаемой cookie

Запрос к API (< 15 мин)
  → Authorization: Bearer <accessToken>
  → middleware/auth.js verifyAccessToken()
  → req.user заполнен → обработчик выполняется

Access-токен истёк
  → клиент вызывает POST /auth/refresh
  → X-CSRF-Token: <csrf_token>   (middleware/csrf.js проверяет)
  → rotateSession()               старая сессия помечена replaced_by_id
  → новая сессия создана в БД
  → res: { accessToken }          новый access-токен
  → обновлённые cookies refresh_token + csrf_token

Logout
  → POST /auth/logout + X-CSRF-Token
  → revokeSessionByToken()        сессия отозвана в БД
  → cookies очищены
  → 204 No Content
```

> **Дедупликация параллельных refresh:** если одновременно истекают несколько запросов и все получают `401`, фронтенд выполняет только **один** реальный запрос `POST /auth/refresh` — через `refreshPromiseRef` в `AuthProvider`. Остальные ожидают его результата и повторяют свои запросы с уже новым access-токеном.

### Session Family и Reuse Detection

Каждый логин создаёт уникальный `family_id`. Все последующие ротации сохраняют тот же `family_id`. При обнаружении использования уже отозванного токена (признак кражи):

1. Сервер находит все сессии с данным `family_id`
2. Аннулирует их все (`revoked_at = now`)
3. Возвращает `401` и очищает auth-cookies
4. Клиент перенаправляется на страницу логина

### Защита от основных атак

| Угроза | Защита |
|---|---|
| XSS-кража токена | Access-токен только в памяти (не в localStorage/cookie) |
| Утечка токена через контекст | `token` и `refreshToken` **не экспортируются** из `AuthContext` — компоненты не имеют прямого доступа к значению токена |
| Cookie-кража | Refresh в httpOnly-cookie (JS недоступен) |
| CSRF | Double-submit cookie (X-CSRF-Token заголовок) |
| Replay после кражи refresh | Reuse detection + аннулирование family |
| Перебор паролей | authLimiter (10 req / 15 мин) |
| DoS на /refresh | refreshLimiter (120 req / мин) |

### Dev/Prod: same-origin архитектура

В **production** backend раздаёт собранный фронтенд из `backend/public/` — всё на одном origin, cookies работают без дополнительной настройки.

В **dev** frontend запущен на `http://localhost:3000`, backend на `http://localhost:4000`. Без прокси cross-origin запросы блокируют `SameSite=Lax` cookies. Решение: поле `"proxy": "http://localhost:4000"` в `frontend/package.json` — CRA проксирует все `/api/*` запросы через тот же origin. API URL на фронтенде заданы относительными (`/api/...`), что обеспечивает одинаковое поведение в dev и prod без изменения кода.

## 📝 Дополнительная информация

### Middleware

Приложение использует следующие middleware:
- `express.json()` - Парсинг JSON в теле запроса
- `express.urlencoded({ extended: true })` - Парсинг URL-encoded данных
- `cookie-parser` - Парсинг cookies (обязателен для refresh/CSRF). Подключается после `express.json()`, до роутов.
- `cors()` - Включение CORS для всех источников
- `express.static('/previews')` - Раздача превью закладок из папки `uploads/previews/`
- `express.static()` - Раздача статических файлов сборки фронтенда из папки `public`
- `requireAuth` (`middleware/auth.js`) - Проверка access-токена из заголовка `Authorization: Bearer <token>`. При успехе добавляет `req.user` со следующими полями: `userId` (internal DB id), `uid`, `email`, `name`, `role` (`'user'|'admin'`), `status` (`'active'|'blocked'`). Поля `role` и `status` берутся из БД на **каждый** запрос (не из JWT-payload) — это гарантирует актуальность прав без ожидания истечения токена. Применяется ко всем маршрутам `/api/events/*`, `/api/bookmarks/*` и `/api/admin/*`.
- `requireAdmin` (`middleware/admin.js`) - Проверка роли администратора. Должно стоять после `requireAuth`. Возвращает `403 Доступ запрещён`, если `req.user.role !== 'admin'`. Дополнительный SQL не выполняется — опирается на `req.user.role`, уже подтянутый из БД в `requireAuth`. Применяется ко всем маршрутам `/api/admin/*`.
- `requireCsrf` (`middleware/csrf.js`) - CSRF-защита через double-submit cookie. Сравнивает `cookies.csrf_token` с заголовком `X-CSRF-Token`. Применяется к `POST /auth/refresh` и `POST /auth/logout`.
- `authLimiter` (`middleware/rateLimit.js`) - Rate-limiting для `/api/auth/login` и `/api/auth/register`. По умолчанию 10 запросов с одного IP за 15 минут. Параметры: `AUTH_RATE_LIMIT_WINDOW_MS`, `AUTH_RATE_LIMIT_MAX`.
- `refreshLimiter` (`middleware/rateLimit.js`) - Rate-limiting для `/api/auth/refresh`. По умолчанию 120 запросов с одного IP за 1 минуту. Параметры: `REFRESH_RATE_LIMIT_WINDOW_MS`, `REFRESH_RATE_LIMIT_MAX`.

`app.js` также устанавливает `app.set('trust proxy', 1)` для корректного определения `req.ip` за nginx/Cloudflare.

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
