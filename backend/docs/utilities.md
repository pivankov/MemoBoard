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

Утилиты для работы с JWT-токенами.

**Функции:**
- `generateToken(user)` - Создаёт подписанный JWT-токен. Принимает объект `{ id, uid, email }`, возвращает строку токена. Срок действия задаётся переменной `JWT_EXPIRES_IN`
- `verifyToken(token)` - Верифицирует и декодирует токен. Возвращает payload. Бросает `TokenExpiredError` или `JsonWebTokenError` при ошибке

**Конфигурация через переменные окружения:**
- `JWT_SECRET` — секрет для подписи. **Обязателен**, минимум 32 символа. Сервер не стартует, если переменная не задана или слишком короткая (fail-fast). Сгенерировать: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `JWT_EXPIRES_IN` — срок действия токена (по умолчанию: `7d`)

**Пример:**
```javascript
import { generateToken, verifyToken } from './utils/jwt.js';

const token = generateToken({ id: 1, uid: 'abc-123', email: 'user@example.com' });
// => "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

const payload = verifyToken(token);
// => { userId: 1, uid: 'abc-123', email: 'user@example.com', iat: ..., exp: ... }
```

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
