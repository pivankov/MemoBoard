# API: Аутентификация

Базовый URL: `/api/auth`. Эндпоинты `/refresh` и `/logout` дополнительно требуют заголовок `X-CSRF-Token` со значением cookie `csrf_token` (double-submit pattern, сверка через `timingSafeEqual`).

Все защищённые эндпоинты других разделов (`/api/events/*`, `/api/bookmarks/*`, `/api/admin/*`) требуют `Authorization: Bearer <accessToken>`. При отсутствии или невалидности токена — `401`.

Архитектура auth-схемы (lifecycle, family, reuse detection): см. [`./architecture.md`](./architecture.md).

---

## Контракты

`User`:
- `uid: string` — публичный UUID
- `email: string`
- `name: string | null`
- `role: 'user' | 'admin'`
- `status: 'active' | 'blocked'`

Cookies, выставляемые при login/register/refresh:
- `refresh_token` — httpOnly, SameSite=Lax, path=/api/auth, 30 дней. Хеш SHA-256 хранится в `sessions`, raw-токен — нет.
- `csrf_token` — JS-readable, SameSite=Lax, path=/api/auth.

---

## Эндпоинты

#### POST /api/auth/register → 201

Регистрирует пользователя.

**Body:** `{ email: string, password: string (min 6), name?: string }`
**Response:** `{ accessToken: string, user: User }`
**Sets cookies:** `refresh_token`, `csrf_token`
**Errors:** `400` валидация · `409` email занят · `500`
**Rate limit:** `authLimiter` (по умолчанию 10/15 мин)

---

#### POST /api/auth/login → 200

Вход по email и паролю.

**Body:** `{ email: string, password: string }`
**Response:** `{ accessToken: string, user: User }`
**Sets cookies:** `refresh_token`, `csrf_token`
**Errors:** `400` валидация · `401` неверный email/пароль · `500`
**Rate limit:** `authLimiter`

---

#### POST /api/auth/refresh → 200

Ротирует refresh-токен и выдаёт новый access-токен.

**Auth:** cookie `refresh_token` + `X-CSRF-Token`
**Response:** `{ accessToken: string }`
**Sets cookies:** `refresh_token` (новый), `csrf_token` (новый)
**Errors:** `401` нет/истёк/отозван/reuse detected · `403` CSRF · `500`
**Rate limit:** `refreshLimiter` (по умолчанию 120/мин)
**Notes:** при reuse detection (повторное использование уже отозванного токена) сервер аннулирует все сессии этой `family_id` и возвращает 401.

---

#### POST /api/auth/logout → 204

Отзывает текущий refresh-токен в БД, очищает auth-cookies.

**Auth:** cookie `refresh_token` + `X-CSRF-Token`
**Errors:** `403` CSRF
**Notes:** возвращает 204 даже если refresh-токен не найден в БД (best-effort). Cookies очищаются всегда.

---

#### GET /api/auth/me → 200

Данные текущего пользователя.

**Auth:** Bearer
**Response:** `{ user: User }`
**Errors:** `401`

---

## Запланировано

- `GET /api/auth/sessions` — список активных сессий пользователя.
- `POST /api/auth/logout-all` — выход со всех устройств.
- Cron-очистка устаревших revoked/expired сессий.
- Принудительный logout при смене пароля.
- Token binding по `user_agent` / `ip_address` (поля уже хранятся в `sessions`).
