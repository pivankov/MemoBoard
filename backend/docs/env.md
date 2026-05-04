# Переменные окружения

## ⚙️ Переменные окружения

- `PORT` - Порт сервера (по умолчанию: `4000`)
- `NODE_ENV` - Окружение (`development`, `production`)
- `SEED` - Загружать ли тестовые данные при инициализации БД (`true`/`false`)
- `JWT_SECRET` - Секретный ключ для подписи JWT-токенов. **Обязателен**, минимум 32 символа. Сервер не стартует, если переменная не задана или слишком короткая (fail-fast проверка при импорте `utils/jwt.js`). Сгенерировать: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `ACCESS_TOKEN_EXPIRES_IN` - Срок действия access-токена (по умолчанию: `15m`). Примеры: `5m`, `1h`. Короткий срок — принципиально важен для безопасности.
- `REFRESH_TOKEN_EXPIRES_MS` - Срок действия refresh-токена в миллисекундах (по умолчанию: `2592000000`, т.е. 30 дней).
- `AUTH_RATE_LIMIT_WINDOW_MS` - Окно rate-limiter для `/auth/login` и `/auth/register` в миллисекундах (по умолчанию: `900000`, т.е. 15 минут)
- `AUTH_RATE_LIMIT_MAX` - Максимум запросов с одного IP в окне для login/register (по умолчанию: `10`)
- `REFRESH_RATE_LIMIT_WINDOW_MS` - Окно rate-limiter для `/auth/refresh` в миллисекундах (по умолчанию: `60000`, т.е. 1 минута)
- `REFRESH_RATE_LIMIT_MAX` - Максимум запросов с одного IP в окне для /refresh (по умолчанию: `120`). Мягкий лимит — против DoS, не против перебора.

> **Устаревшая переменная:** `JWT_EXPIRES_IN` — больше не используется. Если задана, сервер выведет предупреждение в консоль и проигнорирует значение. Используйте `ACCESS_TOKEN_EXPIRES_IN`.

**Пример `.env` файла:**
```
PORT=4000
NODE_ENV=development
SEED=true
JWT_SECRET=<64-значная случайная hex-строка, сгенерированная через crypto.randomBytes>
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_MS=2592000000
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=10
REFRESH_RATE_LIMIT_WINDOW_MS=60000
REFRESH_RATE_LIMIT_MAX=120
```

> **Важно:** Файл `.env` не должен попадать в систему контроля версий. В репозитории хранится `.env.example` с описанием всех переменных без значений.

---
