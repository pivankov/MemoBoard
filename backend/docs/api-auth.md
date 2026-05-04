# API: Аутентификация (Auth)

Базовый URL: `/api` (относительный, same-origin через CRA-прокси в dev и прямой backend в prod)

> **Аутентификация:** все маршруты `/api/events/*` и `/api/bookmarks/*` требуют передачи access-токена в заголовке:
> ```
> Authorization: Bearer <accessToken>
> ```
> При отсутствии или невалидности токена возвращается `401 Unauthorized`.

> **CSRF-защита:** эндпоинты `/refresh` и `/logout` требуют заголовок `X-CSRF-Token`.
> Значение — содержимое JS-читаемой cookie `csrf_token` (выставляется сервером при логине/регистрации).
> Сервер сверяет cookie и заголовок через `timingSafeEqual`. При несовпадении или отсутствии — `403 Forbidden`.

---

### Аутентификация (Auth)

#### POST /api/auth/register

Регистрирует нового пользователя. Возвращает access-токен и данные пользователя. Refresh-токен выставляется в httpOnly-cookie.

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "secret123",
  "name": "Иван"
}
```

**Поля:**
- `email` (string, required) - Email пользователя (уникальный)
- `password` (string, required) - Пароль (минимум 6 символов)
- `name` (string, optional) - Имя пользователя

**Ответ (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "uid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "Иван"
  }
}
```

**Cookies, выставляемые сервером:**
- `refresh_token` — httpOnly, SameSite=Lax, path=/api/auth, срок 30 дней (хеш хранится в БД)
- `csrf_token` — читаемая JS cookie, SameSite=Lax, path=/api/auth

**Ошибки:**
- `400` - Email или пароль не переданы / некорректный формат email / пароль менее 6 символов
- `409` - Пользователь с таким email уже зарегистрирован
- `500` - Не удалось зарегистрировать пользователя

---

#### POST /api/auth/login

Выполняет вход по email и паролю. Возвращает access-токен и данные пользователя. Refresh-токен выставляется в httpOnly-cookie.

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Поля:**
- `email` (string, required) - Email пользователя
- `password` (string, required) - Пароль пользователя

**Ответ (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "uid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "Иван"
  }
}
```

**Cookies, выставляемые сервером:**
- `refresh_token` — httpOnly, SameSite=Lax, path=/api/auth, срок 30 дней
- `csrf_token` — читаемая JS cookie, SameSite=Lax, path=/api/auth

**Ошибки:**
- `400` - Email или пароль не переданы
- `401` - Неверный email или пароль
- `500` - Не удалось выполнить вход

---

#### POST /api/auth/refresh

Обновляет пару токенов: выдаёт новый access-токен и ротирует refresh-токен (старый становится недействительным).

**Требует:**
- Cookie `refresh_token` (httpOnly, передаётся автоматически браузером)
- Заголовок `X-CSRF-Token: <значение csrf_token cookie>`

**Rate limit:** 120 запросов в минуту с одного IP (защита от DoS).

**Ответ (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Cookies, обновляемые сервером:**
- `refresh_token` — новый refresh-токен (старый аннулирован в БД)
- `csrf_token` — новый CSRF-токен

**Ошибки:**
- `401` - Refresh-токен отсутствует / истёк / был отозван / **reuse detected** (токен уже использован — вся сессионная цепочка аннулируется, cookies очищаются)
- `403` - Неверный или отсутствующий `X-CSRF-Token`

> **Reuse detection:** если отозванный refresh-токен предъявлен повторно, сервер аннулирует всю цепочку сессий данного логина (`family_id`) и возвращает 401. Это защита от кражи токена.

---

#### POST /api/auth/logout

Завершает сессию: отзывает текущий refresh-токен в БД и очищает auth-cookies.

**Требует:**
- Cookie `refresh_token`
- Заголовок `X-CSRF-Token: <значение csrf_token cookie>`

**Ответ (204):** нет тела

**Особенности:**
- Всегда возвращает `204` — даже если refresh-токен не найден в БД (best-effort)
- Cookies `refresh_token` и `csrf_token` всегда очищаются

**Ошибки:**
- `403` - Неверный или отсутствующий `X-CSRF-Token`

---

#### GET /api/auth/me

Возвращает данные текущего авторизованного пользователя. Требует access-токен.

**Заголовки:**
```
Authorization: Bearer <accessToken>
```

**Ответ (200):**
```json
{
  "user": {
    "uid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "Иван"
  }
}
```

**Ошибки:**
- `401` - Токен не передан / невалидный / истёк

---

### Запланировано (не реализовано)

Следующие эндпоинты запланированы к реализации. База данных (таблица `sessions`) уже поддерживает необходимую структуру.

| Эндпоинт | Описание |
|---|---|
| `GET /api/auth/sessions` | Список активных сессий текущего пользователя (UI «Мои устройства») |
| `POST /api/auth/logout-all` | Выход со всех устройств — аннулирование всех сессий пользователя |

**Прочие запланированные улучшения:**
- Очистка устаревших revoked/expired сессий (cron-задача или при старте сервера)
- Принудительный logout при смене пароля
- Token binding: `user_agent` и `ip_address` уже хранятся в `sessions`, но при ротации не проверяются

---
