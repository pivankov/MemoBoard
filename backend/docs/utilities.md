# Утилиты (Utils)

## 🛠 Утилиты

### utils/preview.js

Утилиты для работы с превью изображениями закладок.

Превью скачиваются при создании закладки и хранятся в `uploads/previews/`. Изображения оптимизируются через `sharp`: ресайз до 200×200px с сохранением пропорций, конвертация в WebP (качество 80%). Иконки (`.ico`) сохраняются без обработки.

**Функции:**
- `extractPreviewUrl(metadata)` - Извлекает URL превью из метаданных (`og:image` → `twitter:image`)
- `downloadPreview(imageUrl, bookmarkUid)` - Скачивает изображение, оптимизирует и сохраняет локально. Возвращает относительный путь `/previews/uid.ext` или `null` при ошибке
- `deletePreview(previewPath)` - Удаляет файл превью с диска. Отсутствие файла не является ошибкой
- `getFaviconUrl(url)` - Возвращает URL favicon сайта (`{protocol}://{host}/favicon.ico`)

**Особенности:**
- Папка `uploads/previews/` создаётся автоматически при первом скачивании
- Таймаут скачивания: 10 секунд
- Максимальный размер файла: 5 MB
- Поддерживаемые форматы входных данных: JPEG, PNG, WebP, GIF, ICO
- Формат сохранения: WebP (для JPEG/PNG/WebP/GIF) или ICO (без изменений)
- Все ошибки логируются через `console.warn`, исключения не пробрасываются

**Пример:**
```javascript
import { extractPreviewUrl, downloadPreview, getFaviconUrl } from './utils/preview.js';

const previewUrl = extractPreviewUrl(metadata);
// => "https://example.com/og-image.jpg" или null

const previewPath = await downloadPreview(previewUrl, 'xK9pLm2n');
// => "/previews/xK9pLm2n.webp" или null

const faviconUrl = getFaviconUrl('https://github.com');
// => "https://github.com/favicon.ico"
```

---

### utils/jwt.js

Утилиты для работы с access-токенами (JWT).

**Функции:**
- `generateAccessToken(user)` - Создаёт подписанный JWT access-токен. Принимает объект `{ id, uid, email }`, возвращает строку токена. Срок действия задаётся переменной `ACCESS_TOKEN_EXPIRES_IN` (по умолчанию `15m`)
- `verifyAccessToken(token)` - Верифицирует и декодирует токен. Возвращает payload. Бросает `TokenExpiredError` или `JsonWebTokenError` при ошибке

**Конфигурация через переменные окружения:**
- `JWT_SECRET` — секрет для подписи. **Обязателен**, минимум 32 символа. Сервер не стартует, если переменная не задана или слишком короткая (fail-fast). Сгенерировать: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `ACCESS_TOKEN_EXPIRES_IN` — срок действия access-токена (по умолчанию: `15m`). Короткий срок принципиален для безопасности схемы access+refresh.

> **Устаревшая переменная:** `JWT_EXPIRES_IN` — игнорируется с предупреждением в консоль. Используйте `ACCESS_TOKEN_EXPIRES_IN`.

**Пример:**
```javascript
import { generateAccessToken, verifyAccessToken } from './utils/jwt.js';

const token = generateAccessToken({ id: 1, uid: 'abc-123', email: 'user@example.com' });
// => "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

const payload = verifyAccessToken(token);
// => { userId: 1, uid: 'abc-123', email: 'user@example.com', iat: ..., exp: ... }
```

---

### utils/refreshToken.js

Утилиты для генерации и хеширования refresh-токенов.

**Функции:**
- `generateRefreshToken()` — генерирует 48 случайных байт → 96-символьная hex-строка. Используется как непрозрачный refresh-токен.
- `hashRefreshToken(token)` — SHA-256(token) → 64-символьная hex-строка. Только хеш хранится в БД — сам токен не хранится.
- `computeRefreshExpiresAt()` — вычисляет дату истечения refresh-токена: `Date.now() + REFRESH_TOKEN_EXPIRES_MS` → ISO-строка.

**Конфигурация:**
- `REFRESH_TOKEN_EXPIRES_MS` — срок действия refresh-токена в миллисекундах (по умолчанию: `2592000000`, т.е. 30 дней)

**Пример:**
```javascript
import { generateRefreshToken, hashRefreshToken, computeRefreshExpiresAt } from './utils/refreshToken.js';

const raw = generateRefreshToken();
// => "a3f9e2...c4d1" (96 символов hex)

const hash = hashRefreshToken(raw);
// => "7b2a9f...e831" (64 символа hex, SHA-256)

const expiresAt = computeRefreshExpiresAt();
// => "2026-06-03T08:00:00.000Z"
```

---

### utils/cookieOptions.js

Константы и вспомогательные функции для работы с auth-cookies.

**Константы:**
- `REFRESH_COOKIE_NAME` = `'refresh_token'`
- `CSRF_COOKIE_NAME` = `'csrf_token'`
- `AUTH_COOKIE_PATH` = `'/api/auth'`

**Функции:**
- `refreshCookieOptions()` — опции для refresh-токена: `httpOnly: true`, `sameSite: 'lax'`, `secure: NODE_ENV === 'production'`, `path: '/api/auth'`, `maxAge` из `REFRESH_TOKEN_EXPIRES_MS`
- `csrfCookieOptions()` — опции для CSRF-токена: `httpOnly: false` (читается JS на клиенте), остальное аналогично refresh
- `clearAuthCookieOptions()` — опции для очистки refresh-cookie (`expires: new Date(0)`)
- `clearCsrfCookieOptions()` — опции для очистки csrf-cookie
- `generateCsrfToken()` — `randomBytes(32).toString('hex')` → 64-символьная случайная строка

