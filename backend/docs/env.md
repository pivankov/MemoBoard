# Переменные окружения

## ⚙️ Переменные окружения

- `PORT` - Порт сервера (по умолчанию: `4000`)
- `NODE_ENV` - Окружение (`development`, `production`)
- `SEED` - Загружать ли тестовые данные при инициализации БД (`true`/`false`)
- `JWT_SECRET` - Секретный ключ для подписи JWT-токенов. **Обязателен**, минимум 32 символа. Сервер не стартует, если переменная не задана или слишком короткая (fail-fast проверка при импорте `utils/jwt.js`). Сгенерировать: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `JWT_EXPIRES_IN` - Срок действия токена (по умолчанию: `7d`). Примеры: `1h`, `30d`, `365d`
- `AUTH_RATE_LIMIT_WINDOW_MS` - Окно rate-limiter для `/auth/login` и `/auth/register` в миллисекундах (по умолчанию: `900000`, т.е. 15 минут)
- `AUTH_RATE_LIMIT_MAX` - Максимум запросов с одного IP в окне (по умолчанию: `10`)

**Пример `.env` файла:**
```
PORT=4000
NODE_ENV=development
SEED=true
JWT_SECRET=<64-значная случайная hex-строка, сгенерированная через crypto.randomBytes>
JWT_EXPIRES_IN=7d
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=10
```

> **Важно:** Файл `.env` не должен попадать в систему контроля версий. В репозитории хранится `.env.example` с описанием всех переменных без значений.

---
