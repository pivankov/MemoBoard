---
description: Правила разработки бэкенда MemoBoard. Применяется при работе с файлами в папке backend/.
globs: backend/**/*
---

# Бэкенд MemoBoard

## Структура и документация

- `backend/app.js` - файл запуска бэкенд приложения
- `backend/db/initdb.js` - Инициализация базы данных

Полная структура проекта и API-справочник: `backend/README.md`
Схема БД, таблицы, миграции: `backend/db/README.md`

Перед написанием нового роута — изучи существующий файл той же сущности как образец.

## Форматы ответов API

```js
// GET с данными
res.json({ data: result })

// Создание
res.status(201).json({ data: result })

// Обновление / Удаление
res.json({ success: true })

// DELETE событий — без тела
res.status(204).send()
```

## Формат ошибок

Единый формат для всех эндпоинтов:

```js
res.status(400).json({ error: 'Некорректные данные' })
res.status(404).json({ error: 'Сущность не найдена' })
res.status(500).json({ error: 'Не удалось выполнить операцию' })
```

В блоке `catch` всегда логировать: `console.error('[route-name]', error)`

## Паттерны роутов

### Валидация id

Всегда валидировать `id` до запроса в БД:

```js
if (!id || typeof id !== 'string' || id.trim() === '') {
  return res.status(400).json({ error: 'Некорректный идентификатор' })
}
```

### Генерация UID

```js
import { generateBookmarkUid } from '../utils/uid.js'   // 8 символов
import { generateCategoryUid } from '../utils/uid.js'   // 4 символа
import { generateTagUid } from '../utils/uid.js'        // 5 символов
```

### Транзакции

Операции с несколькими таблицами — только в транзакции:

```js
const transaction = db.transaction(() => {
  // все операции
})
transaction()
```

## Утилиты превью (utils/preview.js)

При **создании** закладки: провал скачивания превью — не ошибка, закладка создаётся в любом случае.

При **удалении** закладки: обязательно удалять файл с диска до или после удаления записи:

```js
import { extractPreviewUrl, downloadPreview, deletePreview, getFaviconUrl } from '../utils/preview.js'

// Цепочка получения превью: og:image → twitter:image → favicon
let previewUrl = extractPreviewUrl(metadata) ?? getFaviconUrl(url)
const preview = await downloadPreview(previewUrl, uid) ?? ''

// При удалении
await deletePreview(bookmark.preview)
```

## Утилиты дат (utils/date.js)

Нормализовывать входящие даты перед сохранением в БД:

```js
import { normalizeInputDate } from '../utils/date.js'

normalizeInputDate('2024-06-13') // => "2024-06-13T00:00:00Z"
```

## База данных

### Типы данных SQLite

`better-sqlite3` — синхронный драйвер, не использовать `async/await` для запросов к БД.

- Даты → `TEXT` в формате ISO-8601 UTC (`YYYY-MM-DDTHH:MM:SSZ`), **не** `DATETIME`
- Булево → `INTEGER NOT NULL DEFAULT 0 CHECK (field IN (0,1))`, **не** `BOOLEAN`

### Стандартный паттерн таблицы

```sql
CREATE TABLE IF NOT EXISTS example (
  id         INTEGER PRIMARY KEY,
  uid        TEXT UNIQUE NOT NULL,
  title      TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_example_field ON example(field);
```

Внешние ключи: `ON DELETE CASCADE ON UPDATE RESTRICT`

### Добавление новой таблицы

1. Определи поля — даты как `TEXT ISO-8601`, булево как `INTEGER 0/1 + CHECK`
2. Добавь SQL в `db/initdb.js` по аналогии с существующими таблицами
3. Подними `SCHEMA_VERSION` и добавь функцию `migrateFromXToY`
4. Добавь сид-данные в `db/seeds/` (опционально)
5. Обнови документацию в `backend/db/README.md`
