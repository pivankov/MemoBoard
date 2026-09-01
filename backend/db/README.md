# База данных

- Файл БД: `db/data.db`
- Версия схемы: `PRAGMA user_version` (текущая — **4**)
- Дата/время: TEXT в ISO‑8601 UTC (`YYYY-MM-DDTHH:MM:SSZ`)
- Булево: INTEGER 0/1, с `CHECK (field IN (0,1))`

### Инициализация и сиды

- **`npm run db:init`** — создаёт схему и сеет demo-пользователя с DUMMY-данными, если `data.db` ещё не инициализирована. Если уже инициализирована (`user_version` совпадает со `SCHEMA_VERSION`) — ничего не делает.

- **`npm run db:reset`** — полный снос: удаляет `data.db` и запускает `db:init` заново. Используется в dev при изменении схемы.

- **`npm run db:reset:demo`** — не трогает БД целиком. Удаляет все события, закладки, категории и теги, принадлежащие `demo@example.com`, а также связанные файлы превью в `uploads/previews/`. Затем заново засевает DUMMY-данные для demo-пользователя. Данные других пользователей **не затрагиваются**.

### Таблицы

#### users
- `id` INTEGER PRIMARY KEY
- `uid` TEXT UNIQUE NOT NULL
- `email` TEXT UNIQUE
- `name` TEXT
- `password_hash` TEXT NOT NULL
- `password_algo` TEXT NOT NULL DEFAULT 'argon2id'
- `password_updated_at` TEXT NOT NULL DEFAULT (datetime('now'))
- `role` TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')) — роль пользователя
- `status` TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')) — состояние аккаунта
- `created_at` TEXT NOT NULL DEFAULT (datetime('now'))
- `updated_at` TEXT NOT NULL DEFAULT (datetime('now'))

Индексы: UNIQUE по `uid`, `email` (уникальность покрывает индекс).

#### event_types
- `id` INTEGER PRIMARY KEY
- `title` TEXT NOT NULL
- `slug` TEXT NOT NULL UNIQUE

Индексы: UNIQUE по `slug` (уникальность покрывает индекс).

#### events
- `id` INTEGER PRIMARY KEY
- `uid` TEXT NOT NULL
- `user_id` INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT
- `title` TEXT NOT NULL
- `type_id` INTEGER NOT NULL REFERENCES event_types(id) ON DELETE RESTRICT ON UPDATE RESTRICT
- `start_at` TEXT NOT NULL
- `description` TEXT
- `recurrence` TEXT NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none','monthly','yearly'))
- `created_at` TEXT NOT NULL DEFAULT (datetime('now'))
- `updated_at` TEXT NOT NULL DEFAULT (datetime('now'))
- UNIQUE(user_id, uid)

Индексы:
- `idx_events_user_id` на `events(user_id)`
- `idx_events_user_start_at` на `events(user_id, start_at)`
- `idx_events_user_type` на `events(user_id, type_id)`

#### bookmark_categories
- `id` INTEGER PRIMARY KEY
- `uid` TEXT UNIQUE NOT NULL
- `user_id` INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE — владелец категории
- `parent_id` INTEGER REFERENCES bookmark_categories(id) ON DELETE SET NULL
- `title` TEXT NOT NULL
- `icon` TEXT
- `position` INTEGER NOT NULL DEFAULT 0
- `created_at` TEXT NOT NULL DEFAULT (datetime('now'))
- `updated_at` TEXT NOT NULL DEFAULT (datetime('now'))

Индексы:
- UNIQUE по `uid` (уникальность покрывает индекс).
- `idx_bookmark_categories_user_id` на `bookmark_categories(user_id)`

#### bookmark_tags
- `id` INTEGER PRIMARY KEY
- `uid` TEXT UNIQUE NOT NULL
- `user_id` INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE — владелец тега
- `title` TEXT NOT NULL
- `created_at` TEXT NOT NULL DEFAULT (datetime('now'))
- `updated_at` TEXT NOT NULL DEFAULT (datetime('now'))

