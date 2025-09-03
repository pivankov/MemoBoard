## База данных (SQLite + better-sqlite3)

- Файл БД: `db/data.db`
- Версия схемы: `PRAGMA user_version` (текущая — 1)
- Дата/время: TEXT в ISO‑8601 UTC (`YYYY-MM-DDTHH:MM:SSZ`)
- Булево: INTEGER 0/1, с `CHECK (field IN (0,1))`

### Инициализация и сиды
- Команда (с сидами): `npm run db:init`
- Создаёт таблицы, включает внешние ключи, добавляет базовые данные:

- Команда (без сидов): `npm run db:init:noseed`
  - Создаёт только схему БД, без вставки пользователей/типов/событий.

- Сброс БД: `npm run db:reset`
  - Удаляет файл `db/data.db` и запускает полную инициализацию с сидами.

- Сброс БД без сидов: `npm run db:reset:noseed`
  - Удаляет файл `db/data.db` и запускает инициализацию без сидов.

Опции запуска CLI:
- Флаг `--no-seed` (или `--noseed`) отключает сиды: `node ./db/cli-init.js --no-seed`
- Переменная окружения `SEED=false` также отключает сиды: `SEED=false npm run db:init`

### Таблицы

#### users
- `id` INTEGER PRIMARY KEY
- `uid` TEXT UNIQUE NOT NULL
- `email` TEXT UNIQUE
- `name` TEXT
- `password_hash` TEXT NOT NULL
- `password_algo` TEXT NOT NULL DEFAULT 'argon2id'
- `password_updated_at` TEXT NOT NULL DEFAULT (datetime('now'))
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
- `is_recurring` INTEGER NOT NULL DEFAULT 0 CHECK (is_recurring IN (0,1))
- `created_at` TEXT NOT NULL DEFAULT (datetime('now'))
- `updated_at` TEXT NOT NULL DEFAULT (datetime('now'))
- UNIQUE(user_id, uid)

Индексы:
- `events(user_id)`
- `events(user_id, start_at)`
- `events(user_id, type_id)`

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
3. При необходимости поднимите версию схемы и добавьте миграцию.
4. Добавьте сид‑данные (опционально).


