# Переменные окружения

- `PORT` — порт сервера (default: `4000`)
- `NODE_ENV` — окружение (`development`, `production`)
- `SEED` — загружать ли тестовые данные при инициализации БД (`true`/`false`)
- `JWT_SECRET` — секрет для подписи JWT. Обязателен, минимум 32 символа. Fail-fast при старте. Сгенерировать: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `ACCESS_TOKEN_EXPIRES_IN` — срок access-токена (default: `15m`). Короткий срок принципиален для безопасности схемы access+refresh.
- `REFRESH_TOKEN_EXPIRES_MS` — срок refresh-токена в мс (default: `2592000000`, 30 дней)
- `AUTH_RATE_LIMIT_WINDOW_MS` — окно rate-limit для login/register (default: `900000`, 15 мин)
- `AUTH_RATE_LIMIT_MAX` — лимит запросов для login/register (default: `10`)
- `REFRESH_RATE_LIMIT_WINDOW_MS` — окно rate-limit для /refresh (default: `60000`, 1 мин)
- `REFRESH_RATE_LIMIT_MAX` — лимит запросов для /refresh (default: `120`)

> `JWT_EXPIRES_IN` — устаревшая переменная. Игнорируется с предупреждением в консоль. Используйте `ACCESS_TOKEN_EXPIRES_IN`.

**Пример `.env`:**
```
PORT=4000
NODE_ENV=development
SEED=true
JWT_SECRET=<64-значная случайная hex-строка>
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_MS=2592000000
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=10
REFRESH_RATE_LIMIT_WINDOW_MS=60000
REFRESH_RATE_LIMIT_MAX=120
```

> Файл `.env` не должен попадать в систему контроля версий. В репозитории хранится `.env.example`.