Индексы:
- UNIQUE по `uid` (уникальность покрывает индекс).
- `idx_bookmark_tags_user_id` на `bookmark_tags(user_id)`

#### bookmarks
- `id` INTEGER PRIMARY KEY
- `uid` TEXT UNIQUE NOT NULL
- `user_id` INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT
- `category_id` INTEGER REFERENCES bookmark_categories(id) ON DELETE SET NULL ON UPDATE RESTRICT
- `url` TEXT NOT NULL
- `title` TEXT NOT NULL
- `description` TEXT
- `preview` TEXT — относительный путь к файлу превью (например: `/previews/xK9pLm2n.webp`), пустая строка если превью отсутствует
- `opened_at` TEXT
- `transition_counter` INTEGER NOT NULL DEFAULT 0
- `favorite` INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0,1))
- `in_trash` INTEGER NOT NULL DEFAULT 0 CHECK (in_trash IN (0,1)) — флаг корзины: `1` = закладка в корзине, `0` = активна. При перемещении в корзину `category_id` не обнуляется — оригинальная категория сохраняется для последующего восстановления
- `created_at` TEXT NOT NULL DEFAULT (datetime('now'))
- `updated_at` TEXT NOT NULL DEFAULT (datetime('now'))

Индексы:
- UNIQUE по `uid` (уникальность покрывает индекс).
- `idx_bookmarks_user_id` на `bookmarks(user_id)`
- `idx_bookmarks_category_id` на `bookmarks(category_id)`

#### bookmark_tag_relations
- `bookmark_id` INTEGER NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE
- `tag_id` INTEGER NOT NULL REFERENCES bookmark_tags(id) ON DELETE CASCADE
- PRIMARY KEY (bookmark_id, tag_id)

Индексы:
- `idx_bookmark_tag_relations_bookmark_id` на `bookmark_tag_relations(bookmark_id)`
- `idx_bookmark_tag_relations_tag_id` на `bookmark_tag_relations(tag_id)`

#### sessions

Хранит refresh-сессии пользователей. Каждая запись соответствует одному refresh-токену. При ротации старая запись сохраняется (с `replaced_by_id` и `revoked_at` = NULL пока активна), новая создаётся.

- `id` INTEGER PRIMARY KEY — внутренний ID
- `uid` TEXT UNIQUE NOT NULL — публичный UUID (для будущего API `/api/auth/sessions/:uid`)
- `user_id` INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE — владелец сессии
- `family_id` TEXT NOT NULL — UUID цепочки ротаций одного логина (все токены одного входа имеют одинаковый `family_id`)
- `token_hash` TEXT UNIQUE NOT NULL — SHA-256(refresh_token) в hex (64 символа); сам токен в БД не хранится
- `expires_at` TEXT NOT NULL — ISO-timestamp истечения refresh-токена
- `revoked_at` TEXT — NULL = сессия активна; иначе — момент аннулирования
- `replaced_by_id` INTEGER REFERENCES sessions(id) ON DELETE SET NULL — ссылка на новую сессию после ротации
- `user_agent` TEXT — User-Agent клиента (для будущего UI «Мои устройства»)
- `ip_address` TEXT — IP-адрес клиента
- `created_at` TEXT NOT NULL DEFAULT datetime('now')
- `last_used_at` TEXT NOT NULL DEFAULT datetime('now')

Индексы:
- `idx_sessions_user_id` на `sessions(user_id)`
- `idx_sessions_family_id` на `sessions(family_id)`
- `idx_sessions_token_hash` на `sessions(token_hash)`
- `idx_sessions_expires_at` на `sessions(expires_at)`

Логика session family и reuse detection — в [docs/architecture.md](../docs/architecture.md).

Поля `user_agent` и `ip_address` хранятся в сессиях, но при ротации не проверяются (token binding запланирован).

