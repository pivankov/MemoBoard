# Архитектура backend

## Структура проекта

```
backend/
├── app.js
├── package.json
├── db/                      # → db/README.md
├── middleware/
│   ├── auth.js              # requireAuth — проверка access-токена (JWT)
│   ├── admin.js             # requireAdmin — проверка роли (после requireAuth)
│   ├── csrf.js              # requireCsrf — double-submit cookie CSRF-защита
│   └── rateLimit.js         # authLimiter, refreshLimiter
├── routes/
│   ├── auth/
│   ├── events/
│   ├── bookmarks/
│   └── admin/
├── services/
│   └── sessionService.js    # Управление refresh-сессиями
├── uploads/previews/        # Превью закладок
└── utils/                   # → docs/utilities.md
```

## Система аутентификации

### Схема: access + refresh токены с CSRF-защитой

| | Access-токен | Refresh-токен |
|---|---|---|
| Тип | JWT (подписан `JWT_SECRET`) | Непрозрачная строка (96 hex) |
| Срок | 15 минут | 30 дней |
| Хранение на клиенте | Только в памяти (`useRef`) | httpOnly-cookie (`refresh_token`, path=/api/auth) |
| Хранение на сервере | Нет | SHA-256 хеш в таблице `sessions` |
| Передача | `Authorization: Bearer` | Cookie (автоматически) |

CSRF-защита — double-submit cookie: при выдаче refresh-токена сервер выставляет читаемую JS cookie `csrf_token`. При `/refresh` и `/logout` клиент передаёт её в заголовке `X-CSRF-Token`; сервер сравнивает через `timingSafeEqual`.

### Lifecycle токенов

```
Логин/Регистрация
  → createSession()          создаёт запись в sessions (новый family_id)
  → res: { accessToken } + cookie: refresh_token + csrf_token

Запрос к API (< 15 мин)
  → Authorization: Bearer <accessToken>
  → requireAuth → req.user заполнен → обработчик выполняется

Access-токен истёк
  → POST /auth/refresh + X-CSRF-Token
  → rotateSession() — старая сессия помечена replaced_by_id
  → res: { accessToken } + обновлённые cookies

Logout
  → POST /auth/logout + X-CSRF-Token
  → revokeSessionByToken() → cookies очищены → 204 No Content
```

> Параллельные refresh: фронтенд выполняет только один реальный `POST /auth/refresh` через `refreshPromiseRef` в `AuthProvider`; остальные ожидают его результата.

### Session Family и Reuse Detection

Каждый логин создаёт уникальный `family_id`. При ротации старая сессия помечается `replaced_by_id`, новая наследует `family_id`. При обнаружении повторного использования уже отозванного токена сервер аннулирует все сессии с данным `family_id` и возвращает `401`. Схема полей таблицы `sessions` — в [db/README.md](../db/README.md).

### Защита от атак

| Угроза | Защита |
|---|---|
| XSS-кража токена | Access-токен только в памяти, не в localStorage/cookie |
| Утечка через контекст | `token` и `refreshToken` не экспортируются из `AuthContext` |
| Cookie-кража | Refresh в httpOnly-cookie (JS недоступен) |
| CSRF | Double-submit cookie (X-CSRF-Token) |
| Replay после кражи refresh | Reuse detection + аннулирование family |
| Перебор паролей | authLimiter (10 req / 15 мин) |
| DoS на /refresh | refreshLimiter (120 req / мин) |

### Dev/Prod: same-origin архитектура

В production backend раздаёт собранный фронтенд из `backend/public/`. В dev `"proxy": "http://localhost:4000"` в `frontend/package.json` проксирует все `/api/*` запросы, сохраняя same-origin поведение cookies без изменения кода.

## Middleware

- `requireAuth` — проверяет `Authorization: Bearer <token>`. Заполняет `req.user`: `{ userId, uid, email, name, role: 'user'|'admin', status: 'active'|'blocked' }`. `role` и `status` читаются из БД на каждый запрос (не из JWT-payload). Применяется к `/api/events/*`, `/api/bookmarks/*`, `/api/admin/*`.
- `requireAdmin` — проверяет `req.user.role === 'admin'`; `403` иначе. Без дополнительного SQL. Стоит после `requireAuth`.
- `requireCsrf` — сравнивает `cookies.csrf_token` с `X-CSRF-Token` через `timingSafeEqual`; `403` при несовпадении. Применяется к `POST /auth/refresh`, `POST /auth/logout`.
- `authLimiter` — 10 req / 15 мин для `/auth/login`, `/auth/register`. Параметры: `AUTH_RATE_LIMIT_WINDOW_MS`, `AUTH_RATE_LIMIT_MAX`.
- `refreshLimiter` — 120 req / мин для `/auth/refresh`. Параметры: `REFRESH_RATE_LIMIT_WINDOW_MS`, `REFRESH_RATE_LIMIT_MAX`.
- `app.set('trust proxy', 1)` — корректный `req.ip` за nginx/Cloudflare (нужен для rate limiting по IP).
