---
name: add-api-route
description: Добавляет новый API-роут в MemoBoard backend, соблюдая соглашения проекта. Используй когда нужно добавить endpoint, создать новый роут, расширить API событий или закладок.
---

# Добавить новый API-роут (MemoBoard Backend)

## Структура проекта

```
backend/routes/
├── events/index.js       # События
└── bookmarks/
    ├── index.js          # Закладки
    ├── categories.js     # Категории
    └── tags.js           # Теги
```

Перед написанием нового роута — прочитай существующий файл той же сущности как образец.

## Форматы ответов

```js
// GET с данными
res.json({ data: result })

// Создание
res.status(201).json({ data: result })

// Обновление / Удаление (большинство)
res.json({ success: true })

// DELETE событий — без тела
res.status(204).send()
```

## Форматы ошибок

```js
res.status(400).json({ error: 'Некорректные данные' })
res.status(404).json({ error: 'Сущность не найдена' })
res.status(500).json({ error: 'Не удалось выполнить операцию' })
```

Все ошибки логировать: `console.error('[route-name] описание:', error)`

## Валидация id

Всегда валидируй `id` до запроса в БД:

```js
if (!id || typeof id !== 'string' || id.trim() === '') {
  return res.status(400).json({ error: 'Некорректный идентификатор' })
}
```

## Генерация UID

```js
import { generateBookmarkUid } from '../../utils/uid.js'  // 8 символов
import { generateCategoryUid } from '../../utils/uid.js'  // 4 символа
import { generateTagUid } from '../../utils/uid.js'       // 5 символов
```

## Транзакции

Операции с несколькими таблицами — только в транзакции:

```js
const transaction = db.transaction(() => {
  // все операции
})
transaction()
```

## Удаление закладки

При `DELETE` закладки обязательно удалять файл превью:

```js
import { deletePreview } from '../../utils/preview.js'

const bookmark = db.prepare('SELECT preview FROM bookmarks WHERE id = ?').get(id)
if (!bookmark) return res.status(404).json({ error: 'Закладка не найдена' })

await deletePreview(bookmark.preview)
db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id)
```

## Чеклист перед завершением

- [ ] Формат ответа соответствует соглашениям (`{ data }` / `{ success }`)
- [ ] Все ошибки возвращают `{ error: "..." }`
- [ ] `id` валидируется до запроса в БД
- [ ] `console.error` есть в блоке `catch`
- [ ] Операции с несколькими таблицами — в транзакции
- [ ] При удалении закладки — удаляется превью с диска