#### api_tokens

Хранит Personal Access Token (PAT) для аутентификации браузерного расширения. Как и `sessions`, хранит только хеш токена — raw-значение в БД не сохраняется.

- `id` INTEGER PRIMARY KEY — внутренний ID
- `uid` TEXT UNIQUE NOT NULL — публичный UUID токена (используется в API управления ключами, например при отзыве)
- `user_id` INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE — владелец токена
- `token_hash` TEXT UNIQUE NOT NULL — SHA-256(PAT) в hex (64 символа); сам токен в БД не хранится
- `name` TEXT — название ключа (генерируется автоматически при создании)
- `created_at` TEXT NOT NULL DEFAULT datetime('now')
- `last_used_at` TEXT — NULL пока токен не использован; обновляется best-effort при каждой успешной аутентификации по PAT
- `revoked_at` TEXT — NULL = токен активен; иначе — момент отзыва

Индексы:
- `idx_api_tokens_user_id` на `api_tokens(user_id)`
- `idx_api_tokens_token_hash` на `api_tokens(token_hash)`

### Данные для посева (seeds)

Данные для инициализации базы данных находятся в директории `db/seeds/`:
- `events.js` — события
- `bookmarks.js` — категории, теги и закладки

При первом запуске создаётся демо-пользователь `demo@example.com` / пароль `demo` с demo-данными. Новые пользователи стартуют с пустым набором данных. Скрипт идемпотентен: повторный запуск не создаёт дубликаты (`INSERT OR IGNORE`).

**Важно:** Файл `bookmarks.js` содержит только пользовательские категории и теги. Системные категории ("Несортированные", "Корзина") в базе данных **не хранятся** — они реализованы через отдельные API endpoints и флаг `in_trash` в таблице `bookmarks`. Закладки без категории (несортированные) имеют `category_id = NULL`.

### Примеры SQL

Создание таблицы (образец):
```sql
CREATE TABLE IF NOT EXISTS example (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_example_is_active ON example(is_active);
```

Внешний ключ:
```sql
CREATE TABLE IF NOT EXISTS child (
  id INTEGER PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES parent(id) ON DELETE CASCADE ON UPDATE RESTRICT
);
```

### Добавление новой таблицы
1. Определите поля и ограничения (даты — TEXT ISO‑8601, булево — 0/1 + CHECK).
2. Добавьте описание полей и SQL в `db/initdb.js` по аналогии с существующими.
3. При необходимости поднимите версию схемы (`SCHEMA_VERSION`) и добавьте функцию миграции (`migrateFromXToY`).
4. Добавьте сид‑данные (опционально) в соответствующий файл в `db/seeds/`.
5. Обновите документацию в `db/README.md`.

### Экспорты initdb.js

`initdb.js` экспортирует константу `SESSIONS_FIELDS` — массив имён столбцов таблицы `sessions`. Используется в `services/sessionService.js` для безопасного формирования SELECT-запросов. Аналогично экспортируется `API_TOKENS_FIELDS` — описание полей таблицы `api_tokens`.

### Миграции

Миграции выполняются автоматически при инициализации БД. Текущие миграции:
- `migrateFrom0To1`: создание всех таблиц (`users`, `event_types`, `events`, `bookmark_categories`, `bookmark_tags`, `bookmarks`, `bookmark_tag_relations`), индексов и триггеров; посев демо-данных для пользователя `demo@example.com` (при включённых сидах).
- `migrateFrom1To2`: создание таблицы `sessions` и её индексов.
- `migrateFrom2To3`: добавление полей `role` и `status` в таблицу `users`; пересоздание триггера `users_set_updated_at` с учётом новых полей.
- `migrateFrom3To4`: создание таблицы `api_tokens` и её индексов.

Все миграции идемпотентны и безопасны для повторного запуска: схема создаётся через `CREATE TABLE IF NOT EXISTS`, сиды проверяют наличие записей по `uid` перед вставкой.