**Примечание:** `Secure` флаг выставляется только в `NODE_ENV === 'production'`, что позволяет cookies работать через `http://` в dev-окружении.

---

### utils/date.js

Утилиты для работы с датами.

**Функции:**
- `normalizeInputDate(dateInput)` - Нормализует входящую дату к ISO-строке с таймзоной UTC

**Пример:**
```javascript
import { normalizeInputDate } from './utils/date.js';

normalizeInputDate('2024-06-13');
// => "2024-06-13T00:00:00Z"

normalizeInputDate('2024-06-13T15:30:00');
// => "2024-06-13T15:30:00.000Z"
```

### utils/uid.js

Утилиты для генерации уникальных идентификаторов.

**Функции:**
- `generateBookmarkUid()` - Генерирует уникальный UID для закладки (8 символов)
- `generateCategoryUid()` - Генерирует уникальный UID для категории (4 символа)
- `generateTagUid()` - Генерирует уникальный UID для тега (5 символов)

**Особенности:**
- Использует библиотеку nanoid для генерации
- Проверяет уникальность в базе данных
- Делает до 10 попыток при коллизии

**Пример:**
```javascript
import { generateBookmarkUid, generateTagUid } from './utils/uid.js';

const bookmarkUid = generateBookmarkUid();
// => "xK9pLm2n"

const tagUid = generateTagUid();
// => "a3X7k"
```

---

## 🔐 Сервисы

### services/sessionService.js

Сервис управления refresh-сессиями. Инкапсулирует всю логику работы с таблицей `sessions`.

**Функции:**

- `createSession({ userId, familyId?, userAgent?, ipAddress? })` → `{ refreshToken, session }`
  Создаёт новую сессию. Если `familyId` не передан — генерируется новый (новый логин). Записывает хеш токена в БД.

- `rotateSession(rawRefreshToken, { userAgent?, ipAddress? })` → один из статусов:
  - `{ status: 'ok', refreshToken, oldSession, newSession }` — успешная ротация; новые cookies должны быть выставлены клиенту
  - `{ status: 'reuse_detected', userId }` — токен уже был использован; вся цепочка `family_id` аннулирована
  - `{ status: 'not_found' | 'expired' | 'revoked' }` — невалидный токен
  Вся логика выполняется в `db.transaction()`.

- `revokeSessionByToken(rawRefreshToken)` → `boolean`
  Отзывает сессию по raw refresh-токену. Возвращает `true` если сессия найдена и отозвана.

**Пример:**
```javascript
import { createSession, rotateSession, revokeSessionByToken } from './services/sessionService.js';

// Создание сессии при логине
const { refreshToken, session } = createSession({ userId: 1, userAgent: req.headers['user-agent'], ipAddress: req.ip });

// Ротация при /refresh
const result = await rotateSession(rawToken, { userAgent: req.headers['user-agent'], ipAddress: req.ip });
if (result.status === 'ok') { /* выдать новые cookies */ }
if (result.status === 'reuse_detected') { /* очистить cookies, warn */ }

// Отзыв при /logout
revokeSessionByToken(rawToken);
```

---

## 🛡 Middleware

### middleware/auth.js

`requireAuth` — проверяет access-токен из заголовка `Authorization: Bearer <token>`. При успехе добавляет `req.user` (`userId`, `uid`, `email`, `name`). Вызывает `verifyAccessToken` из `utils/jwt.js`.

### middleware/csrf.js

`requireCsrf` — middleware CSRF-защиты. Реализует паттерн **double-submit cookie**.

**Логика:**
1. Читает `req.cookies.csrf_token`
2. Читает `req.headers['x-csrf-token']`
3. Сравнивает через `crypto.timingSafeEqual` (защита от timing-атак)
4. При несовпадении или отсутствии любого из значений — `403 Forbidden`

Применяется к эндпоинтам `POST /auth/refresh` и `POST /auth/logout`.

### middleware/rateLimit.js

- `authLimiter` — rate-limiting для `/auth/login` и `/auth/register`. По умолчанию 10 запросов с одного IP за 15 минут. Защищает от перебора паролей. Параметры: `AUTH_RATE_LIMIT_WINDOW_MS`, `AUTH_RATE_LIMIT_MAX`.
- `refreshLimiter` — rate-limiting для `/auth/refresh`. По умолчанию 120 запросов с одного IP за 1 минуту. Мягкий лимит — защита от DoS, не от перебора. Параметры: `REFRESH_RATE_LIMIT_WINDOW_MS`, `REFRESH_RATE_LIMIT_MAX`.

При превышении любого лимита возвращается `429 Too Many Requests`.

---

## ⚙️ app.js

Помимо стандартных middleware (`express.json()`, `cors()`, `express.static()`), `app.js` настраивает:

- `cookie-parser` — парсинг cookies из запроса (обязателен для работы refresh/CSRF). Подключается после `express.json()`, до роутов.
- `app.set('trust proxy', 1)` — корректное определение `req.ip` за reverse proxy (nginx, Cloudflare). Необходимо для корректной работы rate limiter по IP.

---
