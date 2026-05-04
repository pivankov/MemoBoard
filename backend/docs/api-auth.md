# API: Аутентификация (Auth)

Базовый URL: `http://localhost:4000/api`

> **Аутентификация:** все маршруты `/api/events/*` и `/api/bookmarks/*` требуют передачи JWT-токена в заголовке:
> ```
> Authorization: Bearer <token>
> ```
> При отсутствии или невалидности токена возвращается `401 Unauthorized`.

---

### Аутентификация (Auth)

#### POST /api/auth/register

Регистрирует нового пользователя. Возвращает JWT-токен для немедленного входа.

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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "uid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "Иван"
  }
}
```

**Ошибки:**
- `400` - Email или пароль не переданы / некорректный формат email / пароль менее 6 символов
- `409` - Пользователь с таким email уже зарегистрирован
- `500` - Не удалось зарегистрировать пользователя

---

#### POST /api/auth/login

Выполняет вход по email и паролю. Возвращает JWT-токен.

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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "uid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "Иван"
  }
}
```

**Ошибки:**
- `400` - Email или пароль не переданы
- `401` - Неверный email или пароль
- `500` - Не удалось выполнить вход

---

#### GET /api/auth/me

Возвращает данные текущего авторизованного пользователя. Требует Bearer-токен.

**Заголовки:**
```
Authorization: Bearer <token>
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
