# Утилиты и сервисы

Конфигурация через переменные окружения — в [env.md](./env.md).

## Утилиты

### utils/preview.js

Скачивание, оптимизация и удаление превью изображений закладок. Хранятся в `uploads/previews/`.

#### extractPreviewUrl(metadata) → string | null
Извлекает URL превью из метаданных (`og:image` → `twitter:image`).

#### downloadPreview(imageUrl, bookmarkUid) → string | null
Скачивает изображение, оптимизирует через sharp (200×200px, WebP q80; ICO — без обработки), сохраняет локально. Возвращает `/previews/uid.ext` или `null` при ошибке. Папка создаётся автоматически. Ошибки логируются через `console.warn`, не пробрасываются.

Инварианты: таймаут 10 с, максимум 5 МБ.

#### deletePreview(previewPath) → void
Удаляет файл превью. Отсутствие файла — не ошибка.

#### getFaviconUrl(url) → string
`{protocol}://{host}/favicon.ico`.

---

### utils/jwt.js

Генерация и верификация access-токенов (JWT).

#### generateAccessToken(user) → string
`user: { id, uid, email }`. Срок действия — `ACCESS_TOKEN_EXPIRES_IN`.

#### verifyAccessToken(token) → payload
Бросает `TokenExpiredError` или `JsonWebTokenError`.

---

### utils/refreshToken.js

Генерация и хеширование refresh-токенов.

#### generateRefreshToken() → string
48 случайных байт → 96-символьная hex-строка.

#### hashRefreshToken(token) → string
SHA-256(token) → 64-символьная hex-строка. В БД хранится только хеш, не сам токен.

#### computeRefreshExpiresAt() → string
`Date.now() + REFRESH_TOKEN_EXPIRES_MS` → ISO-строка.

---

### utils/cookieOptions.js

Константы и функции для auth-cookies.

Константы: `REFRESH_COOKIE_NAME = 'refresh_token'`, `CSRF_COOKIE_NAME = 'csrf_token'`, `AUTH_COOKIE_PATH = '/api/auth'`.

#### refreshCookieOptions() → CookieOptions
`httpOnly: true`, `sameSite: 'lax'`, `secure: NODE_ENV === 'production'`, `path: '/api/auth'`, `maxAge: REFRESH_TOKEN_EXPIRES_MS`.

#### csrfCookieOptions() → CookieOptions
Аналогично, но `httpOnly: false` (читается JS-клиентом).

#### clearAuthCookieOptions() → CookieOptions
#### clearCsrfCookieOptions() → CookieOptions

#### generateCsrfToken() → string
`randomBytes(32).toString('hex')` → 64-символьная строка.

---

### utils/date.js

#### normalizeInputDate(dateInput) → string
Нормализует входящую дату к ISO-строке UTC. `'2024-06-13'` → `'2024-06-13T00:00:00Z'`.

---

### utils/uid.js

UID через nanoid с проверкой уникальности в БД (до 10 попыток при коллизии).

#### generateBookmarkUid() → string
8 символов.

#### generateCategoryUid() → string
4 символа.

#### generateTagUid() → string
5 символов.

---

## Сервисы

### services/sessionService.js

Управление refresh-сессиями. Инкапсулирует логику таблицы `sessions`.

#### createSession({ userId, familyId?, userAgent?, ipAddress? }) → { refreshToken, session }
Создаёт сессию. Если `familyId` не передан — генерируется новый (новый логин). Хеш токена записывается в БД.

#### rotateSession(rawRefreshToken, { userAgent?, ipAddress? }) → result
Выполняется в `db.transaction()`. Статусы ответа:
- `{ status: 'ok', refreshToken, oldSession, newSession }` — успешная ротация
- `{ status: 'reuse_detected', userId }` — повторное использование отозванного токена; вся цепочка `family_id` аннулирована
- `{ status: 'not_found' | 'expired' | 'revoked' }` — невалидный токен

#### revokeSessionByToken(rawRefreshToken) → boolean
`true` если сессия найдена и отозвана.
